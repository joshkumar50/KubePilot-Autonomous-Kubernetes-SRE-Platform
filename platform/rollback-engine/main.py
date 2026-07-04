import asyncio

import httpx
from fastapi import FastAPI

from pkg.core.config import get_config
from pkg.core.errors import register_error_handlers
from pkg.core.health import register_health_endpoints
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.eventbus.client import EventBusClient

config = get_config()
logger = configure_logging("rollback-engine")
app = FastAPI(title="Rollback Engine", version="1.0.0")

bootstrap_telemetry(app, "rollback-engine", config.otel_exporter_otlp_endpoint)
register_error_handlers(app)
register_health_endpoints(app, "rollback-engine")

event_bus = EventBusClient(f"redis://{config.redis_host}:{config.redis_port}")


async def handle_rollback(event_type: str, payload: dict, message_id: str):
    if event_type == "RECOVERY_FAILED":
        target = payload.get("target")
        logger.critical("initiating_rollback", target=target)

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Call K8s controller to undo the rollout
                await client.post(
                    "http://kubernetes-controller.kubepilot-system.svc.cluster.local/execute",
                    json={"target": target, "workflow": [{"command": "rollback"}]},
                )
                logger.info("rollback_completed_successfully", target=target)
                await event_bus.publish(
                    "recovery_stream", "ROLLBACK_COMPLETED", {"target": target}
                )
            except Exception as e:
                logger.error("rollback_failed_critical", error=str(e))


async def run_consumer():
    await event_bus.connect()
    await event_bus.consume(
        "recovery_stream", "rollback_group", "roll_1", handle_rollback
    )


@app.on_event("startup")
async def startup():
    asyncio.create_task(run_consumer())
    logger.info("Rollback Engine started")
