from fastapi import FastAPI
from typing import Optional
from config import gemini_client, custom_search_api_key, custom_search_id
from google.genai import types
from functions import store_new_chat_contexts_to_db, append_chat_context, generate_simplified_context, update_simplified_context
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
import requests
import json
import re

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello! This is a FastAPI server for an AI chat bot that assists you on your next travel destination using Google Gemini."}

def image_search(query: str):
    search_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': custom_search_api_key,
        'cx': custom_search_id,
        'q': query,
        'searchType': 'image'
    }
    
    response = requests.get(url=search_url, params=params)
    response.raise_for_status()

    search_results = response.json()
    image_links = []
    if 'items' in search_results:
        for item in search_results['items']:
            if 'image' in item:
                image_links.append(item['link'])
    
    return {
        "message": "success",
        "image_links": image_links
        }

@app.post("/chat")
def chat_with_bot(query: str):
    
    print(query)

    query_base = [
        "You are a helpful travel assistant.",
        "The user wants you to return travel destinations base on his/her preferences.",
        "Use the Google Search tool for this to return the latest and most recommended destinations.",
        "Return a maximum of 5 destinations.",
        """Do not return any explanations or extra texts. Just return the json response. Use the following json format.
        product = {
            "name": "Sample Name",
            "metadata": {
                "key": "Include here all of the relevant key-value pairs related to the information of the destination.",
                "key2": "sample value 2" # Do not include any brackets with numbers  patterns here like citations.
                }
        }
        ```json
        List[product]
        ```
        """
    ]
    query_base.append(query)
    print(query_base)

    model_id = "gemini-2.0-flash"

    google_search_tool = Tool(
        google_search = GoogleSearch()
    )

    response = gemini_client.models.generate_content(
        model=model_id,
        contents=query_base,
        config=GenerateContentConfig(
            tools=[google_search_tool],
            response_modalities=["TEXT"],
        )
    )

    response_list = []
    counter = 0
    # for each in response.candidates[0].content.parts:
    #     counter += 1
    #     print(f"counter: {counter}")
    #     response_list.append(each.text)

    # response_text = ", ".join(response_list)
    response_text = response.text

    response_text_cleaned = response_text.replace("```json", "").replace("```", "")
    response_json = json.loads(response_text_cleaned)
    CITATION_PATTERN = re.compile(r'\[\s*\d+(\s*,\s*\d+)*\s*\]')
    for i in response_json:
        metadata = i.get("metadata", {})
        for key, value in metadata.items():
            if isinstance(value, str):
                cleaned_value = CITATION_PATTERN.sub('', value).strip()
            cleaned_value = re.sub(r'\s*([.,;:])', r'\1', cleaned_value)
            metadata[key] = cleaned_value

        if i.get("name", None):
            images_results = image_search(i.get("name", None))
        i['images'] = images_results.get("image_links", [])

    return {"message": response_json}




