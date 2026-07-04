import asyncio
import logging
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.core.health import register_health_endpoints
from pkg.eventbus.client import EventBusClient

configure_logging("chaos-controller")
logger = logging.getLogger("chaos-controller")

app = FastAPI(title="Chaos Controller")
bootstrap_telemetry(app, "chaos-controller", "http://otel-collector.kubepilot-observability.svc.cluster.local:4317")
event_bus = EventBusClient("redis://redis-master.kubepilot-system.svc.cluster.local:6379")
register_health_endpoints(app, "chaos-controller")

class ChaosExperiment(BaseModel):
    scenario_id: str
    target_service: str = "all"
    duration_seconds: int = 60

active_experiments = {}

@app.post("/start")
async def start_chaos(experiment: ChaosExperiment):
    exp_id = f"exp_{int(time.time())}"
    if active_experiments:
        raise HTTPException(status_code=400, detail="An experiment is already running. Wait for it to finish.")
    
    active_experiments[exp_id] = experiment.dict()
    
    await event_bus.publish("chaos.stream", "ChaosStarted", {
        "experiment_id": exp_id,
        "scenario_id": experiment.scenario_id,
        "target_service": experiment.target_service,
        "duration_seconds": experiment.duration_seconds
    })
    
    logger.info(f"Started chaos experiment {exp_id} for scenario {experiment.scenario_id}")
    return {"status": "started", "experiment_id": exp_id}

@app.post("/stop/{experiment_id}")
async def stop_chaos(experiment_id: str):
    if experiment_id not in active_experiments:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    await event_bus.publish("chaos.stream", "ChaosStopped", {
        "experiment_id": experiment_id
    })
    
    del active_experiments[experiment_id]
    logger.info(f"Stopped chaos experiment {experiment_id}")
    return {"status": "stopped"}

@app.get("/status")
async def get_status():
    return {"active_experiments": active_experiments}

async def handle_recovery(event_type: str, payload: dict, message_id: str):
    """Automatically stop active experiments when the system successfully auto-heals."""
    if event_type == "RECOVERY_COMPLETED":
        target = payload.get("target")
        experiments_to_remove = []
        for exp_id, exp_data in active_experiments.items():
            if exp_data.get("target_service") == target or exp_data.get("target_service") == "all":
                experiments_to_remove.append(exp_id)
        
        for exp_id in experiments_to_remove:
            logger.info(f"Auto-stopping chaos experiment {exp_id} due to successful recovery of {target}")
            await event_bus.publish("chaos.stream", "ChaosStopped", {"experiment_id": exp_id})
            del active_experiments[exp_id]

async def run_consumer():
    await event_bus.connect()
    await event_bus.consume(
        "recovery_stream", "chaos_controller_group", "chaos_ctrl_1", handle_recovery
    )

@app.on_event("startup")
async def startup():
    asyncio.create_task(run_consumer())
    logger.info("Chaos Controller started")
