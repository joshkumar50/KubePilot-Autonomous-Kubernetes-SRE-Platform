import asyncio
import logging
import time
from fastapi import FastAPI
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.core.health import register_health_endpoints
from pkg.eventbus.client import EventBusClient

configure_logging("recovery-validation")
logger = logging.getLogger("recovery-validation")

app = FastAPI(title="Recovery Validation Service")
bootstrap_telemetry(app, "recovery-validation", "http://otel-collector.kubepilot-observability.svc.cluster.local:4317")
event_bus = EventBusClient("redis://redis-master.kubepilot-system.svc.cluster.local:6379")
register_health_endpoints(app, "recovery-validation-service")

metrics = {
    "total_experiments": 0,
    "successful_recoveries": 0,
    "total_mttr_seconds": 0,
    "average_mttr_seconds": 0,
    "active_incidents": {}
}

async def handle_validation_events(event_type: str, event: dict, message_id: str):
    # This function correlates all events passing through the streams
    # In a real system, we'd use correlation_id or incident_id.
    # For this hackathon, we simply use timestamp differences.
    event_type = event.get("event_type")
    
    if event_type == "IncidentCreated":
        inc_id = event.get("incident_id")
        metrics["active_incidents"][inc_id] = {"start_time": time.time()}
        logger.info(f"Tracking new incident for validation: {inc_id}")
        
    elif event_type == "RecoveryVerificationPassed":
        inc_id = event.get("incident_id")
        if inc_id in metrics["active_incidents"]:
            start = metrics["active_incidents"][inc_id]["start_time"]
            end = time.time()
            mttr = end - start
            
            metrics["total_experiments"] += 1
            metrics["successful_recoveries"] += 1
            metrics["total_mttr_seconds"] += mttr
            metrics["average_mttr_seconds"] = metrics["total_mttr_seconds"] / metrics["total_experiments"]
            
            del metrics["active_incidents"][inc_id]
            logger.info(f"Recovery Validated! Incident {inc_id} MTTR: {mttr:.2f} seconds")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting recovery-validation consumer in background...")
    asyncio.create_task(event_bus.consume(
        stream="incident.stream",
        group="validation_group",
        consumer="validator_1",
        callback=handle_validation_events
    ))

@app.get("/metrics/mttr")
async def get_mttr():
    return metrics
