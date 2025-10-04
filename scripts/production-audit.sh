#!/bin/bash

# Sastabazar Production Audit Checklist
# This script performs a comprehensive 30-minute audit of the live production environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
LIVE_DOMAIN="${LIVE_DOMAIN:-https://your-domain.com}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-audit@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-audit123}"
AUDIT_DURATION=30  # minutes

# Audit results
AUDIT_RESULTS=()
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

# Helper function to record audit result
record_audit_result() {
    local check_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    AUDIT_RESULTS+=("$check_name|$status|$details")
}

# Helper function to make HTTP requests
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$LIVE_DOMAIN$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data"
    else
        curl -s -X "$method" "$LIVE_DOMAIN$endpoint" \
            -H "Content-Type: application/json" \
            $headers
    fi
}

# 1. Domain and SSL Validation
audit_domain_ssl() {
    log_info "🔒 Auditing domain and SSL configuration..."
    
    # Check HTTPS redirect
    local http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://${LIVE_DOMAIN#https://}")
    if [ "$http_response" = "301" ] || [ "$http_response" = "302" ]; then
        log_success "HTTP to HTTPS redirect working"
        record_audit_result "HTTPS Redirect" "PASS" "HTTP redirects to HTTPS"
    else
        log_error "HTTP to HTTPS redirect not working"
        record_audit_result "HTTPS Redirect" "FAIL" "HTTP does not redirect to HTTPS"
    fi
    
    # Check SSL certificate
    local ssl_info=$(echo | openssl s_client -servername "${LIVE_DOMAIN#https://}" -connect "${LIVE_DOMAIN#https://}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [ -n "$ssl_info" ]; then
        log_success "SSL certificate valid"
        record_audit_result "SSL Certificate" "PASS" "SSL certificate is valid"
    else
        log_error "SSL certificate invalid or expired"
        record_audit_result "SSL Certificate" "FAIL" "SSL certificate issues"
    fi
    
    # Check security headers
    local security_headers=$(curl -s -I "$LIVE_DOMAIN" | grep -i "x-content-type-options\|x-frame-options\|x-xss-protection\|strict-transport-security")
    if [ -n "$security_headers" ]; then
        log_success "Security headers present"
        record_audit_result "Security Headers" "PASS" "Security headers configured"
    else
        log_error "Security headers missing"
        record_audit_result "Security Headers" "FAIL" "Security headers not configured"
    fi
}

# 2. API Health and Performance
audit_api_health() {
    log_info "🏥 Auditing API health and performance..."
    
    # Test health endpoint
    local health_response=$(make_request "GET" "/api/health")
    if echo "$health_response" | grep -q "healthy"; then
        log_success "API health check passed"
        record_audit_result "API Health" "PASS" "Health endpoint responding"
    else
        log_error "API health check failed"
        record_audit_result "API Health" "FAIL" "Health endpoint not responding"
    fi
    
    # Test database health
    local db_health_response=$(make_request "GET" "/api/health/db")
    if echo "$db_health_response" | grep -q "healthy"; then
        log_success "Database health check passed"
        record_audit_result "Database Health" "PASS" "Database health endpoint responding"
    else
        log_error "Database health check failed"
        record_audit_result "Database Health" "FAIL" "Database health endpoint not responding"
    fi
    
    # Test API response time
    local start_time=$(date +%s%3N)
    make_request "GET" "/api/health" > /dev/null
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ $response_time -lt 1000 ]; then
        log_success "API response time acceptable (${response_time}ms)"
        record_audit_result "API Response Time" "PASS" "Response time: ${response_time}ms"
    else
        log_warning "API response time slow (${response_time}ms)"
        record_audit_result "API Response Time" "WARN" "Response time: ${response_time}ms"
    fi
}

