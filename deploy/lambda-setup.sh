#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy/lambda-setup.sh
#
# ONE-TIME setup: Creates the IAM role and Lambda function.
# Run this ONCE before using deploy.sh.
#
# Usage:
#   bash deploy/lambda-setup.sh
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - FINNHUB_API_KEY set in your shell, or edit the variable below
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config — edit these ───────────────────────────────────────────────────────
FUNCTION_NAME="finnhub-mcp-server"
REGION="${AWS_REGION:-us-east-1}"
RUNTIME="nodejs20.x"
HANDLER="dist/lambda.handler"
MEMORY=256          # MB
TIMEOUT=30          # seconds
FINNHUB_API_KEY="${FINNHUB_API_KEY:-da4hcq9r01qo2j88mcugda4hcq9r01qo2j88mcv0}"
ROLE_NAME="finnhub-mcp-lambda-role"
# ─────────────────────────────────────────────────────────────────────────────

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo "🔧 Setting up Finnhub MCP Lambda..."
echo "   Region      : $REGION"
echo "   Account     : $ACCOUNT_ID"
echo "   Function    : $FUNCTION_NAME"
echo ""

# ── Step 1: Create IAM role ───────────────────────────────────────────────────
echo "📋 Step 1/4: Creating IAM role..."

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}'

if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
  echo "   ✅ Role already exists, skipping."
else
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --region "$REGION" > /dev/null

  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

  echo "   ✅ IAM role created: $ROLE_NAME"
  echo "   ⏳ Waiting 10s for IAM propagation..."
  sleep 10
fi

# ── Step 2: Build + package ───────────────────────────────────────────────────
echo "📦 Step 2/4: Building and packaging..."

cd "$(dirname "$0")/.."

# Ensure devDeps (tsc) are present before building
npm install --silent
npx tsc
# Strip to production-only deps for the zip
npm ci --omit=dev --silent

rm -f finnhub-mcp.zip
zip -r finnhub-mcp.zip dist/ node_modules/ package.json --quiet

echo "   ✅ Package ready: finnhub-mcp.zip ($(du -sh finnhub-mcp.zip | cut -f1))"


# ── Step 3: Create Lambda function ───────────────────────────────────────────
echo "🚀 Step 3/4: Creating Lambda function..."

aws lambda create-function \
  --function-name "$FUNCTION_NAME" \
  --runtime "$RUNTIME" \
  --handler "$HANDLER" \
  --role "$ROLE_ARN" \
  --zip-file "fileb://finnhub-mcp.zip" \
  --environment "Variables={FINNHUB_API_KEY=$FINNHUB_API_KEY}" \
  --memory-size "$MEMORY" \
  --timeout "$TIMEOUT" \
  --region "$REGION" > /dev/null

echo "   ✅ Lambda function created!"

# ── Step 4: Create Function URL ───────────────────────────────────────────────
echo "🌐 Step 4/4: Creating Function URL..."

aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region "$REGION" > /dev/null

FUNCTION_URL=$(aws lambda create-function-url-config \
  --function-name "$FUNCTION_NAME" \
  --auth-type NONE \
  --invoke-mode BUFFERED \
  --region "$REGION" \
  --query FunctionUrl \
  --output text)

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Setup complete!"
echo ""
echo "  Function URL : $FUNCTION_URL"
echo "  MCP Endpoint : ${FUNCTION_URL}mcp"
echo "  Health Check : ${FUNCTION_URL}health"
echo ""
echo "  To update the code in future, run:"
echo "    npm run deploy"
echo "════════════════════════════════════════════════════════════"
