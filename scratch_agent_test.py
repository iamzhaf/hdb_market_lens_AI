import sys
import os
from google.genai import types
from google.adk import Runner
from google.adk.sessions import InMemorySessionService

# Ensure hdb_insights_agent is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from hdb_insights_agent.agent import root_agent

def main():
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="HDB_Insights",
        agent=root_agent,
        session_service=session_service,
        auto_create_session=True
    )

    query = "What is the average resale price in Tampines for 4-Room flats in 2025?"
    print(f"Sending query: '{query}'")

    new_message = types.Content(
        role='user',
        parts=[types.Part(text=query)]
    )

    events = runner.run(
        user_id="test_user",
        session_id="test_session",
        new_message=new_message
    )

    for i, event in enumerate(events):
        print(f"\n--- Event {i} (Author: {event.author}) ---")
        
        # Check for text response
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    print(f"Text Content: {part.text}")
                
        # Check for function calls
        calls = event.get_function_calls()
        if calls:
            for call in calls:
                print(f"Function Call: {call.name} with args {call.args}")
                
        # Check for function responses
        responses = event.get_function_responses()
        if responses:
            for resp in responses:
                print(f"Function Response: {resp.name} (length: {len(str(resp.response))})")

if __name__ == "__main__":
    main()
