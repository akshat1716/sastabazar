#!/bin/bash

# Sastabazar Live Razorpay Payment Testing Script
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
TEST_EMAIL="livetest@example.com"
TEST_PASSWORD="livetest123"
TEST_PRODUCT_NAME="Live Test Product - ₹1"

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
    log_warning "🚨 LIVE RAZORPAY PAYMENT TEST"
    log_warning "⚠️  This will process REAL payments!"
    log_warning "💰 Test amount: ₹1.00"
    log_warning "🌐 Production URL: $PRODUCTION_URL"
    log_warning "🔑 Using LIVE Razorpay keys"
    echo ""
    
    # Check if we're in production mode
    if [ "$NODE_ENV" != "production" ]; then
        log_error "NODE_ENV is not set to 'production'"
        log_error "Please set NODE_ENV=production before running this script"
        exit 1
    fi
    
    # Check for live Razorpay keys
    if [[ "$RAZORPAY_KEY_ID" != rzp_live_* ]]; then
        log_error "RAZORPAY_KEY_ID does not appear to be a live key (should start with rzp_live_)"
        exit 1
    fi
    
    if [[ "$RAZORPAY_KEY_SECRET" == *"test"* ]] || [[ "$RAZORPAY_KEY_SECRET" == *"your_"* ]]; then
        log_error "RAZORPAY_KEY_SECRET appears to be a test or default value"
        exit 1
    fi
    
    # Verify production URL is not localhost
    if [[ "$PRODUCTION_URL" == *"localhost"* ]] || [[ "$PRODUCTION_URL" == *"127.0.0.1"* ]]; then
        log_error "Production URL appears to be localhost"
        exit 1
    fi
    
    log_warning "Press Ctrl+C to cancel, or Enter to continue with LIVE payment test"
    read -r
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

# Create test user
create_test_user() {
    log_info "Creating test user..."
    
    # Try to register user
    REGISTER_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Live\",\"lastName\":\"Test\"}")
    
    # Check if registration was successful or user already exists
    if echo "$REGISTER_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
        log_success "Test user registered successfully"
    elif echo "$REGISTER_RESPONSE" | jq -e '.error' > /dev/null 2>&1 && [[ "$REGISTER_RESPONSE" == *"already exists"* ]]; then
        log_info "Test user already exists"
    else
        log_error "Failed to create test user"
        log_error "Response: $REGISTER_RESPONSE"
        exit 1
    fi
}

# Login and get token
login_user() {
    log_info "Logging in test user..."
    
    LOGIN_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        log_error "Login failed"
        log_error "Response: $LOGIN_RESPONSE"
        exit 1
    fi
    
    log_success "Login successful"
    echo "TOKEN=$TOKEN" > /tmp/live_test_token
}

# Create test product
create_test_product() {
    log_info "Creating test product..."
    
    source /tmp/live_test_token
    
    PRODUCT_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/products" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$TEST_PRODUCT_NAME\",
            \"price\": $TEST_AMOUNT,
            \"description\": \"Product for live payment testing\",
            \"category\": \"test\",
            \"stock\": 100,
            \"images\": []
        }")
    
    PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.product._id // empty')
    
    if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
        log_error "Failed to create test product"
        log_error "Response: $PRODUCT_RESPONSE"
        exit 1
    fi
    
    log_success "Test product created"
    log_info "Product ID: $PRODUCT_ID"
    echo "PRODUCT_ID=$PRODUCT_ID" >> /tmp/live_test_token
}

# Add product to cart
add_to_cart() {
    log_info "Adding product to cart..."
    
    source /tmp/live_test_token
    
    CART_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/cart/add" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}")
    
    if echo "$CART_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        log_success "Product added to cart"
    else
        log_error "Failed to add product to cart"
        log_error "Response: $CART_RESPONSE"
        exit 1
    fi
}

