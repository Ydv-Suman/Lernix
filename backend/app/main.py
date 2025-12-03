from fastapi import FastAPI

from model import Base
from routes import auth, users
from database import engine

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(users.router)