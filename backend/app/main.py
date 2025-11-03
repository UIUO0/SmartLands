from fastapi import FastAPI

app = FastAPI(title="Smart Lands API")

@app.get("/health")
def health():
    return {"status": "ok"}
