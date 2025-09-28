#!/bin/bash
# Setup GCP project for Ritual Explorer deployment
# Usage: ./scripts/setup-gcp-project.sh PROJECT_ID

set -e

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./scripts/setup-gcp-project.sh PROJECT_ID"
  echo "   Example: ./scripts/setup-gcp-project.sh ritual-explorer-prod"
  exit 1
fi

echo "🔧 Setting up GCP project: $PROJECT_ID"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com  
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create service account for Cloud Run
echo "👤 Creating service account..."
gcloud iam service-accounts create ritual-explorer-sa \
  --display-name="Ritual Explorer Service Account" \
  --description="Service account for Ritual blockchain explorer" || true

# Grant necessary permissions
echo "🔐 Setting up permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:ritual-explorer-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:ritual-explorer-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Create secrets (user will need to populate these)
echo "🔒 Creating secret placeholders..."
echo "REPLACE_WITH_YOUR_RPC_URL" | gcloud secrets create ritual-rpc-url --data-file=- || echo "Secret already exists"
echo "REPLACE_WITH_YOUR_WS_URL" | gcloud secrets create ritual-ws-url --data-file=- || echo "Secret already exists"

# Set up Cloud Build trigger (optional)
echo "🏗️  Setting up Cloud Build..."
# This would require GitHub integration - skipping for manual setup

# Create monitoring workspace
echo "📊 Setting up monitoring..."
# Monitoring workspace is auto-created when first accessed

echo ""
echo "✅ GCP project setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update secrets with actual values:"
echo "      gcloud secrets versions add ritual-rpc-url --data-file=<(echo 'http://your-rpc-url:8545')"
echo "      gcloud secrets versions add ritual-ws-url --data-file=<(echo 'ws://your-rpc-url:8546')"
echo ""
echo "   2. Deploy the application:"
echo "      ./scripts/deploy-gcp.sh $PROJECT_ID"
echo ""
echo "   3. (Optional) Set up custom domain:"
echo "      gcloud run domain-mappings create --service ritual-explorer --domain your-domain.com"
echo ""
echo "🔗 Useful links:"
echo "   - Cloud Console: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
echo "   - Cloud Run: https://console.cloud.google.com/run?project=$PROJECT_ID"  
echo "   - Cloud Build: https://console.cloud.google.com/cloud-build?project=$PROJECT_ID"
echo "   - Secret Manager: https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
