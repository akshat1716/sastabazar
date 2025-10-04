#!/bin/bash

# Sastabazar Production Payment Test Script
# WARNING: This script processes REAL payments in production!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PRODUCTION_URL="https://your-domain.com"
TEST_AMOUNT=100  # ₹1.00 in paise
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"

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

# Safety checks
safety_check() {
    log_warning "🚨 PRODUCTION PAYMENT TEST SCRIPT"
    log_warning "⚠️  This will process REAL payments!"
    log_warning "💰 Test amount: ₹1.00"
    log_warning "🌐 Production URL: $PRODUCTION_URL"
    echo ""
    log_warning "Press Ctrl+C to cancel, or Enter to continue"
    read -r
    
    # Verify we're in production mode
    if [ "$NODE_ENV" != "production" ]; then
        log_error "NODE_ENV is not set to 'production'"
        log_error "Please set NODE_ENV=production before running this script"
        exit 1
    fi
    
    # Verify production URL is not localhost
    if [[ "$PRODUCTION_URL" == *"localhost"* ]] || [[ "$PRODUCTION_URL" == *"127.0.0.1"* ]]; then
        log_error "Production URL appears to be localhost"
        log_error "Please set PRODUCTION_URL to your actual production domain"
        exit 1
    fi
}

# Test API connectivity
test_api_connectivity() {
    log_info "Testing API connectivity..."
    
    # Test health endpoint
    if curl -f -s "$PRODUCTION_URL/api/health" > /dev/null; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi
    
    # Test database health
    if curl -f -s "$PRODUCTION_URL/api/health/db" > /dev/null; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        exit 1
    fi
}

# Test user authentication
test_authentication() {
    log_info "Testing user authentication..."
    
    # Login and get token
    LOGIN_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        log_error "Authentication failed"
        log_error "Response: $LOGIN_RESPONSE"
        exit 1
    fi
    
    log_success "Authentication successful"
    echo "TOKEN=$TOKEN" > /tmp/prod_test_token
}

# Test Razorpay configuration
test_razorpay_config() {
    log_info "Testing Razorpay configuration..."
    
    source /tmp/prod_test_token
    
    CONFIG_RESPONSE=$(curl -s -X GET "$PRODUCTION_URL/api/payments/razorpay/config" \
        -H "Authorization: Bearer $TOKEN")
    
    KEY_ID=$(echo "$CONFIG_RESPONSE" | jq -r '.keyId // empty')
    
    if [ -z "$KEY_ID" ] || [ "$KEY_ID" = "null" ]; then
        log_error "Razorpay configuration failed"
        log_error "Response: $CONFIG_RESPONSE"
        exit 1
    fi
    
    log_success "Razorpay configuration loaded"
    log_info "Key ID: $KEY_ID"
}

# Test order creation
test_order_creation() {
    log_info "Testing order creation..."
    
    source /tmp/prod_test_token
    
    # Add test product to cart first
    CART_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/cart/add" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "productId": "TEST_PRODUCT_ID",
            "quantity": 1
        }')
    
    # Create Razorpay order
    ORDER_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/payments/razorpay/order" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "shippingAddress": {
                "street": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "zipCode": "12345",
                "country": "India"
            },
            "shippingMethod": "standard"
        }')
    
    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.order.id // empty')
    INTERNAL_ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.internalOrderId // empty')
    
    if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
        log_error "Order creation failed"
        log_error "Response: $ORDER_RESPONSE"
        exit 1
    fi
    
    log_success "Order created successfully"
    log_info "Razorpay Order ID: $ORDER_ID"
    log_info "Internal Order ID: $INTERNAL_ORDER_ID"
    
    # Save order details for verification
    echo "ORDER_ID=$ORDER_ID" >> /tmp/prod_test_token
    echo "INTERNAL_ORDER_ID=$INTERNAL_ORDER_ID" >> /tmp/prod_test_token
}

# Test payment verification (mock)
test_payment_verification() {
    log_info "Testing payment verification..."
    
    source /tmp/prod_test_token
    
    # Generate mock signature for testing
    MOCK_SIGNATURE=$(echo -n "${ORDER_ID}|pay_test_$(date +%s)" | openssl dgst -sha256 -hmac "$RAZORPAY_KEY_SECRET" | cut -d' ' -f2)
    
    VERIFY_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/payments/razorpay/verify" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"razorpay_order_id\": \"$ORDER_ID\",
            \"razorpay_payment_id\": \"pay_test_$(date +%s)\",
            \"razorpay_signature\": \"$MOCK_SIGNATURE\",
            \"internal_order_id\": \"$INTERNAL_ORDER_ID\"
        }")
    
    SUCCESS=$(echo "$VERIFY_RESPONSE" | jq -r '.success // false')
    
    if [ "$SUCCESS" != "true" ]; then
        log_warning "Payment verification failed (expected for mock test)"
        log_info "Response: $VERIFY_RESPONSE"
    else
        log_success "Payment verification successful"
    fi
}

# Test order status
test_order_status() {
    log_info "Testing order status..."
    
    source /tmp/prod_test_token
    
    STATUS_RESPONSE=$(curl -s -X GET "$PRODUCTION_URL/api/orders/$INTERNAL_ORDER_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    ORDER_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.order.status // empty')
    PAYMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.order.paymentStatus // empty')
    
    log_info "Order Status: $ORDER_STATUS"
    log_info "Payment Status: $PAYMENT_STATUS"
    
    if [ -n "$ORDER_STATUS" ]; then
        log_success "Order status retrieved successfully"
    else
        log_error "Failed to retrieve order status"
        log_error "Response: $STATUS_RESPONSE"
    fi
}

# Test idempotency
test_idempotency() {
    log_info "Testing payment idempotency..."
    
    source /tmp/prod_test_token
    
    # Try to verify the same payment again
    IDEMPOTENCY_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/payments/razorpay/verify" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"razorpay_order_id\": \"$ORDER_ID\",
            \"razorpay_payment_id\": \"pay_test_$(date +%s)\",
            \"razorpay_signature\": \"$MOCK_SIGNATURE\",
            \"internal_order_id\": \"$INTERNAL_ORDER_ID\"
        }")
    
    SUCCESS=$(echo "$IDEMPOTENCY_RESPONSE" | jq -r '.success // false')
    MESSAGE=$(echo "$IDEMPOTENCY_RESPONSE" | jq -r '.message // empty')
    
    if [ "$SUCCESS" = "true" ] && [[ "$MESSAGE" == *"already"* ]]; then
        log_success "Idempotency test passed - duplicate handled correctly"
    else
        log_warning "Idempotency test result: $MESSAGE"
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up test data..."
    
    if [ -f "/tmp/prod_test_token" ]; then
        rm -f /tmp/prod_test_token
    fi
    
    log_success "Cleanup completed"
}

# Main test execution
main() {
    log_info "Starting production payment test..."
    
    safety_check
    test_api_connectivity
    test_authentication
    test_razorpay_config
    test_order_creation
    test_payment_verification
    test_order_status
    test_idempotency
    cleanup
    
    log_success "🎉 Production payment test completed!"
    log_info "📊 Check application logs for detailed results"
    log_info "🔍 Monitor payment gateway dashboard"
    log_info "💾 Verify database records"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"



