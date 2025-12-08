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


async def get_random_deed_description(db: AsyncIOMotorDatabase) -> str:
    """Helper to get a random deed description"""
    templates_col = db["deed_templates"]
    templates = []
    async for t in templates_col.find():
        templates.append(t["description"])

    if not templates:
        # Fallback deeds
        templates = [
            "Do something kind for someone today",
            "Compliment a coworker",
            "Help someone without being asked",
        ]

    return random.choice(templates)


async def assign_deeds_to_members(db: AsyncIOMotorDatabase, round_id: str, group_id: str):
    """Assign random deeds to all group members"""
    members_col = db["group_members"]
    deeds_col = db["deeds"]

    # Get all group members
    members = []
    async for m in members_col.find({"group_id": group_id}):
        members.append(m["user_id"])

    # Assign random deed to each member
    for user_id in members:
        deed_description = await get_random_deed_description(db)
        await deeds_col.insert_one({
            "round_id": round_id,
            "user_id": user_id,
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
async def check_round_complete(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Check if all members have completed their deeds"""
    rounds_col = db["rounds"]
    members_col = db["group_members"]
    deeds_col = db["deeds"]

    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = rnd["group_id"]

    # Count members
    member_count = await members_col.count_documents({"group_id": group_id})

    # Count completed deeds
    completed_count = await deeds_col.count_documents({"round_id": round_id, "completed": True})

    all_complete = member_count > 0 and member_count == completed_count

    return {
        "round_id": round_id,
        "total_members": member_count,
        "completed_count": completed_count,
        "all_complete": all_complete
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