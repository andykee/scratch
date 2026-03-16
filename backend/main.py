from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routers.entries import router as entries_router

app = FastAPI(title="Scratch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

app.include_router(entries_router)
