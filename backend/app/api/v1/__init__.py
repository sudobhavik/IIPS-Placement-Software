from app.api.v1 import auth, imports

api_router = imports.router
api_router.include_router(auth.router)
