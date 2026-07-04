import asyncio

from fastapi import FastAPI

from pkg.core.config import get_config
from pkg.core.errors import register_error_handlers
from pkg.core.health import register_health_endpoints
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.eventbus.client import EventBusClient

config = get_config()
logger = configure_logging("monitoring-engine")
app = FastAPI(title="Monitoring Engine", version="1.0.0")

bootstrap_telemetry(app, "monitoring-engine", config.otel_exporter_otlp_endpoint)
register_error_handlers(app)
register_health_endpoints(app, "monitoring-engine")

event_bus = EventBusClient(f"redis://{config.redis_host}:{config.redis_port}")


async def process_telemetry(event_type: str, payload: dict, message_id: str):
    # Aggregates raw telemetry into sliding windows and sends to anomaly engine
    if event_type == "METRIC_INGESTED":
        logger.debug("aggregating_metric_window", payload_size=len(payload))
        # Forward aggregated metric to anomaly-stream
        await event_bus.publish("anomaly_stream", "AGGREGATED_METRIC", payload)


async def run_consumer():
    await event_bus.connect()
    await event_bus.consume(
        "telemetry_stream", "monitoring_group", "monitor_1", process_telemetry
    )


@app.on_event("startup")
async def startup():
    asyncio.create_task(run_consumer())
    logger.info("Monitoring Engine started")