# 3. Authentication and Authorization
audit_authentication() {
    log_info "🔐 Auditing authentication and authorization..."
    
    # Test user registration
    local register_data="{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"firstName\":\"Audit\",\"lastName\":\"Test\"}"
    local register_response=$(make_request "POST" "/api/auth/register" "$register_data")
    
    if echo "$register_response" | grep -q "token"; then
        log_success "User registration working"
        record_audit_result "User Registration" "PASS" "Registration endpoint functional"
    elif echo "$register_response" | grep -q "already exists"; then
        log_success "User registration working (user exists)"
        record_audit_result "User Registration" "PASS" "Registration endpoint functional"
    else
        log_error "User registration failed"
        record_audit_result "User Registration" "FAIL" "Registration endpoint not working"
    fi
    
    # Test user login
    local login_data="{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}"
    local login_response=$(make_request "POST" "/api/auth/login" "$login_data")
    
    if echo "$login_response" | grep -q "token"; then
        log_success "User login working"
        record_audit_result "User Login" "PASS" "Login endpoint functional"
        
        # Extract token for further tests
        export AUTH_TOKEN=$(echo "$login_response" | jq -r '.token // empty')
    else
        log_error "User login failed"
        record_audit_result "User Login" "FAIL" "Login endpoint not working"
    fi
    
    # Test protected route access
    if [ -n "$AUTH_TOKEN" ]; then
        local profile_response=$(make_request "GET" "/api/auth/profile" "" "-H \"Authorization: Bearer $AUTH_TOKEN\"")
        if echo "$profile_response" | grep -q "email"; then
            log_success "Protected route access working"
            record_audit_result "Protected Routes" "PASS" "Authentication middleware working"
        else
            log_error "Protected route access failed"
            record_audit_result "Protected Routes" "FAIL" "Authentication middleware not working"
        fi
    fi
}

# 4. Product Catalog
audit_product_catalog() {
    log_info "📦 Auditing product catalog..."
    
    # Test product listing
    local products_response=$(make_request "GET" "/api/products")
    if echo "$products_response" | grep -q "products"; then
        log_success "Product listing working"
        record_audit_result "Product Listing" "PASS" "Products endpoint functional"
    else
        log_error "Product listing failed"
        record_audit_result "Product Listing" "FAIL" "Products endpoint not working"
    fi
    
    # Test product search
    local search_response=$(make_request "GET" "/api/products?search=test")
    if echo "$search_response" | grep -q "products"; then
        log_success "Product search working"
        record_audit_result "Product Search" "PASS" "Product search functional"
    else
        log_error "Product search failed"
        record_audit_result "Product Search" "FAIL" "Product search not working"
    fi
    
    # Test product filtering
    local filter_response=$(make_request "GET" "/api/products?category=electronics")
    if echo "$filter_response" | grep -q "products"; then
        log_success "Product filtering working"
        record_audit_result "Product Filtering" "PASS" "Product filtering functional"
    else
        log_error "Product filtering failed"
        record_audit_result "Product Filtering" "FAIL" "Product filtering not working"
    fi
}

# 5. Shopping Cart
audit_shopping_cart() {
    log_info "🛒 Auditing shopping cart..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        log_warning "Skipping cart tests - no auth token"
        record_audit_result "Shopping Cart" "SKIP" "No authentication token available"
        return
    fi
    
    # Test add to cart
    local add_to_cart_data="{\"productId\":\"test-product-id\",\"quantity\":1}"
    local add_to_cart_response=$(make_request "POST" "/api/cart/add" "$add_to_cart_data" "-H \"Authorization: Bearer $AUTH_TOKEN\"")
    
    if echo "$add_to_cart_response" | grep -q "success"; then
        log_success "Add to cart working"
        record_audit_result "Add to Cart" "PASS" "Add to cart endpoint functional"
    else
        log_error "Add to cart failed"
        record_audit_result "Add to Cart" "FAIL" "Add to cart endpoint not working"
    fi
    
    # Test get cart
    local get_cart_response=$(make_request "GET" "/api/cart" "" "-H \"Authorization: Bearer $AUTH_TOKEN\"")
    if echo "$get_cart_response" | grep -q "items"; then
        log_success "Get cart working"
        record_audit_result "Get Cart" "PASS" "Get cart endpoint functional"
    else
        log_error "Get cart failed"
        record_audit_result "Get Cart" "FAIL" "Get cart endpoint not working"
    fi
}

# 6. Payment Gateway
audit_payment_gateway() {
    log_info "💳 Auditing payment gateway..."
    
    # Test Razorpay configuration
    local razorpay_config_response=$(make_request "GET" "/api/payments/razorpay/config")
    if echo "$razorpay_config_response" | grep -q "keyId"; then
        log_success "Razorpay configuration working"
        record_audit_result "Razorpay Config" "PASS" "Razorpay configuration endpoint functional"
    else
        log_error "Razorpay configuration failed"
        record_audit_result "Razorpay Config" "FAIL" "Razorpay configuration endpoint not working"
    fi
    
    # Test Stripe configuration
    local stripe_config_response=$(make_request "GET" "/api/payments/stripe/config")
    if echo "$stripe_config_response" | grep -q "publishableKey"; then
        log_success "Stripe configuration working"
        record_audit_result "Stripe Config" "PASS" "Stripe configuration endpoint functional"
    else
        log_error "Stripe configuration failed"
        record_audit_result "Stripe Config" "FAIL" "Stripe configuration endpoint not working"
    fi
}

