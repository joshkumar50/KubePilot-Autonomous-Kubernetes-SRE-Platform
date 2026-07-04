import httpx
from fastapi import FastAPI
from pydantic import BaseModel

from pkg.core.config import get_config
from pkg.core.errors import register_error_handlers
from pkg.core.health import register_health_endpoints
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry

config = get_config()
logger = configure_logging("ai-copilot")
app = FastAPI(title="AI Copilot", version="1.0.0")

bootstrap_telemetry(app, "ai-copilot", config.otel_exporter_otlp_endpoint)
register_error_handlers(app)
register_health_endpoints(app, "ai-copilot")

# Assume local Ollama running in cluster or locally
OLLAMA_URL = "http://ollama.kubepilot-system.svc.cluster.local:11434/api/generate"


class IncidentReportRequest(BaseModel):
    incident_data: dict


@app.post("/explain")
async def generate_explanation(request: IncidentReportRequest):
    """
    Uses local Ollama LLM purely for natural language explanation and postmortems.
    Does NOT make infrastructure decisions.
    """
    logger.info("generating_copilot_explanation")

    prompt = f"""
    You are an expert Kubernetes SRE. Summarize this incident for an executive.
    Data: {request.incident_data}
    Return JSON only with fields: 'executive_summary', 'technical_summary', 'postmortem'.
    """

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                OLLAMA_URL,
                json={
                    "model": "llama3",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            res.raise_for_status()
            return res.json().get("response")
    except Exception as e:
        logger.error("ollama_failed", error=str(e))
        return {
            "executive_summary": "LLM Offline. Incident resolved automatically by Decision Engine.",
            "technical_summary": str(request.incident_data),
        }
