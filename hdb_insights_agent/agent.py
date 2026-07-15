from google.adk.agents.llm_agent import Agent
import datetime as dt
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json
from decimal import Decimal
import asyncio
from .utils import read_ontology, read_prompts
from .report_tools import generate_powerpoint_report

base_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(base_dir, ".env"))

MODEL = os.getenv('MODEL')


def json_safe(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    return value


def query_postgres(sql: str) -> list[dict]:
    """
    Run a read-only SQL query against PostgreSQL and return the result.
    Only SELECT queries are allowed.
    """

    sql_clean = sql.strip().lower()

    if not sql_clean.startswith("select"):
        return [{"error": "Only SELECT queries are allowed."}]

    blocked_words = ["insert", "update", "delete", "drop", "alter", "truncate", "create"]
    if any(word in sql_clean for word in blocked_words):
        return [{"error": "Unsafe SQL detected."}]

    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
    )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql)
            rows = cur.fetchall()
            result = []
            for row in rows:
                clean_row = {}
                for key, value in dict(row).items():
                    clean_row[key] = json_safe(value)
                result.append(clean_row)

            # Optional safety check
            json.dumps(result)

            return result
    finally:
        conn.close()


root_agent = Agent(
    model=MODEL,
    name="HDB_Insights_Agent",
    description="You are a helpful analytics insight agent. You help users answer questions about HDB (Housing & Development Board) resale flat market in Singapore using PostgreSQL data.",
    instruction=read_prompts("agent_instruction.md"),
    tools=[
        read_ontology,
        query_postgres,
        generate_powerpoint_report
    ],
)


if __name__ == "__main__":

    pass
