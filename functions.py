from config import chats_collection, simplified_contents_collection, gemini_client
from bson import ObjectId
import json

def store_new_chat_contexts_to_db(contents: str):
    chat = chats_collection.insert_one({"contents": contents})
    return chat.inserted_id

def append_chat_context(chat_id: str, contents: str):
    existing_chat = chats_collection.find_one({"_id": ObjectId(chat_id)})
    if existing_chat:
        chats_collection.update_one(
            {"_id": chat_id},
            {"$set": {"$addToSet": {"contents": contents}}}
        )
        return {"message": "Raw Chat updated"}
    else:
        return {"error": "Chat not found"}


def append_chatbot_response(chat_id: str, response: str):
    existing_chat = chats_collection.find_one({"_id": ObjectId(chat_id)})
    if existing_chat:
        chats_collection.update_one(
            {"_id": chat_id},
            {"$set": {"$addToSet": {"contents": response}}}
        )
        return {"message": "Raw Chat updated"}
    else:
        return {"error": "Chat not found"}

def generate_simplified_context(chat_id: str):

    existing_contents = chats_collection.find_one({"_id": ObjectId(chat_id)})
    if existing_contents:
        existing_contents = existing_contents.get("contents")
        primary_prompt = [
            """
            The following texts are the raw contexts of a chat history.
            Simplify the prompt by generating a simplified context for this chat.
            Use the following json format for the response:
            ```json
            {"context": "the simplified context"}
            ```
            """
            ]
        primary_prompt.extend(existing_contents)
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=primary_prompt
        )
        response_raw_text = response.text
        simplified_context_original = response_raw_text.replace("```json", "").replace("```", "")
        simplified_context_dict = json.loads(simplified_context_original)
        simplified_context = simplified_context_dict.get("context", None)
        update_simplified_context(chat_id, simplified_context, len(existing_contents.get("contents")))
        return simplified_context
    else:
        return "Chat not found"

def update_simplified_context(chat_id: str, simplified_context: str):
    if chat_id:
        simplified_contents_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"simplified_context": simplified_context}}
        )
        return {"message": "updated simplified context"}
    else:
        return {"error": "chat id not found"}


