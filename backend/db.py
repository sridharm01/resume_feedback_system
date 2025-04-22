from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def get_collection(collection_name: str):
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client["resume_analyzer"]
    return db[collection_name]