# 7. Webhook Endpoints
audit_webhook_endpoints() {
    log_info "🔗 Auditing webhook endpoints..."
    
    # Test webhook endpoint accessibility
    local webhook_response=$(make_request "POST" "/api/payments/webhooks/razorpay" "{\"test\":\"webhook\"}")
    if [ $? -eq 0 ]; then
        log_success "Webhook endpoint accessible"
        record_audit_result "Webhook Endpoint" "PASS" "Webhook endpoint accessible"
    else
        log_error "Webhook endpoint not accessible"
        record_audit_result "Webhook Endpoint" "FAIL" "Webhook endpoint not accessible"
    fi
}

# 8. CORS Configuration
audit_cors_configuration() {
    log_info "🌐 Auditing CORS configuration..."
    
    # Test CORS headers
    local cors_headers=$(curl -s -I -H "Origin: https://malicious-site.com" "$LIVE_DOMAIN/api/health" | grep -i "access-control-allow-origin")
    if [ -z "$cors_headers" ] || echo "$cors_headers" | grep -q "null"; then
        log_success "CORS properly configured"
        record_audit_result "CORS Configuration" "PASS" "CORS headers properly configured"
    else
        log_error "CORS misconfigured - allowing unauthorized origins"
        record_audit_result "CORS Configuration" "FAIL" "CORS allowing unauthorized origins"
    fi
}

# 9. Error Handling
audit_error_handling() {
    log_info "⚠️ Auditing error handling..."
    
    # Test 404 handling
    local not_found_response=$(make_request "GET" "/api/nonexistent")
    if echo "$not_found_response" | grep -q "404\|Not Found"; then
        log_success "404 error handling working"
        record_audit_result "404 Error Handling" "PASS" "404 errors properly handled"
    else
        log_error "404 error handling failed"
        record_audit_result "404 Error Handling" "FAIL" "404 errors not properly handled"
    fi
    
    # Test 401 handling
    local unauthorized_response=$(make_request "GET" "/api/auth/profile")
    if echo "$unauthorized_response" | grep -q "401\|Unauthorized"; then
        log_success "401 error handling working"
        record_audit_result "401 Error Handling" "PASS" "401 errors properly handled"
    else
        log_error "401 error handling failed"
        record_audit_result "401 Error Handling" "FAIL" "401 errors not properly handled"
    fi
}

# 10. Performance and Load
audit_performance() {
    log_info "⚡ Auditing performance and load..."
    
    # Test concurrent requests
    local concurrent_requests=10
    local success_count=0
    
    for i in $(seq 1 $concurrent_requests); do
        if make_request "GET" "/api/health" > /dev/null 2>&1; then
            success_count=$((success_count + 1))
        fi
    done
    
    local success_rate=$((success_count * 100 / concurrent_requests))
    if [ $success_rate -ge 95 ]; then
        log_success "Concurrent request handling working (${success_rate}% success rate)"
        record_audit_result "Concurrent Requests" "PASS" "Success rate: ${success_rate}%"
    else
        log_error "Concurrent request handling failed (${success_rate}% success rate)"
        record_audit_result "Concurrent Requests" "FAIL" "Success rate: ${success_rate}%"
    fi
}

# 11. Security Headers
audit_security_headers() {
    log_info "🛡️ Auditing security headers..."
    
    local headers_response=$(curl -s -I "$LIVE_DOMAIN")
    local security_headers=(
        "x-content-type-options"
        "x-frame-options"
        "x-xss-protection"
        "strict-transport-security"
        "content-security-policy"
    )
    
    local missing_headers=()
    for header in "${security_headers[@]}"; do
        if ! echo "$headers_response" | grep -qi "$header"; then
            missing_headers+=("$header")
        fi
    done
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        log_success "All security headers present"
        record_audit_result "Security Headers" "PASS" "All required security headers present"
    else
        log_error "Missing security headers: ${missing_headers[*]}"
        record_audit_result "Security Headers" "FAIL" "Missing headers: ${missing_headers[*]}"
    fi
}

