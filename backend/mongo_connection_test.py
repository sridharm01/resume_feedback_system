from pymongo import MongoClient
from dotenv import load_dotenv
import os
import certifi  

load_dotenv()

uri = os.getenv("MONGO_URI")
client = MongoClient(uri, tls=True, tlsCAFile=certifi.where())

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Error occurred: {e}")
