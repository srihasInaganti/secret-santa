import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..main import get_db
from .auth import get_current_user
from ..models import Round, RoundCreate, PlayerAssignment, GoodDeedCreate, GoodDeedPublic, UserPublic, RoundMember

router = APIRouter(prefix="/rounds", tags=["rounds"])


async def get_rounds_collection(db: AsyncIOMotorDatabase):
    return db["rounds"]


async def get_assignments_collection(db: AsyncIOMotorDatabase):
    return db["assignments"]


async def get_deeds_collection(db: AsyncIOMotorDatabase):
    return db["deeds"]


async def get_members_collection(db: AsyncIOMotorDatabase):
    return db["round_members"]


def _gen_code() -> str:
    import secrets
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # avoid ambiguous chars
    return "".join(secrets.choice(alphabet) for _ in range(6))


@router.post("/", response_model=Round)
async def create_round(payload: RoundCreate, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    rounds = await get_rounds_collection(db)
    code = _gen_code()
    doc = {
        "name": payload.name,
        "owner_user_id": me._id or me.id,  # Pydantic alias handling
        "access_code": code,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    res = await rounds.insert_one(doc)
    created = await rounds.find_one({"_id": res.inserted_id})
    created["_id"] = str(created["_id"]) if "_id" in created else None
    return Round(**created)


@router.post("/{round_id}/players", response_model=List[UserPublic])
async def add_players(round_id: str, emails: List[str], db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    # Owner can add users by email; they must already exist (signup flow)
    users_col = db["users"]
    members_col = await get_members_collection(db)
    # Only owner can add
    rounds_col = await get_rounds_collection(db)
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    if str(rnd.get("owner_user_id")) != (me._id or me.id):
        raise HTTPException(status_code=403, detail="Only owner can add members")
    found = []
    for email in emails:
        user = await users_col.find_one({"email": email})
        if not user:
            continue
        user["_id"] = str(user["_id"]) if "_id" in user else None
        found.append(UserPublic(**user))
        # Upsert membership
        await members_col.update_one(
            {"round_id": round_id, "user_id": user["_id"]},
            {"$setOnInsert": {"round_id": round_id, "user_id": user["_id"], "joined_at": datetime.utcnow()}},
            upsert=True,
        )
    if not found:
        raise HTTPException(status_code=404, detail="No users found for given emails")
    return found


def _owner_guard(rnd: dict, me: UserPublic):
    if str(rnd.get("owner_user_id")) != (me._id or me.id):
        raise HTTPException(status_code=403, detail="Owner permission required")


@router.post("/{round_id}/join", response_model=RoundMember)
async def join_round(round_id: str, access_code: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    rounds_col = await get_rounds_collection(db)
    members_col = await get_members_collection(db)
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    if rnd.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Round is not open for joining")
    if rnd.get("access_code") != access_code:
        raise HTTPException(status_code=403, detail="Invalid access code")
    # Upsert membership for current user
    res = await members_col.update_one(
        {"round_id": round_id, "user_id": me._id or me.id},
        {"$setOnInsert": {"round_id": round_id, "user_id": me._id or me.id, "joined_at": datetime.utcnow()}},
        upsert=True,
    )
    member = await members_col.find_one({"round_id": round_id, "user_id": me._id or me.id})
    member["_id"] = str(member["_id"]) if "_id" in member else None
    return RoundMember(**member)


@router.get("/{round_id}/members", response_model=List[UserPublic])
async def list_members(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    members_col = await get_members_collection(db)
    users_col = db["users"]
    cursor = members_col.find({"round_id": round_id})
    items = []
    async for m in cursor:
        u = await users_col.find_one({"_id": __import__("bson").ObjectId(m["user_id"])})
        if not u:
            continue
        u["_id"] = str(u["_id"]) if "_id" in u else None
        items.append(UserPublic(**u))
    return items


@router.post("/{round_id}/start", response_model=List[PlayerAssignment])
async def start_round(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    users_col = db["users"]
    assignments_col = await get_assignments_collection(db)
    rounds_col = await get_rounds_collection(db)
    members_col = await get_members_collection(db)

    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    _owner_guard(rnd, me)
    if rnd.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Round already started or closed")

    # Load members
    mem_cursor = members_col.find({"round_id": round_id})
    users = []
    async for m in mem_cursor:
        u = await users_col.find_one({"_id": __import__("bson").ObjectId(m["user_id"])}, projection={"hashed_password": 0})
        if u:
            u["_id"] = str(u["_id"]) if "_id" in u else None
            users.append(u)
    if len(users) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 users to assign targets")

    # Create a random derangement: shuffle and ensure no one gets themselves; retry a few times
    ids = [u["_id"] for u in users]
    for _ in range(10):
        targets = ids[:]
        random.shuffle(targets)
        if all(p != t for p, t in zip(ids, targets)):
            break
    else:
        # Fallback: simple rotation guarantees no self assignment
        targets = ids[1:] + ids[:1]

    # Persist assignments
    await assignments_col.delete_many({"round_id": round_id})
    created = []
    for player_id, target_id in zip(ids, targets):
        doc = {
            "round_id": round_id,
            "player_user_id": player_id,
            "target_user_id": target_id,
            "created_at": datetime.utcnow(),
        }
        res = await assignments_col.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        created.append(PlayerAssignment(**doc))
    # Mark round started
    await rounds_col.update_one({"_id": __import__("bson").ObjectId(round_id)}, {"$set": {"status": "started"}})
    return created


@router.get("/{round_id}", response_model=Round)
async def get_round(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    rounds_col = await get_rounds_collection(db)
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    rnd["_id"] = str(rnd["_id"]) if "_id" in rnd else None
    return Round(**rnd)


@router.post("/{round_id}/regenerate-code", response_model=Round)
async def regenerate_code(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    rounds_col = await get_rounds_collection(db)
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    _owner_guard(rnd, me)
    if rnd.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Can only regenerate while pending")
    code = _gen_code()
    await rounds_col.update_one({"_id": __import__("bson").ObjectId(round_id)}, {"$set": {"access_code": code}})
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    rnd["_id"] = str(rnd["_id"]) if "_id" in rnd else None
    return Round(**rnd)


@router.post("/{round_id}/close", response_model=Round)
async def close_round(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    rounds_col = await get_rounds_collection(db)
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    _owner_guard(rnd, me)
    if rnd.get("status") != "started":
        raise HTTPException(status_code=400, detail="Round must be started to close")
    await rounds_col.update_one({"_id": __import__("bson").ObjectId(round_id)}, {"$set": {"status": "closed"}})
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    rnd["_id"] = str(rnd["_id"]) if "_id" in rnd else None
    return Round(**rnd)


@router.get("/{round_id}/my-target", response_model=UserPublic)
async def get_my_target(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    assignments_col = await get_assignments_collection(db)
    users_col = db["users"]
    assignment = await assignments_col.find_one({"round_id": round_id, "player_user_id": me._id or me.id})
    if not assignment:
        raise HTTPException(status_code=404, detail="No assignment found for you in this round")
    target = await users_col.find_one({"_id": __import__("bson").ObjectId(assignment["target_user_id"])})
    if not target:
        raise HTTPException(status_code=404, detail="Assigned target user not found")
    target["_id"] = str(target["_id"]) if "_id" in target else None
    return UserPublic(**target)


@router.post("/{round_id}/deeds", response_model=GoodDeedPublic)
async def submit_deed(round_id: str, payload: GoodDeedCreate, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    assignments_col = await get_assignments_collection(db)
    deeds_col = await get_deeds_collection(db)
    assignment = await assignments_col.find_one({"round_id": round_id, "player_user_id": me._id or me.id})
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned in this round")
    doc = {
        "user_id": me._id or me.id,
        "round_id": round_id,
        "target_user_id": assignment["target_user_id"],
        "title": payload.title,
        "description": payload.description,
        "created_at": datetime.utcnow(),
    }
    res = await deeds_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return GoodDeedPublic(**doc)


@router.get("/{round_id}/deeds", response_model=List[GoodDeedPublic])
async def list_deeds(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    deeds_col = await get_deeds_collection(db)
    cursor = deeds_col.find({"round_id": round_id})
    items = []
    async for d in cursor:
        d["_id"] = str(d["_id"]) if "_id" in d else None
        items.append(GoodDeedPublic(**d))
    return items
