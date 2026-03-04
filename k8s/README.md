# Markaz — Kubernetes Setup

## Directory Structure

```
k8s/
├── namespace.yaml               # markaz namespace
├── hpa.yaml                     # Horizontal Pod Autoscalers (both services)
├── ingress.yaml                 # Ingress routing (requires nginx-ingress-controller)
├── backend/
│   ├── configmap.yaml           # Non-sensitive env vars
│   ├── secret.template.yaml     # Secret structure (DO NOT commit with real values)
│   ├── deployment.yaml          # Backend Deployment (2 replicas)
│   └── service.yaml             # ClusterIP Service on port 5000
├── frontend/
│   ├── deployment.yaml          # Frontend Deployment (2 replicas, Nginx)
│   └── service.yaml             # LoadBalancer Service on port 80
└── scripts/
    ├── create-secret.ps1        # Creates K8s Secret from Backend/.env
    └── deploy.ps1               # Full build, push, deploy pipeline
```

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| Docker Desktop | Build images (enable Kubernetes in Settings > Kubernetes) |
| kubectl | Apply manifests |
| A container registry | Store images (GitHub Container Registry recommended) |

---

## Quick Start

### Step 1 — Login to GitHub Container Registry

```powershell
docker login ghcr.io -u hashmatr
# Enter your GitHub Personal Access Token (with write:packages scope)
```

### Step 2 — Update image names in manifests

Edit these two files and replace the registry path if needed:

- k8s/backend/deployment.yaml  ->  image: field
- k8s/frontend/deployment.yaml ->  image: field

### Step 3 — Run the one-shot deploy script

```powershell
cd e:\Mern\Projects\Ecommers\Markaz
.\k8s\scripts\deploy.ps1
```

This will:
1. Build both Docker images
2. Push them to your registry
3. Apply the markaz namespace
4. Create the Kubernetes Secret from Backend/.env
5. Apply all deployments, services, and HPAs

---

## Manual Deployment (Step by Step)

```powershell
# 1. Namespace
kubectl apply -f k8s/namespace.yaml

# 2. Secrets (reads from Backend/.env automatically)
.\k8s\scripts\create-secret.ps1

# 3. Backend
kubectl apply -f k8s/backend/configmap.yaml
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/service.yaml

# 4. Frontend
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/frontend/service.yaml

# 5. Autoscaling
kubectl apply -f k8s/hpa.yaml
```

---

## Local Testing with Minikube

```powershell
# Start Minikube
minikube start

# Point Docker to Minikubes daemon (avoids pushing to a registry)
minikube docker-env | Invoke-Expression

# Build images directly into Minikube
docker build -t ghcr.io/hashmatr/markaz-backend:latest ./Backend
docker build -t ghcr.io/hashmatr/markaz-frontend:latest ./Frontend

# In deployment.yaml files, set imagePullPolicy: Never to use local images

# Apply manifests
kubectl apply -f k8s/namespace.yaml
.\k8s\scripts\create-secret.ps1
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Access the frontend (change service type to NodePort first)
minikube service frontend -n markaz
```

---

## Useful Commands

```powershell
# Watch all pods come up
kubectl get pods -n markaz -w

# Check backend logs (all replicas)
kubectl logs -n markaz -l app=backend -f

# Check frontend logs
kubectl logs -n markaz -l app=frontend -f

# View HPA scaling activity
kubectl get hpa -n markaz

# Describe a crashing pod
kubectl describe pod -n markaz <pod-name>

# Rollback a bad deployment
kubectl rollout undo deployment/backend -n markaz
kubectl rollout undo deployment/frontend -n markaz

# Check rollout status
kubectl rollout status deployment/backend -n markaz

# Delete everything
kubectl delete namespace markaz
```

---

## Architecture

```
Internet
    |
    v
[ LoadBalancer Service :80 ]
    |
    v
[ Frontend Pods - Nginx ]  --- /api/* --->  [ Backend Service :5000 ]
    |  (serves static React)                        |
    |                                               v
    |                                   [ Backend Pods - Node.js ]
    |                                               |
    |                              .----------------------------------.
    |                              |               |                 |
    |                        MongoDB Atlas   Upstash Redis      Pinecone
    v
[ Browser - React SPA ]
```

No DB or Redis containers needed. MongoDB Atlas and Upstash Redis are cloud-hosted.
