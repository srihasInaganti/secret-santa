import sys
from pathlib import Path

# Ensures the main directory is available for imports like main and models
sys.path.insert(0, str(Path(__file__).parent.parent))

import random
from datetime import datetime, timedelta
from typing import List, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Path
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
    """Assign random deeds to all group members, setting up the giver (user_id)
    and the receiver (receiver_id) for verification (Secret Santa logic)."""
    members_col = db["group_members"]
    deeds_col = db["deeds"]

    # Get all group members
    members = []
    async for m in members_col.find({"group_id": group_id}):
        members.append(m["user_id"])

    if len(members) < 2:
        print(f"[Deeds] Warning: Group {group_id} has less than 2 members. Cannot assign with verification.")
        return

    # 1. Create a randomized circular assignment (Secret Santa pairing)
    givers = list(members)
    receivers = list(members)
    random.shuffle(receivers)

    # Ensure no one is assigned to themselves.
    attempts = 0
    while any(givers[i] == receivers[i] for i in range(len(givers))) and attempts < 100:
        random.shuffle(receivers)
        attempts += 1

    if attempts >= 100:
        print("[Deeds] Error: Failed to find non-self-assigned pairing.")

    # 2. Create DeedAssignment documents based on the pairing
    for i in range(len(members)):
        user_id = givers[i]        # The person performing the deed (Giver)
        receiver_id = receivers[i] # The person benefiting/verifying the deed (Receiver)
        
        deed_description = await get_random_deed_description(db)
        
        await deeds_col.insert_one({
            "round_id": round_id,
            "user_id": user_id,
            "receiver_id": receiver_id, # <-- NEW FIELD SET HERE
            "deed_description": deed_description,
            "completed": False,
            "completed_at": None,
            "verification_status": "active", # Start as active
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
    """Get all members and their completion status for this round, including verification status."""
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
                deed_description=deed.get("deed_description"),
                # --- NEW FIELDS ---
                verification_status=deed.get("verification_status", "active"),
                proof=deed.get("proof"),
                # ------------------
            ))

    return results


@router.get("/{round_id}/check-complete")
async def check_round_complete(round_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Check if all members have completed their deeds (based on verified completion)"""
    rounds_col = db["rounds"]
    members_col = db["group_members"]
    deeds_col = db["deeds"]

    rnd = await rounds_col.find_one({"_id": ObjectId(round_id)})
    if not rnd:
        raise HTTPException(status_code=404, detail="Round not found")

    group_id = rnd["group_id"]

    # Count members
    member_count = await members_col.count_documents({"group_id": group_id})

    # Count completed deeds (only True after verification/approval)
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

    # Assign new deeds to all members (now includes receiver_id pairing)
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


@router.post("/{round_id}/submit", response_model=DeedAssignment)
async def submit_deed( # Renamed from complete_deed to submit_deed
    round_id: str,
    user_id: str = Query(...),
    proof: str = Query(""),   # could be image URL, text, etc.
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """User submits proof that they completed their deed, marked as pending approval"""
    deeds_col = db["deeds"]

    deed = await deeds_col.find_one({"round_id": round_id, "user_id": user_id})
    if not deed:
        raise HTTPException(status_code=404, detail="No deed assigned to this user")
        
    # Prevent resubmission if already pending or approved
    if deed.get("verification_status") in ["pending", "approved"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Deed is already in '{deed.get('verification_status')}' status."
        )

    # Update to pending instead of complete
    await deeds_col.update_one(
        {"_id": deed["_id"]},
        {"$set": {
            "verification_status": "pending",
            "proof": proof,
            "submitted_at": datetime.utcnow()
        }}
    )

    updated = await deeds_col.find_one({"_id": deed["_id"]})
    updated["_id"] = str(updated["_id"])
    return DeedAssignment(**updated)

# NOTE: This route is better placed in a "deeds" router file, but we'll keep it here 
# since you gave me the rounds file.
@router.post("/{round_id}/verify", response_model=DeedAssignment)
async def verify_deed(
    round_id: str,
    target_user_id: str = Query(...),
approved: bool = Query(...),
    verifier_user_id: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Allows the recipient (verifier_user_id) to verify the target user's deed.
    approved=True → mark complete
    approved=False → rejected pending resubmission
    """
    deeds_col = db["deeds"]

    deed = await deeds_col.find_one({"round_id": round_id, "user_id": target_user_id})
    if not deed:
        raise HTTPException(status_code=404, detail="Deed not found")

    # CRUCIAL SECURITY CHECK: Does the verifier match the assigned receiver?
    if deed.get("receiver_id") != verifier_user_id:
        raise HTTPException(status_code=403, detail="You are not authorized to verify this deed.")
    
    # Check if the deed is actually pending verification (or rejected, allowing a second chance)
    if deed.get("verification_status") not in ["pending", "rejected"]:
        raise HTTPException(status_code=400, detail="Deed is not in a verifiable state.")

    new_status = "approved" if approved else "rejected"

    update = {
        "verification_status": new_status,
        "verified_by": verifier_user_id,
        "verified_at": datetime.utcnow()
    }

    if approved:
        update["completed"] = True
        update["completed_at"] = datetime.utcnow()
    else:
        # If rejected, set completed to False and clear proof to allow resubmission
        update["completed"] = False 
        update["proof"] = None 

    await deeds_col.update_one({"_id": deed["_id"]}, {"$set": update})

    updated = await deeds_col.find_one({"_id": deed["_id"]})
    updated["_id"] = str(updated["_id"])
    return DeedAssignment(**updated)


@router.get("/{round_id}/deeds", response_model=List[DeedAssignment])
async def get_all_deeds(
    round_id: str, 
    receiver_id: str = Query(None), # Accepts optional filter by receiver
    status: str = Query(None),      # Accepts optional filter by status (e.g., 'pending')
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all deed assignments for this round, optionally filtered by receiver and status."""
    deeds_col = db["deeds"]
    
    # 1. Build the filter query
    query = {"round_id": round_id}
    
    if receiver_id:
        query["receiver_id"] = receiver_id
    if status:
        query["verification_status"] = status
    
    # 2. Execute the query
    items = []
    async for d in deeds_col.find(query):
        d["_id"] = str(d["_id"])
        items.append(DeedAssignment(**d))
    return items