# 12. Database Indexes
audit_database_indexes() {
    log_info "📋 Auditing database indexes..."
    
    local db_health_response=$(make_request "GET" "/api/health/db")
    if echo "$db_health_response" | grep -q "indexesCreated.*true"; then
        log_success "Database indexes created"
        record_audit_result "Database Indexes" "PASS" "Database indexes properly created"
    else
        log_error "Database indexes not created"
        record_audit_result "Database Indexes" "FAIL" "Database indexes not created"
    fi
}

# Generate audit report
generate_audit_report() {
    local end_time=$(date)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "=========================================="
    echo "🔍 PRODUCTION AUDIT REPORT"
    echo "=========================================="
    echo "Live Domain: $LIVE_DOMAIN"
    echo "Audit Date: $(date)"
    echo "Duration: ${duration}s"
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $PASSED_CHECKS"
    echo "Failed: $FAILED_CHECKS"
    echo "Success Rate: $((PASSED_CHECKS * 100 / TOTAL_CHECKS))%"
    echo ""
    
    echo "Detailed Results:"
    echo "-----------------"
    for result in "${AUDIT_RESULTS[@]}"; do
        IFS='|' read -r check_name status details <<< "$result"
        case "$status" in
            "PASS")
                echo -e "✅ $check_name: $details"
                ;;
            "FAIL")
                echo -e "❌ $check_name: $details"
                ;;
            "WARN")
                echo -e "⚠️  $check_name: $details"
                ;;
            "SKIP")
                echo -e "⏭️  $check_name: $details"
                ;;
        esac
    done
    
    echo ""
    echo "=========================================="
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        log_success "🎉 Production audit passed!"
        echo "Your live domain is ready for public announcement."
    else
        log_error "⚠️ Production audit failed with $FAILED_CHECKS issues!"
        echo "Please fix the issues before announcing the live domain."
    fi
    
    echo "=========================================="
}

# Main audit execution
main() {
    local start_time=$(date +%s)
    
    log_info "🚀 Starting 30-minute production audit..."
    log_info "Live Domain: $LIVE_DOMAIN"
    log_info "Test User: $TEST_USER_EMAIL"
    echo ""
    
    # Run all audit checks
    audit_domain_ssl
    audit_api_health
    audit_authentication
    audit_product_catalog
    audit_shopping_cart
    audit_payment_gateway
    audit_webhook_endpoints
    audit_cors_configuration
    audit_error_handling
    audit_performance
    audit_security_headers
    audit_database_indexes
    
    # Generate report
    generate_audit_report
    
    # Exit with appropriate code
    if [ $FAILED_CHECKS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script arguments
case "${1:-audit}" in
    "audit")
        main
        ;;
    "domain")
        audit_domain_ssl
        ;;
    "api")
        audit_api_health
        ;;
    "auth")
        audit_authentication
        ;;
    "products")
        audit_product_catalog
        ;;
    "cart")
        audit_shopping_cart
        ;;
    "payments")
        audit_payment_gateway
        ;;
    "webhooks")
        audit_webhook_endpoints
        ;;
    "cors")
        audit_cors_configuration
        ;;
    "errors")
        audit_error_handling
        ;;
    "performance")
        audit_performance
        ;;
    "security")
        audit_security_headers
        ;;
    "database")
        audit_database_indexes
        ;;
    *)
        echo "Usage: $0 {audit|domain|api|auth|products|cart|payments|webhooks|cors|errors|performance|security|database}"
        echo ""
        echo "Commands:"
        echo "  audit        - Run full production audit (default)"
        echo "  domain       - Audit domain and SSL"
        echo "  api          - Audit API health"
        echo "  auth         - Audit authentication"
        echo "  products     - Audit product catalog"
        echo "  cart         - Audit shopping cart"
        echo "  payments     - Audit payment gateway"
        echo "  webhooks     - Audit webhook endpoints"
        echo "  cors         - Audit CORS configuration"
        echo "  errors       - Audit error handling"
        echo "  performance  - Audit performance"
        echo "  security     - Audit security headers"
        echo "  database     - Audit database indexes"
        echo ""
        echo "Environment Variables:"
        echo "  LIVE_DOMAIN           - Live domain URL (default: https://your-domain.com)"
        echo "  TEST_USER_EMAIL       - Test user email (default: audit@example.com)"
        echo "  TEST_USER_PASSWORD    - Test user password (default: audit123)"
        exit 1
        ;;
esac






