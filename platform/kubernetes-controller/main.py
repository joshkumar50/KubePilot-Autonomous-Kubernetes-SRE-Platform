from fastapi import FastAPI
from kubernetes import client as k8s_client
from kubernetes import config as k8s_config
from pydantic import BaseModel

from pkg.core.config import get_config
from pkg.core.errors import KubePilotException, register_error_handlers
from pkg.core.health import register_health_endpoints
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry

app_config = get_config()
logger = configure_logging("kubernetes-controller")
app = FastAPI(title="Kubernetes Controller", version="1.0.0")

bootstrap_telemetry(
    app, "kubernetes-controller", app_config.otel_exporter_otlp_endpoint
)
register_error_handlers(app)
register_health_endpoints(app, "kubernetes-controller")

# Initialize K8s Client
try:
    k8s_config.load_incluster_config()
except k8s_config.config_exception.ConfigException:
    # Fallback to local kubeconfig for minikube dev
    k8s_config.load_kube_config()

v1_apps = k8s_client.AppsV1Api()
v1_core = k8s_client.CoreV1Api()


class K8sCommand(BaseModel):
    target: str
    workflow: list


@app.post("/execute")
async def execute_k8s_command(cmd: K8sCommand):
    """
    Physically interacts with the Kubernetes API to restart/rollback deployments.
    """
    logger.info("executing_k8s_command", target=cmd.target)

    try:
        # Example: restarting a deployment dynamically
        # In a real impl, parse cmd.workflow properly
        patch = {
            "spec": {
                "template": {
                    "metadata": {"annotations": {"kubepilot-aiops/restartedAt": "now"}}
                }
            }
        }
        v1_apps.patch_namespaced_deployment(
            name=cmd.target, namespace="kubepilot-apps", body=patch
        )
        logger.info("deployment_restarted_successfully", target=cmd.target)
        return {"status": "executed", "action": "rollout_restart"}
    except Exception as e:
        logger.error("k8s_execution_failed", error=str(e))
        raise KubePilotException("Kubernetes API execution failed", "K8S_ERROR", 500)
