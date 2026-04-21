from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agent import run_agent
from langfuse import Langfuse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="Agentic AI Debugger API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    langfuse_client = Langfuse(
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
        host=os.getenv("LANGFUSE_HOST")
    )
except Exception as e:
    print(f"Warning: Failed to initialize Langfuse client: {e}")
    langfuse_client = None

class QueryRequest(BaseModel):
    query: str

@app.post("/run")
async def execute_agent(request: QueryRequest):
    try:
        result = run_agent(request.query)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/traces")
async def get_traces():
    if not langfuse_client:
        return {"traces": []}
    try:
        # Correct SDK call according to client structure
        traces = langfuse_client.api.trace.list(limit=10)
        return {"traces": traces.data}
    except Exception as e:
        print(f"Error fetching traces: {e}")
        return {"traces": []}

@app.get("/traces/{trace_id}")
async def get_trace_details(trace_id: str):
    if not langfuse_client:
        return {"trace": None}
    try:
        # Correct SDK call according to client structure
        trace = langfuse_client.api.trace.get(trace_id)
        return {"trace": trace}
    except Exception as e:
        print(f"Error fetching trace details: {e}")
        return {"trace": None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
