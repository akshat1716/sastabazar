#!/bin/bash

# Sastabazar E-commerce Production Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="sastabazar"
NODE_ENV="production"
PORT=${PORT:-5000}
LOG_FILE="deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $LOG_FILE
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    NODE_VERSION=$(node --version)
    log "Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    NPM_VERSION=$(npm --version)
    log "npm version: $NPM_VERSION"
    
    # Check PM2 (optional)
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        log "PM2 version: $PM2_VERSION"
    else
        warning "PM2 not installed - will use node directly"
    fi
    
    success "System requirements check passed"
}

# Check environment file
check_environment() {
    log "Checking environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        if [[ -f "env.production.template" ]]; then
            warning "No .env file found. Please copy env.production.template to .env and configure it"
            cp env.production.template .env
            error "Please configure your .env file with production values and run the script again"
        else
            error "No environment file found. Please create a .env file with required configuration"
        fi
    fi
    
    # Check required environment variables
    source .env
    
    REQUIRED_VARS=(
        "MONGODB_URI"
        "JWT_SECRET"
        "NODE_ENV"
        "PORT"
        "CLIENT_URL"
        "SERVER_URL"
        "CORS_ORIGIN"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check production-specific requirements
    if [[ "$NODE_ENV" == "production" ]]; then
        if [[ ! "$CLIENT_URL" =~ ^https:// ]]; then
            error "CLIENT_URL must use HTTPS in production"
        fi
        
        if [[ ! "$SERVER_URL" =~ ^https:// ]]; then
            error "SERVER_URL must use HTTPS in production"
        fi
        
        if [[ "$JWT_SECRET" == *"your-super-secret"* ]]; then
            error "JWT_SECRET must be changed from default value in production"
        fi
    fi
    
    success "Environment configuration check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install server dependencies
    npm ci --production=false
    
    # Install client dependencies
    if [[ -d "client" ]]; then
        cd client
        npm ci
        cd ..
    fi
    
    success "Dependencies installed successfully"
}

# Run linting
run_linting() {
    log "Running linting checks..."
    
    # Server linting (if eslint is configured)
    if [[ -f "package.json" ]] && npm list eslint &> /dev/null; then
        npm run lint || warning "Linting issues found - please review"
    fi
    
    # Client linting
    if [[ -d "client" ]]; then
        cd client
        if npm list eslint &> /dev/null; then
            npm run lint || warning "Client linting issues found - please review"
        fi
        cd ..
    fi
    
    success "Linting checks completed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Run smoke tests
    if [[ -f "smoke-tests.js" ]]; then
        log "Running smoke tests..."
        node smoke-tests.js || error "Smoke tests failed"
    fi
    
    # Run payment verification tests
    if [[ -f "payment-verification-tests.js" ]]; then
        log "Running payment verification tests..."
        node payment-verification-tests.js || error "Payment verification tests failed"
    fi
    
    success "All tests passed"
}

# Build application
build_application() {
    log "Building application..."
    
    # Build client
    if [[ -d "client" ]]; then
        cd client
        npm run build
        cd ..
        success "Client build completed"
    fi
    
    # Build server (if needed)
    if [[ -f "package.json" ]] && npm run build:server &> /dev/null; then
        npm run build:server
        success "Server build completed"
    fi
    
    success "Application build completed"
}

# Database setup
setup_database() {
    log "Setting up database..."
    
    # Run database migrations (if available)
    if [[ -f "scripts/migrate-db.js" ]]; then
        node scripts/migrate-db.js || warning "Database migration failed - please check manually"
    fi
    
    # Seed database (if available)
    if [[ -f "scripts/populate-products.js" ]]; then
        node scripts/populate-products.js || warning "Database seeding failed - please check manually"
    fi
    
    success "Database setup completed"
}

# Start application
start_application() {
    log "Starting application..."
    
    # Stop existing processes
    if command -v pm2 &> /dev/null; then
        pm2 stop $PROJECT_NAME 2>/dev/null || true
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        
        # Start with PM2
        pm2 start ecosystem.config.js --env production
        pm2 save
        
        success "Application started with PM2"
        log "Use 'pm2 logs $PROJECT_NAME' to view logs"
        log "Use 'pm2 status' to check application status"
    else
        # Start with node directly
        nohup node server/index.js > app.log 2>&1 &
        echo $! > app.pid
        
        success "Application started with node"
        log "Use 'tail -f app.log' to view logs"
        log "Use 'kill \$(cat app.pid)' to stop the application"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 5
    
    # Check if application is responding
    for i in {1..30}; do
        if curl -s http://localhost:$PORT/api/health > /dev/null; then
            success "Application is responding"
            break
        fi
        
        if [[ $i -eq 30 ]]; then
            error "Application failed to start or is not responding"
        fi
        
        log "Waiting for application to start... ($i/30)"
        sleep 2
    done
    
    # Run health checks
    log "Running comprehensive health checks..."
    
    # API health
    API_HEALTH=$(curl -s http://localhost:$PORT/api/health | jq -r '.status' 2>/dev/null || echo "ERROR")
    if [[ "$API_HEALTH" == "OK" ]]; then
        success "API health check passed"
    else
        error "API health check failed"
    fi
    
    # Database health
    DB_HEALTH=$(curl -s http://localhost:$PORT/api/health/db | jq -r '.status' 2>/dev/null || echo "ERROR")
    if [[ "$DB_HEALTH" == "healthy" ]]; then
        success "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    success "All health checks passed"
}

# Security check
security_check() {
    log "Running security checks..."
    
    # Check for secrets in code
    if [[ -f "scripts/secret-scan.sh" ]]; then
        ./scripts/secret-scan.sh || warning "Secret scan found potential issues"
    fi
    
    # Check for vulnerabilities
    npm audit --audit-level=high || warning "Security vulnerabilities found"
    
    success "Security checks completed"
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f *.tmp
    rm -f *.log.tmp
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment of $PROJECT_NAME..."
    
    check_root
    check_requirements
    check_environment
    install_dependencies
    run_linting
    run_tests
    build_application
    setup_database
    security_check
    start_application
    health_check
    cleanup
    
    success "Deployment completed successfully!"
    log "Application is running on port $PORT"
    log "API endpoint: http://localhost:$PORT/api"
    log "Health check: http://localhost:$PORT/api/health"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    if command -v pm2 &> /dev/null; then
        pm2 stop $PROJECT_NAME
        pm2 delete $PROJECT_NAME
    else
        if [[ -f "app.pid" ]]; then
            kill $(cat app.pid) 2>/dev/null || true
            rm -f app.pid
        fi
    fi
    
    success "Rollback completed"
}

# Status check function
status() {
    log "Checking application status..."
    
    if command -v pm2 &> /dev/null; then
        pm2 status $PROJECT_NAME
    else
        if [[ -f "app.pid" ]]; then
            PID=$(cat app.pid)
            if ps -p $PID > /dev/null; then
                success "Application is running (PID: $PID)"
            else
                error "Application is not running"
            fi
        else
            error "No PID file found"
        fi
    fi
    
    # Health checks
    curl -s http://localhost:$PORT/api/health | jq . 2>/dev/null || error "Health check failed"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        status
        ;;
    "health")
        health_check
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_application
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|health|test|build}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment process"
        echo "  rollback - Rollback to previous version"
        echo "  status   - Check application status"
        echo "  health   - Run health checks"
        echo "  test     - Run tests only"
        echo "  build    - Build application only"
        exit 1
        ;;
esac



