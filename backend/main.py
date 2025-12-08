from contextlib import asynccontextmanager
import os
from pathlib import Path
from typing import AsyncGenerator
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

# Load environment variables
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "secret_santa")


class Mongo:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    if MONGO_URI:
        Mongo.client = AsyncIOMotorClient(MONGO_URI)
        Mongo.db = Mongo.client[MONGO_DB_NAME]
        try:
            await Mongo.client.admin.command("ping")
            print(f"[backend] Connected to MongoDB '{MONGO_DB_NAME}'")
        except Exception as e:
            print(f"[backend] MongoDB ping failed: {e}")
    else:
        print("[backend] Warning: MONGO_URI not set")

    yield

    if Mongo.client:
        Mongo.client.close()
        print("[backend] MongoDB connection closed")


app = FastAPI(lifespan=lifespan)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db() -> AsyncIOMotorDatabase:
    if Mongo.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    return Mongo.db


@app.get("/health")
async def health():
    return {"status": "ok"}


# Import and register routers
from routes import users, groups, rounds, deeds

app.include_router(users.router)
app.include_router(groups.router)
app.include_router(rounds.router)
app.include_router(deeds.router)