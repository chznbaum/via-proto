#!/bin/bash
set -e

# Upload Next.js static assets to Scaleway S3
# Usage: ./scripts/upload-static-to-s3.sh [staging|production]

ENVIRONMENT="${1:-staging}"
ENDPOINT="https://s3.nl-ams.scw.cloud"

if [ "$ENVIRONMENT" = "production" ]; then
  BUCKET="viaproto-prod"
elif [ "$ENVIRONMENT" = "staging" ]; then
  BUCKET="viaproto-dev"
else
  echo "Usage: $0 [staging|production]"
  exit 1
fi

echo "Uploading to $ENVIRONMENT bucket: $BUCKET"

# Check if .next/static exists
if [ ! -d ".next/static" ]; then
  echo "Error: .next/static directory not found. Run 'npm run build:$ENVIRONMENT' first."
  exit 1
fi

# Check AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set"
  echo "These should be your Scaleway API credentials"
  exit 1
fi

# Upload _next/static with immutable cache headers
echo "Uploading .next/static..."
aws s3 sync .next/static "s3://${BUCKET}/_next/static" \
  --endpoint-url "$ENDPOINT" \
  --acl public-read \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

# Upload public folder assets (fonts, images, etc.)
echo "Uploading public folder..."
aws s3 sync ./public "s3://${BUCKET}/" \
  --endpoint-url "$ENDPOINT" \
  --acl public-read \
  --cache-control "public,max-age=86400" \
  --exclude "*.html"

echo ""
echo "Static assets uploaded successfully to $BUCKET"

if [ "$ENVIRONMENT" = "production" ]; then
  echo "CDN URL: https://cdn.viapro.to"
else
  echo "CDN URL: https://cdn-dev.viapro.to"
fi