# Create Razorpay order
create_razorpay_order() {
    log_info "Creating Razorpay order..."
    
    source /tmp/live_test_token
    
    ORDER_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/payments/razorpay/order" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "shippingAddress": {
                "street": "123 Live Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "zipCode": "400001",
                "country": "India"
            },
            "shippingMethod": "standard"
        }')
    
    RAZORPAY_ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.order.id // empty')
    INTERNAL_ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.internalOrderId // empty')
    ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.orderNumber // empty')
    
    if [ -z "$RAZORPAY_ORDER_ID" ] || [ "$RAZORPAY_ORDER_ID" = "null" ]; then
        log_error "Failed to create Razorpay order"
        log_error "Response: $ORDER_RESPONSE"
        exit 1
    fi
    
    log_success "Razorpay order created"
    log_info "Razorpay Order ID: $RAZORPAY_ORDER_ID"
    log_info "Internal Order ID: $INTERNAL_ORDER_ID"
    log_info "Order Number: $ORDER_NUMBER"
    
    echo "RAZORPAY_ORDER_ID=$RAZORPAY_ORDER_ID" >> /tmp/live_test_token
    echo "INTERNAL_ORDER_ID=$INTERNAL_ORDER_ID" >> /tmp/live_test_token
    echo "ORDER_NUMBER=$ORDER_NUMBER" >> /tmp/live_test_token
}

# Process live payment
process_live_payment() {
    log_info "Processing live payment..."
    
    source /tmp/live_test_token
    
    log_warning "🚨 LIVE PAYMENT PROCESSING"
    log_warning "You will now be redirected to Razorpay Checkout"
    log_warning "Use a REAL credit/debit card to complete the payment"
    log_warning "Amount: ₹1.00"
    echo ""
    
    # Get Razorpay configuration
    CONFIG_RESPONSE=$(curl -s -X GET "$PRODUCTION_URL/api/payments/razorpay/config" \
        -H "Authorization: Bearer $TOKEN")
    
    RAZORPAY_KEY_ID=$(echo "$CONFIG_RESPONSE" | jq -r '.keyId // empty')
    
    if [ -z "$RAZORPAY_KEY_ID" ]; then
        log_error "Failed to get Razorpay configuration"
        exit 1
    fi
    
    log_info "Opening Razorpay Checkout..."
    log_info "Razorpay Key ID: $RAZORPAY_KEY_ID"
    log_info "Order ID: $RAZORPAY_ORDER_ID"
    log_info "Amount: ₹1.00"
    
    # Create HTML file for payment
    cat > /tmp/razorpay_checkout.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Live Payment Test</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
    <h1>Live Payment Test - ₹1.00</h1>
    <button onclick="openCheckout()">Pay ₹1.00</button>
    
    <script>
        function openCheckout() {
            const options = {
                key: '$RAZORPAY_KEY_ID',
                amount: $TEST_AMOUNT,
                currency: 'INR',
                name: 'Sastabazar',
                description: 'Live Payment Test',
                order_id: '$RAZORPAY_ORDER_ID',
                handler: function (response) {
                    console.log('Payment successful:', response);
                    alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
                    
                    // Verify payment on server
                    verifyPayment(response);
                },
                prefill: {
                    name: 'Live Test User',
                    email: '$TEST_EMAIL',
                    contact: '9999999999'
                },
                notes: {
                    test: 'live_payment_test'
                },
                theme: {
                    color: '#000000'
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.open();
        }
        
        function verifyPayment(response) {
            fetch('$PRODUCTION_URL/api/payments/razorpay/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer $TOKEN'
                },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    internal_order_id: '$INTERNAL_ORDER_ID'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Payment verified successfully!');
                    console.log('Verification response:', data);
                } else {
                    alert('Payment verification failed: ' + data.error);
                    console.error('Verification error:', data);
                }
            })
            .catch(error => {
                console.error('Verification error:', error);
                alert('Payment verification failed: ' + error.message);
            });
        }
    </script>
</body>
</html>
EOF
    
    # Open the payment page
    if command -v open &> /dev/null; then
        open /tmp/razorpay_checkout.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open /tmp/razorpay_checkout.html
    else
        log_info "Please open /tmp/razorpay_checkout.html in your browser to complete the payment"
    fi
    
    log_warning "Complete the payment in the browser window that opened"
    log_warning "Press Enter after completing the payment to continue verification"
    read -r
}

