import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from main import get_db
from models import Round, Deed, MemberStatus

router = APIRouter(prefix="/rounds", tags=["rounds"])


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

    # Get round
    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = rnd["group_id"]

    # Get all completed deeds for this round
    completed_user_ids = set()
    async for deed in deeds_col.find({"round_id": round_id}):
        completed_user_ids.add(deed["user_id"])

    # Get all group members with their status
    results = []
    async for m in members_col.find({"group_id": group_id}):
        user = await users_col.find_one({"_id": ObjectId(m["user_id"])})
        if user:
            user_id = str(user["_id"])
            results.append(MemberStatus(
                _id=user_id,
                name=user["name"],
                completed=user_id in completed_user_ids
            ))

    return results


@router.post("/{round_id}/complete", response_model=Deed)
async def complete_deed(round_id: str, user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Mark a user's deed as complete for this round"""
    rounds_col = db["rounds"]
    users_col = db["users"]
    deeds_col = db["deeds"]

    # Check round exists
    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")

    # Check user exists
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already completed
    existing = await deeds_col.find_one({"round_id": round_id, "user_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Deed already completed")

    # Create deed
    doc = {
        "round_id": round_id,
        "user_id": user_id,
        "completed_at": datetime.utcnow(),
    }
    res = await deeds_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return Deed(**doc)


@router.get("/{round_id}/deeds", response_model=List[Deed])
async def get_deeds(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all completed deeds for this round"""
    deeds_col = db["deeds"]
    items = []
    async for d in deeds_col.find({"round_id": round_id}):
        d["_id"] = str(d["_id"])
        items.append(Deed(**d))
    return items