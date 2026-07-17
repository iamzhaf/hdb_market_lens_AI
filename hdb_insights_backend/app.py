import os
import sys
import datetime as dt
from decimal import Decimal
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Ensure hdb_insights_agent directory is in python search path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from hdb_insights_agent.agent import root_agent
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Load agent's env settings
agent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'hdb_insights_agent')
load_dotenv(os.path.join(agent_dir, '.env'))

app = Flask(__name__)
# Enable CORS so the React app (on port 5173) can talk to us (on port 5000)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize ADK Runner
session_service = InMemorySessionService()
runner = Runner(
    app_name="HDB_Insights",
    agent=root_agent,
    session_service=session_service,
    auto_create_session=True
)

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD")
    )

def json_safe(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value

@app.route('/api/towns', methods=['GET'])
def get_towns():
    """Fetch distinct list of towns from the dataset."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT town FROM hdb.hdb_resale_prices ORDER BY town;")
            towns = [row[0] for row in cur.fetchall()]
            return jsonify(towns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    """Fetch default aggregated stats for KPI cards, optionally filtered by town."""
    town = request.args.get('town')
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT 
                    COUNT(*)::integer as total_transactions,
                    ROUND(AVG(resale_price))::double precision as avg_price,
                    SUM(resale_price)::double precision as total_volume,
                    ROUND(AVG(floor_area_sqm), 1)::double precision as avg_area
                FROM hdb.hdb_resale_prices
            """
            params = []
            if town:
                query += " WHERE town = %s"
                params.append(town)
            cur.execute(query, params)
            kpis = cur.fetchone()
            
            return jsonify({
                'total_transactions': kpis['total_transactions'] or 0,
                'avg_price': kpis['avg_price'] or 0.0,
                'total_volume': kpis['total_volume'] or 0.0,
                'avg_area': kpis['avg_area'] or 0.0
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/chart-data', methods=['GET'])
def get_chart_data():
    """Fetch pre-aggregated datasets for ECharts visualization, optionally filtered by town."""
    town = request.args.get('town')
    conn = get_db_connection()
    try:
        chart_data = {}
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Price trend by year (average price and transaction volume)
            trend_query = """
                SELECT 
                    EXTRACT(YEAR FROM month)::integer as label,
                    ROUND(AVG(resale_price))::double precision as avg_price,
                    COUNT(*)::integer as txn_count,
                    ROUND(AVG(resale_price / floor_area_sqm))::double precision as avg_price_per_sqm
                FROM hdb.hdb_resale_prices
            """
            trend_params = []
            if town:
                trend_query += " WHERE town = %s"
                trend_params.append(town)
            trend_query += " GROUP BY label ORDER BY label;"
            cur.execute(trend_query, trend_params)
            chart_data['trend'] = [dict(row) for row in cur.fetchall()]

            # 2. Top 12 towns by average price
            towns_query = """
                SELECT 
                    town as label,
                    ROUND(AVG(resale_price))::double precision as avg_price,
                    COUNT(*)::integer as txn_count
                FROM hdb.hdb_resale_prices
            """
            towns_params = []
            if town:
                towns_query += " WHERE town = %s"
                towns_params.append(town)
            towns_query += " GROUP BY town ORDER BY avg_price DESC LIMIT 12;"
            cur.execute(towns_query, towns_params)
            chart_data['towns'] = [dict(row) for row in cur.fetchall()]

            # 3. Flat Type volume breakdown
            flat_types_query = """
                SELECT 
                    flat_type as label,
                    COUNT(*)::integer as value,
                    ROUND(AVG(resale_price))::double precision as avg_price
                FROM hdb.hdb_resale_prices
            """
            flat_types_params = []
            if town:
                flat_types_query += " WHERE town = %s"
                flat_types_params.append(town)
            flat_types_query += " GROUP BY flat_type ORDER BY value DESC;"
            cur.execute(flat_types_query, flat_types_params)
            chart_data['flat_types'] = [dict(row) for row in cur.fetchall()]

            # 4. Flat Model distribution (top 8)
            flat_models_query = """
                SELECT 
                    flat_model as label,
                    COUNT(*)::integer as value
                FROM hdb.hdb_resale_prices
            """
            flat_models_params = []
            if town:
                flat_models_query += " WHERE town = %s"
                flat_models_params.append(town)
            flat_models_query += " GROUP BY flat_model ORDER BY value DESC LIMIT 8;"
            cur.execute(flat_models_query, flat_models_params)
            chart_data['flat_models'] = [dict(row) for row in cur.fetchall()]

            # 5. Flat Type transactions across years
            flat_types_by_year_query = """
                SELECT 
                    EXTRACT(YEAR FROM month)::integer as year,
                    flat_type,
                    COUNT(*)::integer as txn_count
                FROM hdb.hdb_resale_prices
            """
            flat_types_by_year_params = []
            if town:
                flat_types_by_year_query += " WHERE town = %s"
                flat_types_by_year_params.append(town)
            flat_types_by_year_query += " GROUP BY year, flat_type ORDER BY year ASC, flat_type ASC;"
            cur.execute(flat_types_by_year_query, flat_types_by_year_params)
            chart_data['flat_types_by_year'] = [dict(row) for row in cur.fetchall()]

            return jsonify(chart_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/chat', methods=['POST'])
def chat():
    """Interact with the HDB Insights agent using ADK's Runner."""
    data = request.json or {}
    message = data.get('message', '').strip()
    user_id = data.get('userId', 'default_user')
    session_id = data.get('sessionId', 'default_session')

    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400

    try:
        new_message = types.Content(
            role='user',
            parts=[types.Part(text=message)]
        )

        events = runner.run(
            user_id=user_id,
            session_id=session_id,
            new_message=new_message
        )

        steps = []
        final_text = ""

        for event in events:
            # Extract agent textual output
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text += part.text

            # Extract internal tool (SQL, pptx) executions
            calls = event.get_function_calls()
            if calls:
                for call in calls:
                    steps.append({
                        'type': 'tool_call',
                        'name': call.name,
                        'args': call.args
                    })

            responses = event.get_function_responses()
            if responses:
                for resp in responses:
                    steps.append({
                        'type': 'tool_response',
                        'name': resp.name,
                        'response': resp.response
                    })

        return jsonify({
            'response': final_text,
            'steps': steps
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/query', methods=['POST'])
def run_query():
    """Directly query the database for the custom SQL runner console."""
    data = request.json or {}
    sql = data.get('sql', '').strip()

    if not sql:
        return jsonify({'error': 'SQL query is required'}), 400

    sql_clean = sql.strip().lower()
    if not sql_clean.startswith("select"):
        return jsonify({'error': 'Only SELECT queries are allowed.'}), 400

    blocked_words = ["insert", "update", "delete", "drop", "alter", "truncate", "create"]
    if any(word in sql_clean for word in blocked_words):
        return jsonify({'error': 'Unsafe SQL detected. Only read-only queries are allowed.'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql)
            rows = cur.fetchall()
            
            clean_rows = []
            for row in rows:
                clean_row = {}
                for k, v in dict(row).items():
                    clean_row[k] = json_safe(v)
                clean_rows.append(clean_row)

            columns = list(clean_rows[0].keys()) if clean_rows else []
            return jsonify({
                'columns': columns,
                'rows': clean_rows
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Generates a PowerPoint presentation using report_tools."""
    data = request.json or {}
    slides = data.get('slides', [])
    filename = data.get('filename', 'hdb_market_insights.pptx')

    if not slides:
        return jsonify({'error': 'Slides details are required'}), 400

    try:
        from hdb_insights_agent.report_tools import generate_powerpoint_report
        result = generate_powerpoint_report(slides, filename)
        return jsonify({
            'message': result,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<filename>', methods=['GET'])
def get_report(filename):
    """Downloads generated PowerPoint files."""
    reports_dir = os.path.join(agent_dir, 'reports')
    return send_from_directory(reports_dir, filename, as_attachment=True)

if __name__ == '__main__':
    # Run the Flask app locally on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
