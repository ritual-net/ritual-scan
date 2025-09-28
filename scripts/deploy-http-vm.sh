#!/bin/bash
# Deploy Ritual Explorer to HTTP-only Compute Engine VM
# Usage: ./scripts/deploy-http-vm.sh PROJECT_ID [INSTANCE_NAME] [ZONE]

set -e

PROJECT_ID=$1
INSTANCE_NAME=${2:-"ritual-explorer-vm"}
ZONE=${3:-"us-central1-a"}

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./scripts/deploy-http-vm.sh PROJECT_ID [INSTANCE_NAME] [ZONE]"
  echo "   Example: ./scripts/deploy-http-vm.sh testing-logging-2"
  exit 1
fi

echo "🚀 Deploying Ritual Explorer to HTTP-only VM..."
echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Instance: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo ""

# Create startup script
cat > startup-script.sh << 'EOF'
#!/bin/bash
# Update and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Pull and run the container
sudo docker pull gcr.io/testing-logging-2/ritual-explorer:latest
sudo docker run -d \
  --name ritual-explorer \
  --restart unless-stopped \
  -p 80:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_DEFAULT_CHAIN=ethereum \
  -e NEXT_PUBLIC_RETH_RPC_URL=http://35.185.40.237:8545 \
  -e NEXT_PUBLIC_RETH_WS_URL=ws://35.185.40.237:8546 \
  gcr.io/testing-logging-2/ritual-explorer:latest

echo "Ritual Explorer started on port 80"
EOF

# Create VM instance
echo "🖥️  Creating VM instance..."
gcloud compute instances create $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --machine-type=e2-medium \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --metadata-from-file startup-script=startup-script.sh \
  --tags=http-server,https-server

# Create firewall rule for HTTP
echo "🔥 Creating firewall rules..."
gcloud compute firewall-rules create allow-ritual-explorer-http \
  --project=$PROJECT_ID \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server \
  --description "Allow HTTP traffic to Ritual Explorer" || true

# Get external IP
echo "⏳ Waiting for VM to start..."
sleep 30

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your Ritual Explorer is available at:"
echo "   • HTTP URL: http://$EXTERNAL_IP"
echo "   • No HTTPS redirect - WebSocket will work!"
echo ""
echo "🔧 VM Management:"
echo "   • SSH: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"
echo "   • Logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command='sudo docker logs ritual-explorer'"
echo "   • Stop: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"
echo "   • Delete: gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"

# Cleanup
rm startup-script.sh
