#!/bin/bash
# Deploy HTTP-only Ritual Explorer to GKE
# Usage: ./scripts/deploy-gke-http.sh PROJECT_ID [CLUSTER_NAME] [REGION]

set -e

PROJECT_ID=$1
CLUSTER_NAME=${2:-"ritual-explorer-cluster"}
REGION=${3:-"us-central1"}

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./scripts/deploy-gke-http.sh PROJECT_ID [CLUSTER_NAME] [REGION]"
  echo "   Example: ./scripts/deploy-gke-http.sh testing-logging-2"
  exit 1
fi

echo "🚀 Deploying HTTP-only Ritual Explorer to GKE..."
echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Cluster Name: $CLUSTER_NAME"
echo "   Region: $REGION"
echo ""

# Set project and get credentials
echo "🔧 Setting up cluster access..."
gcloud config set project $PROJECT_ID
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION --project=$PROJECT_ID

# Verify cluster connectivity
echo "✅ Testing cluster connectivity..."
kubectl cluster-info --request-timeout=10s

# Create static IP for HTTP LoadBalancer
echo "🌐 Creating static external IP..."
gcloud compute addresses create ritual-explorer-ip --global --project=$PROJECT_ID || echo "IP already exists"

# Deploy HTTP-only version
echo "☸️  Deploying HTTP-only Ritual Explorer..."
sed "s/PROJECT_ID/$PROJECT_ID/g" k8s/http-deployment.yaml | kubectl apply -f -

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/ritual-explorer-http --timeout=300s

# Get service information
echo "🌐 Getting service information..."
kubectl get services ritual-explorer-http-service
kubectl get ingress ritual-explorer-http-ingress

# Wait for external IP
echo "⏳ Waiting for LoadBalancer IP (this may take a few minutes)..."
EXTERNAL_IP=""
for i in {1..30}; do
  EXTERNAL_IP=$(kubectl get service ritual-explorer-http-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
  if [ -n "$EXTERNAL_IP" ]; then
    break
  fi
  echo "Waiting for IP... ($i/30)"
  sleep 10
done

echo ""
echo "✅ HTTP-only GKE deployment completed!"
echo "📊 Deployment Status:"
kubectl get pods -l app=ritual-explorer-http
echo ""
echo "🌐 Access Your HTTP-only Ritual Explorer:"
if [ -n "$EXTERNAL_IP" ]; then
  echo "   • HTTP URL: http://$EXTERNAL_IP"
  echo "   • No HTTPS redirect - WebSocket will work!"
else
  echo "   • External IP still provisioning..."
  echo "   • Check with: kubectl get services ritual-explorer-http-service"
fi
echo ""
echo "🔧 Useful commands:"
echo "   • Check pods: kubectl get pods -l app=ritual-explorer-http"
echo "   • View logs: kubectl logs -l app=ritual-explorer-http"
echo "   • Port forward: kubectl port-forward service/ritual-explorer-http-service 8080:80"
echo "   • Scale: kubectl scale deployment ritual-explorer-http --replicas=3"
echo "   • Delete: kubectl delete -f k8s/http-deployment.yaml"
