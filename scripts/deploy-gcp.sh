#!/bin/bash
# Deploy Ritual Explorer to Google Cloud Platform
# Usage: ./scripts/deploy-gcp.sh PROJECT_ID [SERVICE_NAME] [REGION]

set -e

PROJECT_ID=$1
SERVICE_NAME=${2:-"ritual-explorer"}
REGION=${3:-"us-central1"}

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./scripts/deploy-gcp.sh PROJECT_ID [SERVICE_NAME] [REGION]"
  echo "   Example: ./scripts/deploy-gcp.sh my-project-123 ritual-explorer us-central1"
  exit 1
fi

echo "🚀 Deploying Ritual Explorer to GCP..."
echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Service Name: $SERVICE_NAME" 
echo "   Region: $REGION"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Check if required APIs are enabled
echo "🔧 Checking required APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Build container image
echo "🏗️  Building container image..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} .

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 100 \
  --max-instances 10 \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars NEXT_TELEMETRY_DISABLED=1

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your Ritual Explorer is live at: $SERVICE_URL"
echo "📊 View logs: gcloud logs read \"resource.type=cloud_run_revision\" --limit=50"
echo "⚙️  Manage service: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/general?project=${PROJECT_ID}"
echo ""
echo "🔧 Next steps:"
echo "   1. Add custom domain: gcloud run domain-mappings create --service ${SERVICE_NAME} --domain your-domain.com"
echo "   2. Configure RPC endpoints in Cloud Run environment variables"
echo "   3. Set up monitoring and alerting"
echo "   4. Enable Cloud Armor for DDoS protection"
