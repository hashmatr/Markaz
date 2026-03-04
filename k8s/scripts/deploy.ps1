# ─────────────────────────────────────────────────────────────────────────────
# deploy.ps1  — Full build → push → deploy pipeline for Markaz on Kubernetes
#
# Prerequisites:
#   - Docker Desktop running (with Kubernetes enabled, or connected to a cluster)
#   - kubectl configured and pointing to the right cluster
#   - Logged in to GHCR: docker login ghcr.io -u <github-username>
#
# Usage:
#   .\k8s\scripts\deploy.ps1 [-Registry "ghcr.io/hashmatr"] [-Tag "latest"]
# ─────────────────────────────────────────────────────────────────────────────

param(
    [string]$Registry = "ghcr.io/hashmatr",   # Change to your registry
    [string]$Tag = "latest"
)

$Root = Join-Path $PSScriptRoot "..\.."
$BackendImage = "${Registry}/markaz-backend:${Tag}"
$FrontendImage = "${Registry}/markaz-frontend:${Tag}"

# ── Helper: exit on failure ───────────────────────────────────────────────────
function Assert-Success {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ FAILED at step: $Step"
        exit 1
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Markaz — Kubernetes Deployment             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── STEP 1: Build images ────────────────────────────────────────────────────
Write-Host "🔨 [1/5] Building backend image..." -ForegroundColor Yellow
docker build -t $BackendImage "$Root\Backend"
Assert-Success "Backend build"

Write-Host "🔨 [1/5] Building frontend image..." -ForegroundColor Yellow
docker build -t $FrontendImage "$Root\Frontend"
Assert-Success "Frontend build"

# ─── STEP 2: Push images ─────────────────────────────────────────────────────
Write-Host "📤 [2/5] Pushing backend image..." -ForegroundColor Yellow
docker push $BackendImage
Assert-Success "Backend push"

Write-Host "📤 [2/5] Pushing frontend image..." -ForegroundColor Yellow
docker push $FrontendImage
Assert-Success "Frontend push"

# ─── STEP 3: Apply Namespace ─────────────────────────────────────────────────
Write-Host "📁 [3/5] Applying namespace..." -ForegroundColor Yellow
kubectl apply -f "$Root\k8s\namespace.yaml"
Assert-Success "Namespace"

# ─── STEP 4: Create Secret from .env ─────────────────────────────────────────
Write-Host "🔐 [4/5] Syncing secrets from Backend/.env..." -ForegroundColor Yellow
& "$Root\k8s\scripts\create-secret.ps1"
Assert-Success "Secrets"

# ─── STEP 5: Apply all manifests ─────────────────────────────────────────────
Write-Host "🚀 [5/5] Applying Kubernetes manifests..." -ForegroundColor Yellow

kubectl apply -f "$Root\k8s\backend\configmap.yaml"
kubectl apply -f "$Root\k8s\backend\deployment.yaml"
kubectl apply -f "$Root\k8s\backend\service.yaml"
kubectl apply -f "$Root\k8s\frontend\deployment.yaml"
kubectl apply -f "$Root\k8s\frontend\service.yaml"
kubectl apply -f "$Root\k8s\hpa.yaml"
# kubectl apply -f "$Root\k8s\ingress.yaml"   # Uncomment when Ingress Controller is installed

Assert-Success "Manifests"

# ─── Done ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "✅ Deployment complete! Checking pod status..." -ForegroundColor Green
Write-Host ""
kubectl get pods -n markaz
Write-Host ""
Write-Host "📡 Services:" -ForegroundColor Cyan
kubectl get svc -n markaz
Write-Host ""
Write-Host "💡 To watch pods start up live, run:" -ForegroundColor DarkGray
Write-Host "   kubectl get pods -n markaz -w" -ForegroundColor DarkGray
Write-Host "💡 To view backend logs:" -ForegroundColor DarkGray
Write-Host "   kubectl logs -n markaz -l app=backend -f" -ForegroundColor DarkGray