# Verify payment
verify_payment() {
    log_info "Verifying payment..."
    
    source /tmp/live_test_token
    
    # Get payment details from user
    echo "Enter the payment ID from Razorpay:"
    read -r PAYMENT_ID
    
    echo "Enter the signature from Razorpay:"
    read -r SIGNATURE
    
    # Verify payment
    VERIFY_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/payments/razorpay/verify" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"razorpay_order_id\": \"$RAZORPAY_ORDER_ID\",
            \"razorpay_payment_id\": \"$PAYMENT_ID\",
            \"razorpay_signature\": \"$SIGNATURE\",
            \"internal_order_id\": \"$INTERNAL_ORDER_ID\"
        }")
    
    SUCCESS=$(echo "$VERIFY_RESPONSE" | jq -r '.success // false')
    
    if [ "$SUCCESS" = "true" ]; then
        log_success "Payment verified successfully!"
        log_info "Verification response: $VERIFY_RESPONSE"
    else
        log_error "Payment verification failed"
        log_error "Response: $VERIFY_RESPONSE"
        exit 1
    fi
}

# Verify order state
verify_order_state() {
    log_info "Verifying order state..."
    
    source /tmp/live_test_token
    
    ORDER_RESPONSE=$(curl -s -X GET "$PRODUCTION_URL/api/orders/$INTERNAL_ORDER_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    ORDER_STATUS=$(echo "$ORDER_RESPONSE" | jq -r '.order.status // empty')
    PAYMENT_STATUS=$(echo "$ORDER_RESPONSE" | jq -r '.order.paymentStatus // empty')
    PAID_AT=$(echo "$ORDER_RESPONSE" | jq -r '.order.paidAt // empty')
    
    log_info "Order Status: $ORDER_STATUS"
    log_info "Payment Status: $PAYMENT_STATUS"
    log_info "Paid At: $PAID_AT"
    
    if [ "$ORDER_STATUS" = "confirmed" ] && [ "$PAYMENT_STATUS" = "paid" ]; then
        log_success "Order state verification passed"
    else
        log_error "Order state verification failed"
        log_error "Expected: status=confirmed, paymentStatus=paid"
        log_error "Actual: status=$ORDER_STATUS, paymentStatus=$PAYMENT_STATUS"
        exit 1
    fi
}

# Test refund
test_refund() {
    log_info "Testing refund process..."
    
    source /tmp/live_test_token
    
    log_warning "Testing refund for payment ID: $PAYMENT_ID"
    log_warning "This will process a REAL refund"
    echo "Do you want to proceed with the refund? (y/N)"
    read -r REFUND_CONFIRM
    
    if [ "$REFUND_CONFIRM" != "y" ] && [ "$REFUND_CONFIRM" != "Y" ]; then
        log_info "Skipping refund test"
        return
    fi
    
    REFUND_RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/api/payments/razorpay/refund" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"paymentId\": \"$PAYMENT_ID\",
            \"amount\": $TEST_AMOUNT,
            \"reason\": \"Live payment test refund\"
        }")
    
    REFUND_SUCCESS=$(echo "$REFUND_RESPONSE" | jq -r '.success // false')
    
    if [ "$REFUND_SUCCESS" = "true" ]; then
        log_success "Refund processed successfully"
        log_info "Refund response: $REFUND_RESPONSE"
    else
        log_warning "Refund may not be implemented or failed"
        log_info "Refund response: $REFUND_RESPONSE"
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up test data..."
    
    if [ -f "/tmp/live_test_token" ]; then
        rm -f /tmp/live_test_token
    fi
    
    if [ -f "/tmp/razorpay_checkout.html" ]; then
        rm -f /tmp/razorpay_checkout.html
    fi
    
    log_success "Cleanup completed"
}

# Main test execution
main() {
    log_info "Starting live Razorpay payment test..."
    
    safety_check
    test_api_connectivity
    create_test_user
    login_user
    create_test_product
    add_to_cart
    create_razorpay_order
    process_live_payment
    verify_payment
    verify_order_state
    test_refund
    cleanup
    
    log_success "🎉 Live payment test completed successfully!"
    log_info "📊 Check Razorpay dashboard for transaction details"
    log_info "💾 Verify database records"
    log_info "📝 Check application logs"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"



