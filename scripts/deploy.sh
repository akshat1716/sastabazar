#!/bin/bash

# sastabazar Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Environment-specific configuration
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${BLUE}🚀 Deploying to PRODUCTION${NC}"
    DEPLOY_PATH="${PRODUCTION_PATH:-/var/www/sastabazar}"
    HOST="${PRODUCTION_HOST}"
    USER="${PRODUCTION_USER}"
    SSH_KEY="${PRODUCTION_SSH_KEY}"
    MONGODB_URI="${PRODUCTION_MONGODB_URI}"
    JWT_SECRET="${PRODUCTION_JWT_SECRET}"
    RAZORPAY_KEY_ID="${PRODUCTION_RAZORPAY_KEY_ID}"
    RAZORPAY_KEY_SECRET="${PRODUCTION_RAZORPAY_KEY_SECRET}"
    STRIPE_SECRET_KEY="${PRODUCTION_STRIPE_SECRET_KEY}"
    STRIPE_PUBLISHABLE_KEY="${PRODUCTION_STRIPE_PUBLISHABLE_KEY}"
    STRIPE_WEBHOOK_SECRET="${PRODUCTION_STRIPE_WEBHOOK_SECRET}"
    CORS_ORIGIN="${PRODUCTION_CORS_ORIGIN}"
    NODE_ENV="production"
else
    echo -e "${YELLOW}🚀 Deploying to STAGING${NC}"
    DEPLOY_PATH="${STAGING_PATH:-/var/www/sastabazar-staging}"
    HOST="${STAGING_HOST}"
    USER="${STAGING_USER}"
    SSH_KEY="${STAGING_SSH_KEY}"
    MONGODB_URI="${STAGING_MONGODB_URI}"
    JWT_SECRET="${STAGING_JWT_SECRET}"
    RAZORPAY_KEY_ID="${STAGING_RAZORPAY_KEY_ID}"
    RAZORPAY_KEY_SECRET="${STAGING_RAZORPAY_KEY_SECRET}"
    STRIPE_SECRET_KEY="${STAGING_STRIPE_SECRET_KEY}"
    STRIPE_PUBLISHABLE_KEY="${STAGING_STRIPE_PUBLISHABLE_KEY}"
    STRIPE_WEBHOOK_SECRET="${STAGING_STRIPE_WEBHOOK_SECRET}"
    CORS_ORIGIN="${STAGING_CORS_ORIGIN}"
    NODE_ENV="staging"
fi

# Validate required environment variables
validate_env() {
    local missing_vars=()
    
    [ -z "$HOST" ] && missing_vars+=("HOST")
    [ -z "$USER" ] && missing_vars+=("USER")
    [ -z "$SSH_KEY" ] && missing_vars+=("SSH_KEY")
    [ -z "$MONGODB_URI" ] && missing_vars+=("MONGODB_URI")
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        echo -e "${YELLOW}Please set the required environment variables before deploying.${NC}"
        exit 1
    fi
}

