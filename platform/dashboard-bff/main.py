import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.core.health import register_health_endpoints

configure_logging("dashboard-bff")
logger = logging.getLogger("dashboard-bff")

app = FastAPI(title="Dashboard BFF")
bootstrap_telemetry(app, "dashboard-bff", "http://otel-collector.kubepilot-observability.svc.cluster.local:4317")

# Allow frontend to access the BFF directly if not using API Gateway in dev mode
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_health_endpoints(app, "dashboard-bff")

import httpx
from fastapi import HTTPException

# Timeout for internal requests
TIMEOUT = 5.0

@app.get("/api/dashboard")
async def get_dashboard_summary():
    # Fetch from recovery-validation-service
    url = "http://recovery-validation-service.kubepilot-system.svc.cluster.local/metrics/mttr"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=TIMEOUT)
            data = resp.json()
            return {
                "cluster_health": "Healthy",
                "app_health": "Healthy" if not data.get("active_incidents") else "Degraded",
                "platform_health": "Healthy",
                "mttr_seconds": data.get("average_mttr_seconds", 0),
                "active_incidents": len(data.get("active_incidents", {})),
                "recovered_incidents": data.get("successful_recoveries", 0),
                "system_availability": 99.99
            }
    except Exception as e:
        logger.error(f"Failed to fetch dashboard metrics: {e}")
        return {"error": "Service unavailable", "cluster_health": "Unknown"}

@app.get("/api/incidents")
async def get_incidents():
    # Fetch from recovery-validation-service's active incidents
    url = "http://recovery-validation-service.kubepilot-system.svc.cluster.local/metrics/mttr"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=TIMEOUT)
            data = resp.json()
            active = data.get("active_incidents", {})
            incidents = []
            for inc_id, details in active.items():
                incidents.append({
                    "id": inc_id,
                    "status": "Active",
                    "severity": "Critical",
                    "start_time": details.get("start_time"),
                    "description": "Incident automatically detected"
                })
            return incidents
    except Exception as e:
        logger.error(f"Failed to fetch incidents: {e}")
        return []

@app.get("/api/topology")
async def get_topology():
    return {
        "nodes": [
            {"id": "api-gateway", "type": "service", "label": "API Gateway"},
            {"id": "auth-service", "type": "service", "label": "Auth Service"},
            {"id": "payment-service", "type": "service", "label": "Payment Service"}
        ],
        "edges": [
            {"source": "api-gateway", "target": "auth-service"},
            {"source": "api-gateway", "target": "payment-service"}
        ]
    }

@app.get("/api/chaos")
async def get_chaos_status():
    url = "http://chaos-scenario-manager.kubepilot-system.svc.cluster.local/status"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=TIMEOUT)
            data = resp.json()
            return data
    except Exception as e:
        logger.error(f"Failed to fetch chaos status: {e}")
        return {"error": "Chaos manager unavailable"}

@app.get("/api/audit")
async def get_audit_logs():
    url = "http://audit-engine.kubepilot-system.svc.cluster.local/api/internal/logs"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=TIMEOUT)
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {e}")
        return []
