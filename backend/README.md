# Secret Santa Backend

FastAPI + MongoDB backend for creating and running Secret Santa rounds where players do good deeds for assigned targets.

## Overview

- Tech: FastAPI, Motor (MongoDB), Pydantic v2, JWT (python-jose), Passlib (bcrypt_sha256)
- Data: Mongo Atlas or local MongoDB
- Auth: Email + password, JWT bearer tokens
- Core: Rounds with access codes, membership, target assignments, and good deeds

## Environment

Create `backend/.env`:

```
MONGO_URI="mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/?appName=Cluster"
MONGO_DB_NAME="secret_santa"
JWT_SECRET="change_me_in_prod"
```

Notes:
- `MONGO_URI` is required.
- `JWT_SECRET` should be a long random string.

## Install & Run

Use the workspace virtualenv if present:

```bash
/Users/jameszhou/Desktop/secret-santa/.venv/bin/pip install -r /Users/jameszhou/Desktop/secret-santa/backend/requirements.txt
/Users/jameszhou/Desktop/secret-santa/.venv/bin/python -m uvicorn backend.main:app --reload
```

Server runs at `http://127.0.0.1:8000`.

## Data Models

- User
  - `_id`, `name`, `email`, `hashed_password`, `created_at`
- Round
  - `_id`, `name`, `owner_user_id`, `access_code`, `status` (pending|started|closed), `created_at`
- RoundMember
  - `_id`, `round_id`, `user_id`, `joined_at`
- PlayerAssignment
  - `_id`, `round_id`, `player_user_id`, `target_user_id`, `created_at`
- GoodDeed
  - `_id`, `user_id`, `round_id`, `target_user_id`, `title`, `description`, `created_at`

## API Reference

### Auth (`/auth`)

- POST `/auth/signup`
  - Body: `{ name, email, password }`
  - Returns: `UserPublic`
- POST `/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ access_token, token_type }`
- GET `/auth/users`
  - Query: `limit`, `skip`
  - Returns: `UserPublic[]`

Authorization: Use header `Authorization: Bearer <token>` for protected routes below.

### Rounds (`/rounds`)

- POST `/rounds/`
  - Create a round (owner = current user)
  - Body: `{ name }`
  - Returns: `Round` (includes `access_code`, `status`)
- GET `/rounds/{round_id}`
  - Get round details
  - Returns: `Round`
- POST `/rounds/{round_id}/regenerate-code`
  - Owner-only, pending rounds only
  - Generates a new `access_code`
  - Returns: updated `Round`
- POST `/rounds/{round_id}/join`
  - Join by `access_code`
  - Query: `access_code`
  - Returns: `RoundMember`
- POST `/rounds/{round_id}/players`
  - Owner adds users by email
  - Body: `string[]` (emails)
  - Returns: `UserPublic[]` (added members)
- GET `/rounds/{round_id}/members`
  - Returns: `UserPublic[]` for members
- POST `/rounds/{round_id}/start`
  - Owner-only. Assign targets among members, mark round started
  - Returns: `PlayerAssignment[]`
- POST `/rounds/{round_id}/close`
  - Owner-only. Mark round closed; deed submissions should be considered locked
  - Returns: updated `Round`
- GET `/rounds/{round_id}/my-target`
  - Returns: `UserPublic` of your assigned target
- POST `/rounds/{round_id}/deeds`
  - Submit a good deed about your target
  - Body: `{ title, description? }`
  - Returns: `GoodDeedPublic`
- GET `/rounds/{round_id}/deeds`
  - List deeds for the round
  - Returns: `GoodDeedPublic[]`

### Invites (`/rounds`)

- POST `/rounds/{round_id}/invites`
  - Owner-only. Create a one-time invite token with expiration
  - Query: `expires_minutes` (default 1440)
  - Returns: `{ token, expires_at }`
- POST `/rounds/join-by-invite`
  - Join a round using the invite `token`
  - Returns: `{ joined: true, round_id }`

### Health

- GET `/health` → `{ status: "ok" }`
- GET `/db/ping` → `{ mongo: "ok", db: "secret_santa" }`

## Collections

- `users`
- `rounds`
- `round_members`
- `assignments`
- `deeds`

## Security

- Passwords hashed with Passlib `bcrypt_sha256` (no 72-byte truncation issue)
- JWT signed with HS256; keep `JWT_SECRET` private (set in `.env`)

## Development Notes

- `.env` is loaded relative to `backend/main.py`
- `_id` fields are returned as strings in API responses for simplicity
- Round start uses random derangement; falls back to rotation if needed

## Troubleshooting

- ImportError: `email-validator` → install requirements
- Bcrypt backend issues → ensure `bcrypt==4.1.2` and use `bcrypt_sha256`
- Mongo URI missing → check `backend/.env` and ensure app logs show connection success

## Future Enhancements

- Admin/owner roles and permissions
- Close round and reveal matches
- Per-round membership invitations and email notifications
- Pagination and filtering for deeds
