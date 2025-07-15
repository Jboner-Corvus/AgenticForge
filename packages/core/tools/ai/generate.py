import base64
import os
from google import genai
from google.genai import types
import sys

def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-1.5-flash"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=sys.argv[1]),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )

    for chunk in client.generate_content(
        model=model,
        contents=contents,
        generation_config=generate_content_config,
        stream=False,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()