# Build the application
build_app() {
    echo -e "${BLUE}📦 Building application...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
    
    cd client
    npm ci
    cd ..
    
    # Build application
    echo -e "${YELLOW}Building client...${NC}"
    npm run build:all
    
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Run database migration
run_migration() {
    echo -e "${BLUE}🗄️ Running database migration...${NC}"
    
    cd "$PROJECT_DIR"
    
    # Set environment variables for migration
    export MONGODB_URI="$MONGODB_URI"
    export JWT_SECRET="$JWT_SECRET"
    export NODE_ENV="$NODE_ENV"
    
    # Run migration
    npm run migrate
    
    # Add sample data for staging
    if [ "$ENVIRONMENT" = "staging" ]; then
        echo -e "${YELLOW}Adding sample data to staging...${NC}"
        npm run seed
    fi
    
    echo -e "${GREEN}✅ Database migration complete${NC}"
}

# Deploy to server
deploy_to_server() {
    echo -e "${BLUE}🚀 Deploying to server...${NC}"
    
    # Create deployment script
    cat > deploy-remote.sh << 'EOF'
#!/bin/bash
set -e

DEPLOY_PATH="$1"
NODE_ENV="$2"

echo "🚀 Starting deployment to $DEPLOY_PATH"

# Create backup of current deployment
if [ -d "$DEPLOY_PATH" ]; then
    echo "📦 Creating backup..."
    cp -r "$DEPLOY_PATH" "$DEPLOY_PATH.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create deployment directory
mkdir -p "$DEPLOY_PATH"

# Copy files
echo "📁 Copying files..."
cp -r client/dist "$DEPLOY_PATH/"
cp -r server "$DEPLOY_PATH/"
cp package.json package-lock.json ecosystem.config.js "$DEPLOY_PATH/"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$DEPLOY_PATH"
npm ci --only=production

# Restart application with PM2
echo "🔄 Restarting application..."
pm2 stop sastabazar-server || true
pm2 start ecosystem.config.js --env "$NODE_ENV"
pm2 save

echo "✅ Deployment complete"
EOF
    
    chmod +x deploy-remote.sh
    
    # Deploy using SSH
    echo -e "${YELLOW}Connecting to $USER@$HOST...${NC}"
    ssh -o StrictHostKeyChecking=no -i <(echo "$SSH_KEY") "$USER@$HOST" 'bash -s' < deploy-remote.sh "$DEPLOY_PATH" "$NODE_ENV"
    
    # Cleanup
    rm deploy-remote.sh
    
    echo -e "${GREEN}✅ Deployment to server complete${NC}"
}

# Run smoke tests
run_smoke_tests() {
    echo -e "${BLUE}🧪 Running smoke tests...${NC}"
    
    local base_url
    if [ "$ENVIRONMENT" = "production" ]; then
        base_url="${PRODUCTION_URL:-https://sastabazar.com}"
    else
        base_url="${STAGING_URL:-https://staging.sastabazar.com}"
    fi
    
    # Wait for deployment to be ready
    echo -e "${YELLOW}Waiting for deployment to be ready...${NC}"
    sleep 30
    
    # Test endpoints
    echo -e "${YELLOW}Testing API health...${NC}"
    curl -f "$base_url/api/health" || (echo -e "${RED}❌ API health check failed${NC}" && exit 1)
    
    echo -e "${YELLOW}Testing database health...${NC}"
    curl -f "$base_url/api/health/db" || (echo -e "${RED}❌ Database health check failed${NC}" && exit 1)
    
    echo -e "${YELLOW}Testing products endpoint...${NC}"
    curl -f "$base_url/api/products" || (echo -e "${RED}❌ Products endpoint failed${NC}" && exit 1)
    
    echo -e "${YELLOW}Testing payment config endpoints...${NC}"
    curl -f "$base_url/api/payments/razorpay/config" || (echo -e "${RED}❌ Razorpay config failed${NC}" && exit 1)
    curl -f "$base_url/api/payments/stripe/config" || (echo -e "${RED}❌ Stripe config failed${NC}" && exit 1)
    
    echo -e "${GREEN}✅ All smoke tests passed${NC}"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Starting $ENVIRONMENT deployment${NC}"
    
    # Validate environment
    validate_env
    
    # Build application
    build_app
    
    # Run migration
    run_migration
    
    # Deploy to server
    deploy_to_server
    
    # Run smoke tests
    run_smoke_tests
    
    echo -e "${GREEN}🎉 $ENVIRONMENT deployment successful!${NC}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${BLUE}🌐 Production URL: ${PRODUCTION_URL:-https://sastabazar.com}${NC}"
    else
        echo -e "${BLUE}🌐 Staging URL: ${STAGING_URL:-https://staging.sastabazar.com}${NC}"
    fi
}

# Error handling
trap 'echo -e "${RED}❌ Deployment failed at line $LINENO${NC}"; exit 1' ERR

# Run main function
main "$@"

