from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============ USERS ============

class UserCreate(BaseModel):
    name: str


class User(BaseModel):
    id: str = Field(alias="_id")
    name: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ GROUPS ============

class GroupCreate(BaseModel):
    name: str


class Group(BaseModel):
    id: str = Field(alias="_id")
    name: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ ROUNDS ============

class RoundCreate(BaseModel):
    name: str  # e.g., "Week of Dec 9, 2024"


class Round(BaseModel):
    id: str = Field(alias="_id")
    group_id: str
    name: str
    status: str  # "active", "completed", or "celebrating"
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ DEED TEMPLATES ============

class DeedTemplateCreate(BaseModel):
    description: str  # e.g., "Compliment {target} 3 times" - use {target} as placeholder


class DeedTemplate(BaseModel):
    id: str = Field(alias="_id")
    description: str
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ DEED ASSIGNMENTS ============

class DeedAssignment(BaseModel):
    id: str = Field(alias="_id")
    round_id: str
    user_id: str
    target_user_id: Optional[str] = None  # The person the deed is for
    target_user_name: Optional[str] = None  # The person's name
    deed_description: str  # Full description with target name inserted
    completed: bool = False
    completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ USER CELEBRATION TRACKING ============

class CelebrationSeen(BaseModel):
    id: str = Field(alias="_id")
    round_id: str
    user_id: str
    seen_at: datetime

    class Config:
        populate_by_name = True


# ============ RESPONSES ============

class MemberStatus(BaseModel):
    id: str = Field(alias="_id")
    name: str
    completed: bool
    deed_description: Optional[str] = None

    class Config:
        populate_by_name = True