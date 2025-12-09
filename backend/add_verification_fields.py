import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load .env so Mongo details are available
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "secret_santa")

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    result = await db.deeds.update_many(
        {"verification_status": {"$exists": False}},
        {"$set": {
            "verification_status": "pending",   # default state
            "receiver_id": None,
            "verified_at": None,
            "marked_complete": False
        }}
    )

    print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
