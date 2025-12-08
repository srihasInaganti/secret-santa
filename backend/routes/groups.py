import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from main import get_db
from models import Group, GroupCreate, User, Round, RoundCreate

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[Group])
async def list_groups(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all groups"""
    groups_col = db["groups"]
    items = []
    async for g in groups_col.find():
        g["_id"] = str(g["_id"])
        items.append(Group(**g))
    return items


@router.post("/", response_model=Group)
async def create_group(payload: GroupCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create a new group"""
    groups_col = db["groups"]

    doc = {
        "name": payload.name,
        "created_at": datetime.utcnow(),
    }
    res = await groups_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return Group(**doc)


@router.get("/{group_id}", response_model=Group)
async def get_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get group details"""
    groups_col = db["groups"]
    group = await groups_col.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group["_id"] = str(group["_id"])
    return Group(**group)


@router.post("/{group_id}/join", response_model=dict)
async def join_group(group_id: str, user_id: str = Query(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Join a group by user_id"""
    groups_col = db["groups"]
    users_col = db["users"]
    members_col = db["group_members"]

    # Check group exists
    group = await groups_col.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check user exists
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add to group (upsert)
    await members_col.update_one(
        {"group_id": group_id, "user_id": user_id},
        {"$setOnInsert": {"group_id": group_id, "user_id": user_id, "joined_at": datetime.utcnow()}},
        upsert=True,
    )

    return {"joined": True, "group_id": group_id, "user_id": user_id}


@router.get("/{group_id}/members", response_model=List[User])
async def get_group_members(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all members of a group"""
    members_col = db["group_members"]
    users_col = db["users"]

    cursor = members_col.find({"group_id": group_id})
    users = []
    async for m in cursor:
        user = await users_col.find_one({"_id": ObjectId(m["user_id"])})
        if user:
            user["_id"] = str(user["_id"])
            users.append(User(**user))
    return users


@router.get("/{group_id}/rounds", response_model=List[Round])
async def list_rounds(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all rounds in a group"""
    rounds_col = db["rounds"]
    items = []
    async for r in rounds_col.find({"group_id": group_id}).sort("created_at", -1):
        r["_id"] = str(r["_id"])
        items.append(Round(**r))
    return items


@router.post("/{group_id}/rounds", response_model=Round)
async def create_round(group_id: str, payload: RoundCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Start a new weekly round"""
    groups_col = db["groups"]
    rounds_col = db["rounds"]

    # Check group exists
    group = await groups_col.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Mark any active rounds as completed
    await rounds_col.update_many(
        {"group_id": group_id, "status": "active"},
        {"$set": {"status": "completed"}}
    )

    # Create new round
    doc = {
        "group_id": group_id,
        "name": payload.name,
        "status": "active",
        "created_at": datetime.utcnow(),
    }
    res = await rounds_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return Round(**doc)


@router.get("/{group_id}/current-round", response_model=Round)
async def get_current_round(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get the current active round for a group"""
    rounds_col = db["rounds"]

    rnd = await rounds_col.find_one({"group_id": group_id, "status": "active"})
    if not rnd:
        raise HTTPException(status_code=404, detail="No active round found")

    rnd["_id"] = str(rnd["_id"])
    return Round(**rnd)