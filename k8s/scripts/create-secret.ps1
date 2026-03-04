# ─────────────────────────────────────────────────────────────────────────────
# create-secret.ps1
# Reads Backend/.env and creates the Kubernetes Secret in the markaz namespace.
# Run this ONCE before your first deployment (or after rotating secrets).
#
# Usage:
#   .\k8s\scripts\create-secret.ps1
# ─────────────────────────────────────────────────────────────────────────────

$envFile = Join-Path $PSScriptRoot "..\..\Backend\.env"

if (-not (Test-Path $envFile)) {
    Write-Error "Backend/.env not found at: $envFile"
    exit 1
}

Write-Host "📦 Creating Kubernetes Secret from Backend/.env ..." -ForegroundColor Cyan

kubectl create secret generic backend-secret `
    --namespace=markaz `
    --from-env-file="$envFile" `
    --dry-run=client -o yaml | kubectl apply -f -

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ backend-secret created/updated successfully." -ForegroundColor Green
} else {
    Write-Error "❌ Failed to create secret. Is kubectl connected to your cluster?"
}
