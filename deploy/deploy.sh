#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy/deploy.sh
#
# REDEPLOY: Updates the Lambda function code after code changes.
# Run this every time you update the server.
#
# Usage:
#   npm run deploy
#   # or directly:
#   bash deploy/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

FUNCTION_NAME="finnhub-mcp-server"
REGION="${AWS_REGION:-us-east-1}"

echo "🔄 Redeploying $FUNCTION_NAME to AWS Lambda..."

cd "$(dirname "$0")/.."

# ── Ensure all deps (including devDeps for tsc) are installed ────────────────
echo "📦 Installing dependencies..."
npm install --silent

# ── Build ─────────────────────────────────────────────────────────────────────
echo "📦 Building TypeScript..."
npx tsc

# ── Install production deps only ──────────────────────────────────────────────
echo "📦 Installing production dependencies only..."
npm ci --omit=dev --silent

# ── Package ───────────────────────────────────────────────────────────────────
echo "📦 Creating zip package..."
rm -f finnhub-mcp.zip
zip -r finnhub-mcp.zip dist/ node_modules/ package.json --quiet
echo "   Package size: $(du -sh finnhub-mcp.zip | cut -f1)"

# ── Upload ────────────────────────────────────────────────────────────────────
echo "🚀 Uploading to Lambda..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://finnhub-mcp.zip" \
  --region "$REGION" \
  --no-cli-pager > /dev/null

echo "⏳ Waiting for update to complete..."
aws lambda wait function-updated \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION"

# ── Get Function URL ──────────────────────────────────────────────────────────
FUNCTION_URL=$(aws lambda get-function-url-config \
  --function-name "$FUNCTION_NAME" \
  --region "$REGION" \
  --query FunctionUrl \
  --output text 2>/dev/null || echo "")

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Deployed successfully!"
if [ -n "$FUNCTION_URL" ]; then
echo ""
echo "  MCP Endpoint : ${FUNCTION_URL}mcp"
echo "  Health Check : ${FUNCTION_URL}health"
fi
echo "════════════════════════════════════════════════════════════"

# ── Restore dev deps ──────────────────────────────────────────────────────────
npm install --silent
