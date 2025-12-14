from openai import OpenAI
import os

KEY = "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"

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=KEY,
)

def test_chat():
    try:
        print("Testing with model: mistralai/devstral-2512:free ...")
        completion = client.chat.completions.create(
            model="mistralai/devstral-2512:free",
            messages=[
                {"role": "user", "content": "Hello! Say 'It works' if you can hear me."}
            ]
        )
        print("Response:")
        print(completion.choices[0].message.content)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
