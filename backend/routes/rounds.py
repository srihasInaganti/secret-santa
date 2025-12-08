import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import random
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from main import get_db
from models import Round, DeedAssignment, MemberStatus

router = APIRouter(prefix="/rounds", tags=["rounds"])


async def get_random_deed_template(db: AsyncIOMotorDatabase) -> str:
    """Helper to get a random deed template"""
    templates_col = db["deed_templates"]
    templates = []
    async for t in templates_col.find():
        templates.append(t["description"])

    if not templates:
        # Fallback deeds - use {target} as placeholder
        templates = [
            "Do something kind for {target} today",
            "Give {target} a genuine compliment",
            "Help {target} with a task without being asked",
            "Buy {target} their favorite drink or snack",
            "Write a thank you note to {target}",
            "Send {target} an encouraging message",
        ]

    return random.choice(templates)


async def assign_deeds_to_members(db: AsyncIOMotorDatabase, round_id: str, group_id: str):
    """Assign random deeds to all group members, each targeting another member"""
    members_col = db["group_members"]
    users_col = db["users"]
    deeds_col = db["deeds"]

    # Get all group members with their user info
    members = []
    async for m in members_col.find({"group_id": group_id}):
        user = await users_col.find_one({"_id": ObjectId(m["user_id"])})
        if user:
            members.append({
                "user_id": m["user_id"],
                "name": user["name"]
            })

    if len(members) < 2:
        # Not enough members for Secret Santa style assignment
        for member in members:
            deed_template = await get_random_deed_template(db)
            deed_description = deed_template.replace("{target}", "someone")
            await deeds_col.insert_one({
                "round_id": round_id,
                "user_id": member["user_id"],
                "target_user_id": None,
                "target_user_name": None,
                "deed_description": deed_description,
                "completed": False,
                "completed_at": None,
                "created_at": datetime.utcnow(),
            })
        return

    # Create a shuffled list of targets (Secret Santa style)
    # Each person gets assigned to do a deed for someone else
    member_ids = [m["user_id"] for m in members]
    targets = member_ids.copy()

    # Shuffle until no one is assigned to themselves
    max_attempts = 100
    for _ in range(max_attempts):
        random.shuffle(targets)
        valid = True
        for i, member_id in enumerate(member_ids):
            if member_id == targets[i]:
                valid = False
                break
        if valid:
            break

    # Assign deeds
    for i, member in enumerate(members):
        target_id = targets[i]
        target_member = next((m for m in members if m["user_id"] == target_id), None)
        target_name = target_member["name"] if target_member else "someone"

        deed_template = await get_random_deed_template(db)
        deed_description = deed_template.replace("{target}", target_name)

        await deeds_col.insert_one({
            "round_id": round_id,
            "user_id": member["user_id"],
            "target_user_id": target_id,
            "target_user_name": target_name,
            "deed_description": deed_description,
            "completed": False,
            "completed_at": None,
            "created_at": datetime.utcnow(),
        })


