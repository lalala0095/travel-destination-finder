from pymongo import MongoClient
from dotenv import load_dotenv
import os
from google import genai

load_dotenv() # Load environment variables from .env file

MONGO_DB_URI = os.getenv("MONGO_DB_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

mongodb_client = MongoClient(MONGO_DB_URI)
db = mongodb_client[MONGO_DB_NAME]

chats_collection = db["chats"]
simplified_contents_collection = db["simplified-contents"]
car_prices_collection = db["car-prices"]

gemini_api_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=gemini_api_key)

custom_search_api_key = os.getenv("CUSTOM_SEARCH_API_KEY")
custom_search_id = os.getenv("CX_SEARCH_ID")