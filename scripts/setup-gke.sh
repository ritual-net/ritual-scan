#!/bin/bash
# GKE Cluster Setup for Ritual Explorer
# Usage: ./scripts/setup-gke.sh PROJECT_ID [CLUSTER_NAME] [REGION]

set -e

PROJECT_ID=$1
CLUSTER_NAME=${2:-"ritual-explorer-cluster"}
REGION=${3:-"us-central1"}
SERVICE_ACCOUNT_NAME="ritual-explorer-sa"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./scripts/setup-gke.sh PROJECT_ID [CLUSTER_NAME] [REGION]"
  echo "   Example: ./scripts/setup-gke.sh my-project-123 ritual-explorer-cluster us-central1"
  exit 1
fi

echo "🚀 Setting up GKE cluster for Ritual Explorer..."
echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Cluster Name: $CLUSTER_NAME"
echo "   Region: $REGION"
echo ""

# Set project
echo "🔧 Setting project context..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create service account for GKE
echo "🔐 Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="Ritual Explorer Service Account" \
  --description="Service account for Ritual Explorer GKE deployment" || true

# Grant necessary permissions
echo "🔐 Granting IAM permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/container.developer" || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin" || true

# Create GKE cluster
echo "☸️  Creating GKE cluster (this may take 5-10 minutes)..."
gcloud container clusters create $CLUSTER_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --num-nodes=2 \
  --node-locations=$REGION-a,$REGION-b \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=5 \
  --machine-type=n1-standard-1 \
  --disk-size=30GB \
  --enable-autorepair \
  --enable-autoupgrade \
  --service-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --enable-ip-alias \
  --network=default \
  --subnetwork=default \
  --addons=HttpLoadBalancing,HorizontalPodAutoscaling

# Get cluster credentials
echo "🔑 Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION --project=$PROJECT_ID

# Verify cluster
echo "✅ Verifying cluster setup..."
kubectl cluster-info
kubectl get nodes

# Create namespace
echo "📦 Creating ritual-explorer namespace..."
kubectl create namespace ritual-explorer || true

# Setup container registry authentication
echo "🔐 Configuring Docker authentication for GCR..."
gcloud auth configure-docker

echo ""
echo "✅ GKE cluster setup complete!"
echo "🌐 Cluster Name: $CLUSTER_NAME"
echo "📍 Region: $REGION"
echo "🔧 Nodes: $(kubectl get nodes --no-headers | wc -l)"
echo ""
echo "🔧 Next steps:"
echo "   1. Update k8s/deployment.yaml with correct image registry"
echo "   2. Build and push Docker image: make docker-build-gcr"
echo "   3. Deploy application: make deploy-gke"
echo "   4. Check status: kubectl get pods -n ritual-explorer"
echo ""
echo "💡 Useful commands:"
echo "   • View cluster: gcloud container clusters describe $CLUSTER_NAME --region=$REGION"
echo "   • Delete cluster: gcloud container clusters delete $CLUSTER_NAME --region=$REGION"
echo "   • Scale cluster: gcloud container clusters resize $CLUSTER_NAME --num-nodes=3 --region=$REGION"
