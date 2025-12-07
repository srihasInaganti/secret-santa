from contextlib import asynccontextmanager
import os
from pathlib import Path
from typing import AsyncGenerator, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv


# Load environment variables from backend/.env at startup, regardless of CWD
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "secret_santa")

if not MONGO_URI:
	# We don't raise at import time to allow app to start; routes will return a clear error.
	print("[backend] Warning: MONGO_URI is not set. Set it in your .env file.")


class Mongo:
	"""Holds global Mongo client and db for the app lifetime."""

	client: Optional[AsyncIOMotorClient] = None
	db: Optional[AsyncIOMotorDatabase] = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
	# Startup
	if MONGO_URI:
		Mongo.client = AsyncIOMotorClient(MONGO_URI)
		Mongo.db = Mongo.client[MONGO_DB_NAME]
		# Optional: ping to verify connectivity early
		try:
			await Mongo.client.admin.command("ping")
			print(f"[backend] Connected to MongoDB database '{MONGO_DB_NAME}'.")
		except Exception as e:
			print(f"[backend] MongoDB ping failed: {e}")
	else:
		print("[backend] MONGO_URI missing; database features will be unavailable.")

	yield

	# Shutdown
	if Mongo.client:
		Mongo.client.close()
		Mongo.client = None
		Mongo.db = None
		print("[backend] MongoDB connection closed.")


app = FastAPI(lifespan=lifespan)


async def get_db() -> AsyncIOMotorDatabase:
	"""FastAPI dependency to provide the active database instance."""
	if Mongo.db is None:
		raise HTTPException(status_code=500, detail="Database not initialized. Check MONGO_URI in .env.")
	return Mongo.db


@app.get("/health")
async def health() -> JSONResponse:
	"""Basic app health endpoint."""
	return JSONResponse({"status": "ok"})


@app.get("/db/ping")
async def db_ping(db: AsyncIOMotorDatabase = Depends(get_db)) -> JSONResponse:
	"""Ping the MongoDB server to confirm connectivity."""
	try:
		await db.command("ping")
		return JSONResponse({"mongo": "ok", "db": MONGO_DB_NAME})
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"MongoDB ping failed: {e}")


# Routers
from .routes.auth import router as auth_router
from .routes.rounds import router as rounds_router

app.include_router(auth_router)
app.include_router(rounds_router)

