import asyncio
import logging
import json
from fastapi import FastAPI
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.core.health import register_health_endpoints
from pkg.eventbus.client import EventBusClient
import sqlite3

configure_logging("audit-engine")
logger = logging.getLogger("audit-engine")

app = FastAPI(title="Audit & Governance Engine")
bootstrap_telemetry(app, "audit-engine", "http://otel-collector.kubepilot-observability.svc.cluster.local:4317")
event_bus = EventBusClient("redis://redis-master.kubepilot-system.svc.cluster.local:6379")
register_health_endpoints(app, "audit-engine")

def init_db():
    try:
        conn = sqlite3.connect("/tmp/audit.db")
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                event_type VARCHAR(100),
                incident_id VARCHAR(100),
                prompt_id VARCHAR(100),
                model_name VARCHAR(100),
                confidence_score FLOAT,
                decision VARCHAR(255),
                human_approved BOOLEAN,
                payload JSON
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Audit database initialized.")
    except Exception as e:
        logger.error(f"Failed to init DB: {e}")

init_db()

async def handle_audit_event(event_type: str, event: dict, message_id: str):
    incident_id = event.get("incident_id", "N/A")
    
    # Extract AI Governance Metadata
    prompt_id = event.get("prompt_id", None)
    model_name = event.get("model_name", None)
    confidence = event.get("confidence_score", None)
    decision = event.get("decision", None)
    human_approved = event.get("human_approved", False)
    
    logger.info(f"Auditing event {event_type} for incident {incident_id}")
    
    try:
        conn = sqlite3.connect("/tmp/audit.db")
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO audit_logs (event_type, incident_id, prompt_id, model_name, confidence_score, decision, human_approved, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (event_type, incident_id, prompt_id, model_name, confidence, decision, human_approved, json.dumps(event)))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to persist audit log: {e}")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting audit-engine consumer in background...")
    asyncio.create_task(event_bus.consume(
        stream="audit_events",
        group="audit_group",
        consumer="audit_1",
        callback=handle_audit_event
    ))

@app.get("/api/internal/logs")
async def get_logs(limit: int = 50):
    try:
        conn = sqlite3.connect("/tmp/audit.db")
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = [dict(row) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        logger.error(f"Failed to read DB: {e}")
        return []
