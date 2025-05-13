from fastapi import FastAPI
from typing import Optional
from config import gemini_client, chats_collection
from google.genai import types
from functions import store_new_chat_contexts_to_db, append_chat_context, generate_simplified_context, update_simplified_context

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello! This is a FastAPI server for an AI chat bot that replicates the workflow of common AI chat bots like ChatGPT and Google Gemini."}

@app.post("/chat")
def chat_with_bot(contents: str, chat_id: Optional[str]=None):
    if chat_id:
        existing_chat = chats_collection.find_one({"_id": chat_id})
    else:
        chat_id = store_new_chat_contexts_to_db(contents)
        existing_chat = chats_collection.find_one({"_id": chat_id})

    # this generates a simplified context base on the chat history
    simplified_context = generate_simplified_context(chat_id)

    # this updates the simplified context in mongodb
    update_simplified_context(chat_id, simplified_context)

    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[simplified_context, contents]
    )
    response_text = response.text

    # this appends the chat content made by the user 
    # this is done after the simplified context is generated, to preserve the chat history
    append_chat_context(chat_id, contents)

    return {"message": response_text}

