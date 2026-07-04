import asyncio
import logging
from fastapi import FastAPI
from kubernetes import client, config
from pkg.core.logging import configure_logging
from pkg.core.telemetry import bootstrap_telemetry
from pkg.core.health import register_health_endpoints
from pkg.eventbus.client import EventBusClient

configure_logging("fault-injection-engine")
logger = logging.getLogger("fault-injection-engine")

app = FastAPI(title="Fault Injection Engine")
bootstrap_telemetry(app, "fault-injection-engine", "http://otel-collector.kubepilot-observability.svc.cluster.local:4317")
event_bus = EventBusClient("redis://redis-master.kubepilot-system.svc.cluster.local:6379")
register_health_endpoints(app, "fault-injection-engine")

TARGET_NAMESPACE = "kubepilot-apps"

try:
    config.load_incluster_config()
except:
    logger.warning("Running outside cluster, trying kubeconfig")
    config.load_kube_config()

v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()

async def inject_fault(fault_type: str, target: str):
    logger.info(f"Injecting fault {fault_type} against {target} in namespace {TARGET_NAMESPACE}")
    
    # Very basic naive fault injection for hackathon demonstration purposes.
    # A true enterprise platform would use ChaosMesh or LitmusChaos.
    try:
        if fault_type == "pod_deletion":
            pods = v1.list_namespaced_pod(namespace=TARGET_NAMESPACE, label_selector=f"app={target}")
            for pod in pods.items:
                v1.delete_namespaced_pod(name=pod.metadata.name, namespace=TARGET_NAMESPACE)
                logger.info(f"Deleted pod {pod.metadata.name}")
                
        elif fault_type == "replica_reduction":
            deployment = apps_v1.read_namespaced_deployment(name=target, namespace=TARGET_NAMESPACE)
            deployment.spec.replicas = 0
            apps_v1.patch_namespaced_deployment(name=target, namespace=TARGET_NAMESPACE, body=deployment)
            logger.info(f"Scaled {target} to 0 replicas")
            
        elif fault_type in ["cpu_stress", "memory_stress"]:
            # Patch deployment with impossible resource limits to simulate starvation/CrashLoop
            deployment = apps_v1.read_namespaced_deployment(name=target, namespace=TARGET_NAMESPACE)
            for container in deployment.spec.template.spec.containers:
                container.resources = client.V1ResourceRequirements(
                    limits={"cpu": "10m", "memory": "10Mi"},
                    requests={"cpu": "10m", "memory": "10Mi"}
                )
            apps_v1.patch_namespaced_deployment(name=target, namespace=TARGET_NAMESPACE, body=deployment)
            logger.info(f"Applied resource stress to {target}")
            
        else:
            logger.warning(f"Fault type {fault_type} is mocked for this phase. Simulating generic disruption.")
            
    except Exception as e:
        logger.error(f"Failed to inject fault: {e}")

async def handle_fault_event(event_type: str, event: dict, message_id: str):
    if event_type == "InjectFault":
        target = event.get("target_service")
        if target == "all":
            target = "auth-service" # Default fallback for chaos
        await inject_fault(event.get("fault_type"), target)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting fault-injection-engine consumer in background...")
    asyncio.create_task(event_bus.consume(
        stream="fault.stream",
        group="fault_injection_group",
        consumer="fault_injector_1",
        callback=handle_fault_event
    ))
