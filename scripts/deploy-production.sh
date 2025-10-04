#!/bin/bash

# Sastabazar Production Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

echo "🚀 Starting Sastabazar Production Deployment..."

# Configuration
APP_NAME="sastabazar-server"
DEPLOY_USER="node"
DEPLOY_HOST="your-server.com"
DEPLOY_PATH="/var/www/sastabazar"
REPO_URL="git@github.com:your-username/sastabazar.git"
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Please install PM2 first:"
        echo "npm install -g pm2"
        exit 1
    fi
    log_success "PM2 is installed"
}

# Check if required environment variables are set
check_env() {
    log_info "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please create it from env.example"
        exit 1
    fi
    
    # Check for required production variables
    required_vars=("MONGODB_URI" "JWT_SECRET" "RAZORPAY_KEY_ID" "RAZORPAY_KEY_SECRET")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=your-" .env; then
            log_error "Required environment variable ${var} is not properly configured"
            exit 1
        fi
    done
    
    log_success "Environment configuration is valid"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run security tests
    log_info "Running security review..."
    npm run test:security
    
    # Run E2E tests
    log_info "Running E2E tests..."
    npm run test:e2e
    
    # Run load tests
    log_info "Running load tests..."
    npm run test:load
    
    log_success "All tests passed"
}

# Build the application
build_app() {
    log_info "Building application..."
    
    # Install dependencies
    npm ci --production=false
    
    # Build frontend
    cd client
    npm ci
    npm run build
    cd ..
    
    log_success "Application built successfully"
}

# Deploy to server
deploy_to_server() {
    log_info "Deploying to server..."
    
    # Create deployment directory if it doesn't exist
    ssh ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p ${DEPLOY_PATH}"
    
    # Copy files to server
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.env' \
        --exclude 'logs' \
        --exclude 'uploads' \
        ./ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/
    
    # Copy environment file
    scp .env ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/.env
    
    log_success "Files copied to server"
}

# Setup server
setup_server() {
    log_info "Setting up server..."
    
    ssh ${DEPLOY_USER}@${DEPLOY_HOST} << EOF
        cd ${DEPLOY_PATH}
        
        # Install dependencies
        npm ci --production
        
        # Create logs directory
        mkdir -p logs
        
        # Create uploads directory
        mkdir -p uploads
        
        # Set proper permissions
        chmod 755 logs uploads
        
        # Install PM2 if not installed
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        fi
        
        # Start/restart application with PM2
        pm2 delete ${APP_NAME} || true
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 startup script
        pm2 startup systemd -u ${DEPLOY_USER} --hp /home/${DEPLOY_USER} || true
        
        log_success "Server setup completed"
EOF
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://${DEPLOY_HOST}:5000/api/health > /dev/null 2>&1; then
        log_success "Application is healthy and responding"
    else
        log_error "Application health check failed"
        exit 1
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment process..."
    
    check_pm2
    check_env
    run_tests
    build_app
    deploy_to_server
    setup_server
    health_check
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Application is now running at: http://${DEPLOY_HOST}:5000"
    log_info "API Health Check: http://${DEPLOY_HOST}:5000/api/health"
    log_info "Database Health Check: http://${DEPLOY_HOST}:5000/api/health/db"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test")
        check_pm2
        check_env
        run_tests
        ;;
    "build")
        check_env
        build_app
        ;;
    "health")
        health_check
        ;;
    "logs")
        ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && pm2 logs ${APP_NAME}"
        ;;
    "restart")
        ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && pm2 restart ${APP_NAME}"
        ;;
    "stop")
        ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && pm2 stop ${APP_NAME}"
        ;;
    *)
        echo "Usage: $0 {deploy|test|build|health|logs|restart|stop}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment process (default)"
        echo "  test    - Run all tests"
        echo "  build   - Build the application"
        echo "  health  - Check application health"
        echo "  logs    - View application logs"
        echo "  restart - Restart the application"
        echo "  stop    - Stop the application"
        exit 1
        ;;
esac



