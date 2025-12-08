from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============ USERS ============

class UserCreate(BaseModel):
    username: str
    name: str


class User(BaseModel):
    id: str = Field(alias="_id")
    username: str
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
    status: str  # "active" or "completed"
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ DEEDS ============

class Deed(BaseModel):
    id: str = Field(alias="_id")
    round_id: str
    user_id: str
    completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


# ============ RESPONSES ============

class MemberStatus(BaseModel):
    id: str = Field(alias="_id")
    username: str
    name: str
    completed: bool

    class Config:
        populate_by_name = True