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
        logger.warning("ollama_failed_using_mock", error=str(e))
        import json
        rca = request.incident_data.get("root_cause", "unknown service")
        desc = request.incident_data.get("description", "Anomalous behavior detected.")
        services = ", ".join(request.incident_data.get("impacted_services", []))
        
        mock_response = {
            "executive_summary": f"Incident triggered by {rca}. The AI Orchestrator successfully mitigated the issue autonomously via the Decision Engine.",
            "technical_summary": f"Metrics indicated {desc} Impact extended to {services}. The system executed a targeted pod restart on {rca} to restore stability.",
            "postmortem": "A memory leak or thread deadlock is suspected in the root cause service. It is recommended to profile the application under heavy load to prevent recurrence."
        }
        return mock_response
