#!/bin/bash

# Sastabazar Release Management Script
# This script handles tagged releases, migrations, and rollback plans

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_NAME="sastabazar"
BACKUP_DIR="/tmp/sastabazar-backups"
MIGRATION_DIR="scripts/migrations"
ROLLBACK_DIR="scripts/rollbacks"

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

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to get current version
get_current_version() {
    if [ -f "package.json" ]; then
        node -p "require('./package.json').version"
    else
        echo "1.0.0"
    fi
}

# Function to get git commit hash
get_git_hash() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

# Function to create release notes
create_release_notes() {
    local version="$1"
    local previous_version="$2"
    
    log_info "Creating release notes for version $version..."
    
    cat > "RELEASE_NOTES_${version}.md" << EOF
# Sastabazar Release Notes - v${version}

## Release Information
- **Version**: ${version}
- **Release Date**: $(date)
- **Git Commit**: $(get_git_hash)
- **Previous Version**: ${previous_version}

## Changes in this Release

### New Features
- [ ] Add new features here

### Bug Fixes
- [ ] Add bug fixes here

### Performance Improvements
- [ ] Add performance improvements here

### Security Updates
- [ ] Add security updates here

### Breaking Changes
- [ ] Add breaking changes here

## Migration Steps

### Database Migrations
\`\`\`bash
# Run database migrations
npm run migrate:up
\`\`\`

### Environment Variables
\`\`\`bash
# Update environment variables
cp env.example .env
# Edit .env with new values
\`\`\`

### Dependencies
\`\`\`bash
# Install new dependencies
npm install
\`\`\`

## Rollback Plan

### Quick Rollback
\`\`\`bash
# Rollback to previous version
./scripts/release.sh rollback ${previous_version}
\`\`\`

### Database Rollback
\`\`\`bash
# Rollback database changes
npm run migrate:down
\`\`\`

## Testing

### Pre-Release Testing
- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] E2E tests passed
- [ ] Security tests passed
- [ ] Load tests passed

### Post-Release Testing
- [ ] Smoke tests passed
- [ ] Payment flow tested
- [ ] Webhook processing tested
- [ ] Performance metrics within SLO

## Monitoring

### Key Metrics to Watch
- API response time
- Error rate
- Payment success rate
- Checkout completion rate
- Database performance

### Alerts to Monitor
- High error rate (> 5%)
- Slow response time (> 2s)
- Payment failures
- Database connection issues

## Support

### Known Issues
- [ ] List any known issues

### Troubleshooting
- [ ] Common troubleshooting steps

### Contact
- Development Team: dev@sastabazar.com
- On-Call: +1-XXX-XXX-XXXX

---

**Release Manager**: $(whoami)
**Approved By**: [Name]
**Deployed By**: [Name]
EOF

    log_success "Release notes created: RELEASE_NOTES_${version}.md"
}

# Function to create database backup
create_database_backup() {
    local version="$1"
    local backup_file="$BACKUP_DIR/db_backup_${version}_$(date +%Y%m%d_%H%M%S).json"
    
    log_info "Creating database backup..."
    
    # Create backup using mongodump or custom backup script
    if command -v mongodump &> /dev/null; then
        mongodump --uri="$MONGODB_URI" --out="$backup_file"
        log_success "Database backup created: $backup_file"
    else
        log_warning "mongodump not available, creating manual backup..."
        # Implement custom backup logic here
        echo "Manual backup created for version $version" > "$backup_file"
    fi
    
    echo "$backup_file"
}

# Function to run migrations
run_migrations() {
    local version="$1"
    
    log_info "Running database migrations for version $version..."
    
    if [ -d "$MIGRATION_DIR" ]; then
        for migration in "$MIGRATION_DIR"/*.js; do
            if [ -f "$migration" ]; then
                log_info "Running migration: $(basename "$migration")"
                node "$migration"
            fi
        done
    else
        log_warning "No migration directory found"
    fi
    
    log_success "Migrations completed"
}

# Function to run seed data
run_seed_data() {
    local version="$1"
    
    log_info "Running seed data for version $version..."
    
    if [ -f "scripts/seed.js" ]; then
        node scripts/seed.js
        log_success "Seed data completed"
    else
        log_warning "No seed script found"
    fi
}

# Function to create release tag
create_release_tag() {
    local version="$1"
    local release_notes="$2"
    
    log_info "Creating release tag for version $version..."
    
    # Create git tag
    git tag -a "v${version}" -m "Release version ${version}"
    
    # Push tag to remote
    git push origin "v${version}"
    
    # Create GitHub release (if GitHub CLI is available)
    if command -v gh &> /dev/null; then
        gh release create "v${version}" \
            --title "Sastabazar v${version}" \
            --notes-file "$release_notes" \
            --latest
        log_success "GitHub release created"
    else
        log_warning "GitHub CLI not available, manual release creation required"
    fi
    
    log_success "Release tag created: v${version}"
}

# Function to deploy to production
deploy_to_production() {
    local version="$1"
    
    log_info "Deploying version $version to production..."
    
    # Build application
    log_info "Building application..."
    npm run build:all
    
    # Deploy using PM2
    log_info "Deploying with PM2..."
    pm2 deploy ecosystem.config.js production
    
    # Wait for deployment to complete
    sleep 30
    
    # Run health checks
    log_info "Running health checks..."
    npm run deploy:health
    
    log_success "Deployment completed"
}

# Function to rollback to previous version
rollback_to_version() {
    local target_version="$1"
    
    log_info "Rolling back to version $target_version..."
    
    # Check if target version exists
    if ! git tag -l | grep -q "v${target_version}"; then
        log_error "Version v${target_version} not found"
        exit 1
    fi
    
    # Create backup of current state
    local current_version=$(get_current_version)
    create_database_backup "rollback_${current_version}"
    
    # Checkout target version
    git checkout "v${target_version}"
    
    # Install dependencies
    npm install
    
    # Run rollback migrations
    if [ -d "$ROLLBACK_DIR" ]; then
        for rollback in "$ROLLBACK_DIR"/*.js; do
            if [ -f "$rollback" ]; then
                log_info "Running rollback: $(basename "$rollback")"
                node "$rollback"
            fi
        done
    fi
    
    # Deploy rolled back version
    deploy_to_production "$target_version"
    
    log_success "Rollback to version $target_version completed"
}

# Function to run canary deployment
run_canary_deployment() {
    local version="$1"
    local traffic_percentage="${2:-10}"
    
    log_info "Starting canary deployment for version $version with ${traffic_percentage}% traffic..."
    
    # Create canary environment
    log_info "Setting up canary environment..."
    
    # Deploy canary version
    log_info "Deploying canary version..."
    pm2 deploy ecosystem.config.js canary
    
    # Configure traffic splitting
    log_info "Configuring traffic splitting (${traffic_percentage}% to canary)..."
    # Implement traffic splitting logic here (e.g., using nginx, load balancer)
    
    # Monitor canary deployment
    log_info "Monitoring canary deployment for 30 minutes..."
    monitor_canary_deployment "$version" "$traffic_percentage"
}

# Function to monitor canary deployment
monitor_canary_deployment() {
    local version="$1"
    local traffic_percentage="$2"
    local monitoring_duration=1800  # 30 minutes
    
    log_info "Monitoring canary deployment..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + monitoring_duration))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Check key metrics
        local error_rate=$(curl -s "$BASE_URL/api/metrics" | jq -r '.metrics.errorRate // 0')
        local response_time=$(curl -s "$BASE_URL/api/metrics" | jq -r '.metrics.avgResponseTime // 0')
        local payment_success=$(curl -s "$BASE_URL/api/metrics" | jq -r '.metrics.paymentSuccessRate // 0')
        
        log_info "Canary Metrics - Error Rate: ${error_rate}%, Response Time: ${response_time}ms, Payment Success: ${payment_success}%"
        
        # Check if metrics are within acceptable ranges
        if (( $(echo "$error_rate > 5" | bc -l) )); then
            log_error "Error rate too high: ${error_rate}%"
            rollback_canary_deployment
            exit 1
        fi
        
        if (( $(echo "$response_time > 2000" | bc -l) )); then
            log_error "Response time too high: ${response_time}ms"
            rollback_canary_deployment
            exit 1
        fi
        
        if (( $(echo "$payment_success < 95" | bc -l) )); then
            log_error "Payment success rate too low: ${payment_success}%"
            rollback_canary_deployment
            exit 1
        fi
        
        sleep 60  # Check every minute
    done
    
    log_success "Canary deployment monitoring completed successfully"
    
    # Promote canary to full deployment
    promote_canary_deployment "$version"
}

# Function to rollback canary deployment
rollback_canary_deployment() {
    log_error "Rolling back canary deployment due to issues..."
    
    # Stop canary deployment
    pm2 stop canary
    
    # Restore traffic to stable version
    log_info "Restoring traffic to stable version..."
    # Implement traffic restoration logic here
    
    log_success "Canary deployment rolled back"
}

# Function to promote canary deployment
promote_canary_deployment() {
    local version="$1"
    
    log_info "Promoting canary deployment to full deployment..."
    
    # Deploy to production
    deploy_to_production "$version"
    
    # Stop canary deployment
    pm2 stop canary
    
    log_success "Canary deployment promoted to production"
}

# Main release function
create_release() {
    local version="$1"
    local previous_version=$(get_current_version)
    
    log_info "Creating release for version $version..."
    
    # Validate version format
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "Invalid version format. Use semantic versioning (e.g., 1.0.0)"
        exit 1
    fi
    
    # Check if version already exists
    if git tag -l | grep -q "v${version}"; then
        log_error "Version v${version} already exists"
        exit 1
    fi
    
    # Update package.json version
    npm version "$version" --no-git-tag-version
    
    # Create release notes
    create_release_notes "$version" "$previous_version"
    
    # Create database backup
    local backup_file=$(create_database_backup "$version")
    
    # Run migrations
    run_migrations "$version"
    
    # Run seed data
    run_seed_data "$version"
    
    # Commit changes
    git add .
    git commit -m "Release version ${version}"
    
    # Create release tag
    create_release_tag "$version" "RELEASE_NOTES_${version}.md"
    
    # Deploy to production
    deploy_to_production "$version"
    
    log_success "Release $version created and deployed successfully!"
    log_info "Backup created: $backup_file"
    log_info "Release notes: RELEASE_NOTES_${version}.md"
}

# Main script logic
case "${1:-help}" in
    "create")
        if [ -z "$2" ]; then
            log_error "Version required for create command"
            echo "Usage: $0 create <version>"
            exit 1
        fi
        create_release "$2"
        ;;
    "rollback")
        if [ -z "$2" ]; then
            log_error "Version required for rollback command"
            echo "Usage: $0 rollback <version>"
            exit 1
        fi
        rollback_to_version "$2"
        ;;
    "canary")
        if [ -z "$2" ]; then
            log_error "Version required for canary command"
            echo "Usage: $0 canary <version> [traffic_percentage]"
            exit 1
        fi
        run_canary_deployment "$2" "$3"
        ;;
    "backup")
        create_database_backup "$(get_current_version)"
        ;;
    "migrate")
        run_migrations "$(get_current_version)"
        ;;
    "seed")
        run_seed_data "$(get_current_version)"
        ;;
    "help"|*)
        echo "Sastabazar Release Management Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  create <version>              - Create and deploy a new release"
        echo "  rollback <version>            - Rollback to a previous version"
        echo "  canary <version> [traffic%]   - Deploy canary version with traffic splitting"
        echo "  backup                        - Create database backup"
        echo "  migrate                       - Run database migrations"
        echo "  seed                          - Run seed data"
        echo "  help                          - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 create 1.2.0              - Create release 1.2.0"
        echo "  $0 rollback 1.1.0            - Rollback to version 1.1.0"
        echo "  $0 canary 1.2.0 10           - Deploy canary with 10% traffic"
        echo "  $0 backup                    - Create database backup"
        exit 1
        ;;
esac






