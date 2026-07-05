# KubePilot
**Autonomous Kubernetes SRE Platform**

*Observe. Reason. Recover. Learn.*

---
## Team Nexbit (Table 43)
- **Team Leader**: Josh Kumar
- **Team Members**: Venkata Naga Sai, Bindu Mohan Sai, Likith Kumar

## PROBLEM STATEMENT 02
**Agentic Root-Cause Diagnosis & Auto-Remediation for a Single Kubernetes Cluster**
- **Primary Domain**: Artificial Intelligence & Machine Learning
- **Secondary Domain**: Cybersecurity & Digital Privacy — autonomous detection-and-response pattern
- **Track Type**: Software
---

KubePilot Autonomous Kubernetes SRE Platform is an Enterprise Production Grade Autonomous Site Reliability Engineering platform designed to run natively on Kubernetes. It moves beyond standard observability by automatically identifying, diagnosing, and remediating complex systemic failures in real-time.

## Architecture
The platform implements a strict event-driven architecture using Redis Streams.

1. **Phase 1-3 (Business Services)**: Normal target applications simulating failures.
2. **Phase 4 (SRE Core)**: Telemetry Collection -> Anomaly Detection -> Dependency Graphing -> Incident mapping.
3. **Phase 5 (AI Platform)**: AI Orchestrator coordinates Root Cause Analysis, Knowledge Retrieval, and deterministic Decision Engineering. LLMs are strictly isolated.
4. **Phase 6 (Execution)**: Execution Engine enforces Policy and safely triggers K8s Rollouts via the Python Client, followed by closed-loop Verification.

## Core Capabilities
- **Local-First Execution**: Fully functional offline on Minikube/Docker Desktop without cloud dependencies.
- **Mathematical Anomaly Detection**: Employs Rolling Z-Scores and EWMA rather than brittle static thresholds.
- **Autonomous Root Cause Analysis**: Correlates trace dependency graphs with anomalies to pinpoint the upstream culprit without blaming the downstream victim.
- **Autonomous Remediation**: The Decision Engine selects safe K8s API operations (Scale, Restart) and the Recovery Engine verifies success.
- **Chaos Engineering**: Built-in endpoints to simulate memory leaks, network delays, and CPU spikes safely.

## Repository Structure
- `apps/`: The demo e-commerce target microservices.
- `platform/`: The SRE engines (Anomaly, Dependency, Incident, AI, Decision, Recovery).
- `pkg/`: Shared Python/Node libraries (EventBus, Telemetry, Math).
- `infra/`: Kubernetes manifests, Helm charts, Observability stack.

## Getting Started
The entire platform can be deployed locally using Minikube with a single click.

1. Ensure Docker Desktop and Minikube are installed.
2. Run the deployment script:
   ```powershell
   .\start.ps1
   ```
   This intelligent script will automatically:
   - Start Minikube.
   - Build all 17 microservices locally directly into the Minikube Docker daemon (caching intelligently).
   - Apply configurations and rollout deployments.
   - Set up self-healing background port-forwarding for the UI and API Gateway.

3. Access the platform:
   - **UI Dashboard**: http://127.0.0.1:56115
   - **API Gateway**: http://localhost:58663/api/dashboard
