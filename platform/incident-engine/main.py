import asyncio

from fastapi import FastAPI

from pkg.core.config import get_config
from pkg.core.errors import register_error_handlers
from pkg.core.health import register_health_endpoints
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.eventbus.client import EventBusClient

config = get_config()
logger = configure_logging("incident-engine")
app = FastAPI(title="Incident Engine", version="1.0.0")

bootstrap_telemetry(app, "incident-engine", config.otel_exporter_otlp_endpoint)
register_error_handlers(app)
register_health_endpoints(app, "incident-engine")

event_bus = EventBusClient(f"redis://{config.redis_host}:{config.redis_port}")

active_incidents = {}


async def manage_incident(event_type: str, payload: dict, message_id: str):
    if event_type == "BLAST_RADIUS_MAPPED":
        root_cause = payload.get("root_cause_candidate")

        # Suppress duplicates
        if root_cause in active_incidents:
            logger.debug("duplicate_incident_suppressed", root=root_cause)
            return

        incident_id = f"INC-{len(active_incidents) + 1000}"
        active_incidents[root_cause] = incident_id

        logger.critical(
            "incident_created",
            incident_id=incident_id,
            root_cause=root_cause,
            severity="SEV-1",
        )

        await event_bus.publish(
            "ai_stream",
            "INCIDENT_DECLARED",
            {
                "incident_id": incident_id,
                "root_cause_candidate": root_cause,
                "impacted_services": payload.get("impacted_services"),
                "status": "investigating",
            },
        )


async def run_consumer():
    await event_bus.connect()
    await event_bus.consume(
        "incident_stream", "incident_group", "inc_1", manage_incident
    )


@app.on_event("startup")
async def startup():
    asyncio.create_task(run_consumer())
    logger.info("Incident Engine started")
