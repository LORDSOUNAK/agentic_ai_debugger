from dotenv import load_dotenv
load_dotenv()

import os
from typing import TypedDict, Annotated, List, Union
from langgraph.graph import StateGraph, END
from langfuse.langchain import CallbackHandler
import litellm

from langfuse import Langfuse

# Initialize global Langfuse client for LiteLLM integration
# This satisfies LiteLLM's internal observation requirements
langfuse_client_obj = Langfuse()

# Configure LiteLLM for Langfuse
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]

# Langfuse Configuration for LangChain (to track the graph itself)
langfuse_handler = CallbackHandler(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY")
)

class AgentState(TypedDict):
    messages: Annotated[List[dict], "Chat History"]
    next_step: str

def orchestrator(state: AgentState):
    """Plans the next move."""
    messages = state["messages"]
    response = litellm.completion(
        model="openai/gpt-4o",
        messages=messages + [{"role": "system", "content": "Analyze the request and decide: 'tool' or 'final'."}],
        api_key=os.getenv("OPENAI_API_KEY")
    )
    decision = response.choices[0].message.content.strip().lower()
    return {"next_step": "tool" if "tool" in decision else "final"}

def tool_agent(state: AgentState):
    """Executes a dummy tool."""
    return {"messages": state["messages"] + [{"role": "assistant", "content": "Tool execution result: The weather in London is 15°C."}]}

def final_response(state: AgentState):
    """Synthesizes the final answer."""
    messages = state["messages"]
    response = litellm.completion(
        model="openai/gpt-4o",
        messages=messages,
        api_key=os.getenv("OPENAI_API_KEY")
    )
    return {"messages": state["messages"] + [{"role": "assistant", "content": response.choices[0].message.content}]}

# Graph Construction
workflow = StateGraph(AgentState)

workflow.add_node("orchestrator", orchestrator)
workflow.add_node("tool_agent", tool_agent)
workflow.add_node("final_response", final_response)

workflow.set_entry_point("orchestrator")

workflow.add_conditional_edges(
    "orchestrator",
    lambda x: x["next_step"],
    {
        "tool": "tool_agent",
        "final": "final_response"
    }
)

workflow.add_edge("tool_agent", "final_response")
workflow.add_edge("final_response", END)

agent_app = workflow.compile()

def run_agent(query: str):
    config = {"callbacks": [langfuse_handler]}
    initial_state = {"messages": [{"role": "user", "content": query}]}
    result = agent_app.invoke(initial_state, config=config)
    
    # Ensure traces are sent before returning
    try:
        langfuse_handler.flush()
    except:
        pass
        
    return result
