from fastapi import APIRouter
from app.api.v1 import auth, imports, master, users

# Create a base router WITHOUT prefix
api_router = APIRouter()

# Include auth - router ALREADY has prefix="/auth"
api_router.include_router(auth.router, tags=["auth"])

# Include imports - router ALREADY has prefix="/import"
api_router.include_router(imports.router, tags=["import"])

# Include users - router ALREADY has prefix="/users"
api_router.include_router(users.router, tags=["users"])

# Include master - router ALREADY has prefix="/master"
api_router.include_router(master.router, tags=["master"])
