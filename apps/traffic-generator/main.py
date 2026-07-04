import asyncio
import logging
import random
from typing import Optional

import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel

from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.core.health import register_health_endpoints

configure_logging("traffic-generator")
logger = logging.getLogger("traffic-generator")

app = FastAPI(title="Traffic Generator")
bootstrap_telemetry(app, "traffic-generator", "http://otel-collector.kubepilot-observability.svc.cluster.local:4317")

class TrafficConfig(BaseModel):
    mode: str = "normal" # normal, burst, constant, random, high_latency, mixed
    rate: int = 10       # requests per second
    target_url: str = "http://api-gateway.kubepilot-apps.svc.cluster.local"

class TrafficState:
    def __init__(self):
        self.is_running = False
        self.config = TrafficConfig()
        self.client = httpx.AsyncClient(timeout=10.0)

state = TrafficState()
register_health_endpoints(app, "traffic-generator")

async def generate_traffic():
    while state.is_running:
        if state.config.mode == "normal":
            await send_requests(state.config.rate)
            await asyncio.sleep(1)
        elif state.config.mode == "burst":
            await send_requests(state.config.rate * 5)
            await asyncio.sleep(5)
        elif state.config.mode == "constant":
            await send_requests(state.config.rate)
            await asyncio.sleep(1)
        elif state.config.mode == "random":
            current_rate = random.randint(1, state.config.rate * 2)
            await send_requests(current_rate)
            await asyncio.sleep(1)
        elif state.config.mode == "high_latency":
            # Simulate high latency by hitting heavy endpoints or just slowing down the loop
            await send_requests(state.config.rate, latency_mode=True)
            await asyncio.sleep(1)
        elif state.config.mode == "mixed":
            current_rate = random.randint(1, state.config.rate)
            await send_requests(current_rate, mixed=True)
            await asyncio.sleep(1)
        else:
            await asyncio.sleep(1)

async def send_requests(count: int, latency_mode: bool = False, mixed: bool = False):
    endpoints = ["/auth/login", "/payments/process", "/orders/create", "/inventory/check"]
    tasks = []
    for _ in range(count):
        endpoint = random.choice(endpoints) if mixed else endpoints[0]
        url = f"{state.config.target_url}{endpoint}"
        tasks.append(state.client.get(url))
    
    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
        successes = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        logger.info(f"Traffic cycle: Sent {count} requests. Success: {successes}")
    except Exception as e:
        logger.error(f"Traffic generation error: {e}")

@app.post("/start")
async def start_traffic(config: Optional[TrafficConfig] = None, background_tasks: BackgroundTasks = None):
    if state.is_running:
        raise HTTPException(status_code=400, detail="Traffic generation is already running")
    if config:
        state.config = config
    state.is_running = True
    asyncio.create_task(generate_traffic())
    logger.info(f"Started traffic generation in {state.config.mode} mode at {state.config.rate} req/s")
    return {"status": "started", "config": state.config.dict()}

@app.post("/stop")
async def stop_traffic():
    state.is_running = False
    logger.info("Stopped traffic generation")
    return {"status": "stopped"}

@app.get("/status")
async def get_status():
    return {
        "is_running": state.is_running,
        "config": state.config.dict()
    }
