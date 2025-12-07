from datetime import datetime, timedelta
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..main import get_db
from .auth import get_current_user
from ..models import RoundMember, UserPublic

router = APIRouter(prefix="/rounds", tags=["invites"])


async def get_rounds_collection(db: AsyncIOMotorDatabase):
    return db["rounds"]


async def get_invites_collection(db: AsyncIOMotorDatabase):
    return db["round_invites"]


async def get_members_collection(db: AsyncIOMotorDatabase):
    return db["round_members"]


@router.post("/{round_id}/invites")
async def create_invite(round_id: str, expires_minutes: int = 60*24, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    rounds_col = await get_rounds_collection(db)
    invites_col = await get_invites_collection(db)
    rnd = await rounds_col.find_one({"_id": __import__("bson").ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")
    if str(rnd.get("owner_user_id")) != (me._id or me.id):
        raise HTTPException(status_code=403, detail="Owner permission required")
    if rnd.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Round must be pending")

    token = secrets.token_urlsafe(24)
    doc = {
        "round_id": round_id,
        "token": token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=expires_minutes),
    }
    res = await invites_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"token": token, "expires_at": doc["expires_at"].isoformat()}


@router.post("/join-by-invite")
async def join_by_invite(token: str, db: AsyncIOMotorDatabase = Depends(get_db), me: UserPublic = Depends(get_current_user)):
    invites_col = await get_invites_collection(db)
    members_col = await get_members_collection(db)
    invite = await invites_col.find_one({"token": token})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.get("expires_at") and invite["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite expired")

    round_id = invite["round_id"]
    # Upsert membership
    await members_col.update_one(
        {"round_id": round_id, "user_id": me._id or me.id},
        {"$setOnInsert": {"round_id": round_id, "user_id": me._id or me.id, "joined_at": datetime.utcnow()}},
        upsert=True,
    )
    return {"joined": True, "round_id": round_id}