@router.get("/{round_id}", response_model=Round)
async def get_round(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get round details"""
    rounds_col = db["rounds"]
    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    rnd["_id"] = str(rnd["_id"])
    return Round(**rnd)


@router.get("/{round_id}/status", response_model=List[MemberStatus])
async def get_round_status(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all members and their completion status for this round"""
    rounds_col = db["rounds"]
    members_col = db["group_members"]
    users_col = db["users"]
    deeds_col = db["deeds"]

    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = rnd["group_id"]

    # Get all deeds for this round
    deeds_map = {}
    async for deed in deeds_col.find({"round_id": round_id}):
        deeds_map[deed["user_id"]] = deed

    # Get all group members with their status
    results = []
    async for m in members_col.find({"group_id": group_id}):
        user = await users_col.find_one({"_id": ObjectId(m["user_id"])})
        if user:
            user_id = str(user["_id"])
            deed = deeds_map.get(user_id, {})
            results.append(MemberStatus(
                _id=user_id,
                name=user["name"],
                completed=deed.get("completed", False),
                deed_description=deed.get("deed_description")
            ))

    return results


@router.get("/{round_id}/check-complete")
async def check_round_complete(round_id: str, user_id: str = Query(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Check if all members have completed their deeds and if user should see celebration"""
    rounds_col = db["rounds"]
    members_col = db["group_members"]
    deeds_col = db["deeds"]
    celebrations_col = db["celebrations_seen"]

    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = rnd["group_id"]
    round_status = rnd.get("status", "active")

    # Check if this user has already seen the celebration for THIS round
    user_has_seen = False
    if user_id:
        seen = await celebrations_col.find_one({"round_id": round_id, "user_id": user_id})
        user_has_seen = seen is not None

    # Check if round is already completed
    if round_status == "completed":
        # Find the new active round
        new_round = await rounds_col.find_one({"group_id": group_id, "status": "active"})
        new_round_id = str(new_round["_id"]) if new_round else None

        return {
            "round_id": round_id,
            "total_members": 0,
            "completed_count": 0,
            "all_complete": True,
            "show_celebration": not user_has_seen,  # Show if user hasn't seen it
            "round_completed": True,
            "new_round_id": new_round_id
        }

    # Count members
    member_count = await members_col.count_documents({"group_id": group_id})

    # Count completed deeds
    completed_count = await deeds_col.count_documents({"round_id": round_id, "completed": True})

    all_complete = member_count > 0 and member_count == completed_count

    # Show celebration if all complete AND user hasn't seen it yet
    show_celebration = all_complete and not user_has_seen

    return {
        "round_id": round_id,
        "total_members": member_count,
        "completed_count": completed_count,
        "all_complete": all_complete,
        "show_celebration": show_celebration,
        "round_completed": False,
        "new_round_id": None
    }

@router.post("/{round_id}/advance", response_model=Round)
async def advance_to_next_round(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Complete current round and start a new one with new deed assignments"""
    rounds_col = db["rounds"]

    # Get current round
    current_round = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not current_round:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = current_round["group_id"]

    # Check if already completed - return existing new round
    if current_round.get("status") == "completed":
        new_round = await rounds_col.find_one({"group_id": group_id, "status": "active"})
        if new_round:
            new_round["_id"] = str(new_round["_id"])
            return Round(**new_round)
        # If no active round exists, create one (edge case)

    # Mark current round as completed
    await rounds_col.update_one(
        {"_id": ObjectId(round_id)},
        {"$set": {"status": "completed"}}
    )

    # Create new round name (next week)
    today = datetime.utcnow()
    next_week = today + timedelta(days=7)
    round_name = "Week of " + next_week.strftime("%b %d")

    # Create new round
    new_round_doc = {
        "group_id": group_id,
        "name": round_name,
        "status": "active",
        "created_at": datetime.utcnow(),
    }
    res = await rounds_col.insert_one(new_round_doc)
    new_round_id = str(res.inserted_id)
    new_round_doc["_id"] = new_round_id

    # Assign new deeds to all members
    await assign_deeds_to_members(db, new_round_id, group_id)

    return Round(**new_round_doc)


@router.post("/{round_id}/celebration-seen")
async def mark_celebration_seen(round_id: str, user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Mark that a user has seen the celebration for this round"""
    celebrations_col = db["celebrations_seen"]

    # Check if already marked
    existing = await celebrations_col.find_one({"round_id": round_id, "user_id": user_id})
    if existing:
        return {"already_seen": True}

    await celebrations_col.insert_one({
        "round_id": round_id,
        "user_id": user_id,
        "seen_at": datetime.utcnow()
    })

    return {"marked": True}


@router.post("/{round_id}/advance", response_model=Round)
async def advance_to_next_round(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Complete current round and start a new one with new deed assignments"""
    rounds_col = db["rounds"]

    # Get current round
    current_round = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not current_round:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = current_round["group_id"]

    # Mark current round as completed
    await rounds_col.update_one(
        {"_id": ObjectId(round_id)},
        {"$set": {"status": "completed"}}
    )

    # Create new round name (next week)
    today = datetime.utcnow()
    next_week = today + timedelta(days=7)
    round_name = "Week of " + next_week.strftime("%b %d")

    # Create new round
    new_round_doc = {
        "group_id": group_id,
        "name": round_name,
        "status": "active",
        "created_at": datetime.utcnow(),
    }
    res = await rounds_col.insert_one(new_round_doc)
    new_round_id = str(res.inserted_id)
    new_round_doc["_id"] = new_round_id

    # Assign new deeds to all members
    await assign_deeds_to_members(db, new_round_id, group_id)

    return Round(**new_round_doc)


@router.get("/{round_id}/my-deed", response_model=DeedAssignment)
async def get_my_deed(round_id: str, user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get the deed assigned to a specific user for this round"""
    deeds_col = db["deeds"]

    deed = await deeds_col.find_one({"round_id": round_id, "user_id": user_id})
    if not deed:
        raise HTTPException(status_code=404, detail="No deed assigned yet")

    deed["_id"] = str(deed["_id"])
    return DeedAssignment(**deed)


@router.post("/{round_id}/complete", response_model=DeedAssignment)
async def complete_deed(round_id: str, user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Mark a user's deed as complete for this round"""
    deeds_col = db["deeds"]

    deed = await deeds_col.find_one({"round_id": round_id, "user_id": user_id})
    if not deed:
        raise HTTPException(status_code=404, detail="No deed assigned to this user")

    if deed.get("completed"):
        raise HTTPException(status_code=400, detail="Deed already completed")

    await deeds_col.update_one(
        {"_id": deed["_id"]},
        {"$set": {"completed": True, "completed_at": datetime.utcnow()}}
    )

    deed = await deeds_col.find_one({"_id": deed["_id"]})
    deed["_id"] = str(deed["_id"])
    return DeedAssignment(**deed)


@router.get("/{round_id}/deeds", response_model=List[DeedAssignment])
async def get_all_deeds(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all deed assignments for this round"""
    deeds_col = db["deeds"]
    items = []
    async for d in deeds_col.find({"round_id": round_id}):
        d["_id"] = str(d["_id"])
        items.append(DeedAssignment(**d))
    return items