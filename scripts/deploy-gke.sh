#!/bin/bash
# Quick GKE Deployment Script for Ritual Explorer
# Usage: ./scripts/deploy-gke.sh PROJECT_ID [CLUSTER_NAME] [REGION]

set -e

PROJECT_ID=$1
CLUSTER_NAME=${2:-"ritual-explorer-cluster"}
REGION=${3:-"us-central1"}

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./scripts/deploy-gke.sh PROJECT_ID [CLUSTER_NAME] [REGION]"
  echo "   Example: ./scripts/deploy-gke.sh my-project-123"
  exit 1
fi

echo "🚀 Quick GKE Deployment for Ritual Explorer..."
echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Cluster Name: $CLUSTER_NAME"
echo "   Region: $REGION"
echo ""

# Check if cluster exists
echo "🔍 Checking if GKE cluster exists..."
if ! gcloud container clusters describe $CLUSTER_NAME --region=$REGION --project=$PROJECT_ID >/dev/null 2>&1; then
  echo "❌ Cluster $CLUSTER_NAME not found!"
  echo "🛠️  Run this first: make setup-gke PROJECT_ID=$PROJECT_ID"
  exit 1
fi

# Get cluster credentials
echo "🔑 Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION --project=$PROJECT_ID

# Build and push image
echo "🏗️  Building and pushing Docker image..."
make docker-build PROJECT_ID=$PROJECT_ID
make docker-push-gcr PROJECT_ID=$PROJECT_ID

# Deploy to GKE
echo "☸️  Deploying to GKE..."
make deploy-gke PROJECT_ID=$PROJECT_ID

# Get service information
echo "🌐 Getting service information..."
kubectl get services ritual-explorer-service

# Check if LoadBalancer is available
echo "⏳ Waiting for LoadBalancer IP (this may take a few minutes)..."
kubectl wait --for=condition=ready --timeout=300s service/ritual-explorer-service || true

# Get external IP
EXTERNAL_IP=$(kubectl get service ritual-explorer-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

echo ""
echo "✅ Deployment completed successfully!"
echo "📊 Status:"
kubectl get pods -l app=ritual-explorer
echo ""
echo "🌐 Access your Ritual Explorer:"
if [ "$EXTERNAL_IP" != "pending" ] && [ -n "$EXTERNAL_IP" ]; then
  echo "   • External IP: http://$EXTERNAL_IP"
else
  echo "   • External IP: Still provisioning... Check with 'kubectl get services'"
fi
echo "   • Port forward: kubectl port-forward service/ritual-explorer-service 8080:80"
echo "   • Access via: http://localhost:8080"
echo ""
echo "🔧 Useful commands:"
echo "   • Check status: make gke-status"
echo "   • View logs: make gke-logs"
echo "   • Scale up: make gke-scale REPLICAS=5"
echo "   • Access shell: make gke-shell"
echo "   • Cleanup: make gke-cleanup"
