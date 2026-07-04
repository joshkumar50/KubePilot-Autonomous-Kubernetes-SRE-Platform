# Installation Guide
1. `kubectl create namespace kubepilot-system`
2. `kubectl create namespace kubepilot-apps`
3. Deploy PostgreSQL and Redis: `helm install data-tier infra/helm/data/`
4. Deploy KubePilot: `helm install kubepilot infra/helm/kubepilot/`
