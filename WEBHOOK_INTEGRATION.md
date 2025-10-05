# Razorpay Webhook Integration Documentation

## Overview

This document describes the Razorpay webhook integration for the Sastabazar e-commerce platform, including event handling, signature validation, idempotency, and retry mechanisms.

## Webhook Endpoint

**URL:** `POST /api/payments/webhooks/razorpay`

**Headers Required:**

- `Content-Type: application/json`
- `X-Razorpay-Signature: <signature>`

## Supported Events

The webhook handler processes the following Razorpay events:

### 1. Payment Events

#### `payment.authorized`

- **Description:** Payment has been authorized but not captured
- **Action:** Log the event, update order status to 'authorized'
- **Idempotency:** Yes

#### `payment.captured`

- **Description:** Payment has been successfully captured
- **Action:**
  - Update order status to 'confirmed'
  - Set payment status to 'paid'
  - Clear user's cart
  - Update product stock
  - Send confirmation email
- **Idempotency:** Yes

#### `payment.failed`

- **Description:** Payment has failed
- **Action:**
  - Update order status to 'cancelled'
  - Set payment status to 'failed'
  - Log failure reason
- **Idempotency:** Yes

### 2. Order Events

#### `order.paid`

- **Description:** Order has been fully paid
- **Action:**
  - Update order status to 'confirmed'
  - Set payment status to 'paid'
  - Process fulfillment
- **Idempotency:** Yes

### 3. Refund Events

#### `refund.created`

- **Description:** Refund has been created
- **Action:**
  - Update order status to 'refunded'
  - Log refund details
  - Send refund notification
- **Idempotency:** Yes

#### `refund.processed`

- **Description:** Refund has been processed
- **Action:**
  - Update refund status
  - Complete refund process
- **Idempotency:** Yes

## Signature Validation

### Process

1. **Extract Signature:** Get `X-Razorpay-Signature` header
2. **Generate Expected Signature:**
   ```javascript
   const expectedSignature = crypto
     .createHmac("sha256", webhookSecret)
     .update(requestBody)
     .digest("hex");
   ```
3. **Compare Signatures:** Use constant-time comparison
4. **Reject if Invalid:** Return 400 status with error message

### Security Considerations

- **Webhook Secret:** Use the same secret configured in Razorpay dashboard
- **Constant-Time Comparison:** Prevent timing attacks
- **Request Body:** Use raw request body, not parsed JSON

## Idempotency

### Implementation

1. **Event ID Tracking:** Use Razorpay's `event_id` to track processed events
2. **Database Storage:** Store processed event IDs in database
3. **Duplicate Detection:** Check if event ID already exists before processing
4. **Safe Response:** Return success for duplicate events

### Idempotency Key Structure

```javascript
{
  eventId: 'evt_xyz123',
  eventType: 'payment.captured',
  processedAt: '2024-01-01T12:00:00.000Z',
  orderId: 'order_abc123'
}
```

## Retry Mechanism

### Razorpay Retry Policy

- **Retry Attempts:** 3 attempts
- **Retry Intervals:** 1 minute, 5 minutes, 15 minutes
- **Timeout:** 30 seconds per attempt
- **Success Criteria:** 2xx HTTP status code

### Our Response Strategy

1. **Process Quickly:** Complete processing within 5 seconds
2. **Return 2xx:** Always return success for valid webhooks
3. **Handle Errors Gracefully:** Log errors but don't fail the webhook
4. **Async Processing:** Use background jobs for heavy operations

## Error Handling

### Response Codes

- **200 OK:** Webhook processed successfully
- **400 Bad Request:** Invalid signature or malformed payload
- **500 Internal Server Error:** Server error (will trigger retry)

### Error Logging

```javascript
{
  eventId: 'evt_xyz123',
  eventType: 'payment.captured',
  error: 'Order not found',
  timestamp: '2024-01-01T12:00:00.000Z',
  correlationId: 'corr_abc123'
}
```

## Testing

### Test Events

Use Razorpay's test mode to send sample events:

```bash
# Test payment captured event
curl -X POST https://your-domain.com/api/payments/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: <test_signature>" \
  -d '{
    "event": "payment.captured",
    "created_at": 1640995200,
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "amount": 10000,
          "currency": "INR",
          "status": "captured",
          "order_id": "order_test123"
        }
      }
    }
  }'
```

### Webhook Testing Tools

1. **Razorpay Dashboard:** Use test mode webhooks
2. **ngrok:** For local testing
3. **Webhook.site:** For testing webhook delivery
4. **Custom Test Suite:** Run `node tests/webhook-tests.js`

## Monitoring and Alerting

### Metrics to Monitor

1. **Webhook Delivery Rate:** Percentage of successful deliveries
2. **Processing Time:** Average time to process webhooks
3. **Error Rate:** Percentage of failed webhook processing
4. **Event Processing Rate:** Events processed per minute

### Alerts

- **High Error Rate:** >5% webhook processing failures
- **Slow Processing:** >10 seconds average processing time
- **Missing Events:** No webhooks received for >1 hour
- **Signature Failures:** Invalid signature attempts

## Security Best Practices

### 1. Webhook Secret Management

- **Environment Variables:** Store webhook secret in environment variables
- **Rotation:** Rotate webhook secrets regularly
- **Access Control:** Limit access to webhook secret

### 2. Request Validation

- **Signature Verification:** Always verify webhook signatures
- **Payload Validation:** Validate webhook payload structure
- **Rate Limiting:** Implement rate limiting for webhook endpoints

### 3. Data Protection

- **PII Handling:** Don't log sensitive payment data
- **Data Retention:** Implement data retention policies
- **Encryption:** Encrypt sensitive data at rest

## Troubleshooting

### Common Issues

#### 1. Signature Verification Fails

**Symptoms:**

- 400 Bad Request responses
- "Invalid signature" errors

**Solutions:**

- Check webhook secret configuration
- Verify signature generation algorithm
- Ensure raw request body is used

#### 2. Webhook Not Received

**Symptoms:**

- No webhook events in logs
- Orders stuck in pending state

**Solutions:**

- Check webhook URL configuration in Razorpay dashboard
- Verify webhook endpoint is accessible
- Check firewall and network configuration

#### 3. Duplicate Event Processing

**Symptoms:**

- Orders processed multiple times
- Stock updated incorrectly

**Solutions:**

- Implement proper idempotency checking
- Use event ID for duplicate detection
- Add database constraints

#### 4. Slow Processing

**Symptoms:**

- Webhook timeouts
- Razorpay retries

**Solutions:**

- Optimize database queries
- Use background job processing
- Implement caching

### Debug Commands

```bash
# Check webhook endpoint
curl -X POST https://your-domain.com/api/payments/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test" \
  -d '{"test": "webhook"}'

# Check webhook logs
tail -f logs/combined.log | grep "webhook"

# Test signature generation
node -e "
const crypto = require('crypto');
const payload = '{\"test\": \"webhook\"}';
const secret = 'your_webhook_secret';
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
console.log('Signature:', signature);
"
```

## Production Checklist

### Before Going Live

- [ ] Webhook URL configured in Razorpay dashboard
- [ ] Webhook secret set in environment variables
- [ ] All supported events subscribed
- [ ] Idempotency implemented and tested
- [ ] Error handling and logging configured
- [ ] Monitoring and alerting set up
- [ ] Load testing completed
- [ ] Security review completed

### Post-Deployment

- [ ] Monitor webhook delivery rates
- [ ] Check error logs regularly
- [ ] Verify order processing accuracy
- [ ] Test webhook retry mechanism
- [ ] Monitor processing performance
- [ ] Review security logs

## API Reference

### Webhook Endpoint

```http
POST /api/payments/webhooks/razorpay
Content-Type: application/json
X-Razorpay-Signature: <signature>

{
  "event": "payment.captured",
  "created_at": 1640995200,
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xyz123",
        "amount": 10000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_abc123",
        "notes": {
          "order_id": "internal_order_123"
        }
      }
    }
  }
}
```

### Response Format

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "received": true
}
```

## Conclusion

This webhook integration provides a robust, secure, and scalable solution for processing Razorpay payment events. The implementation includes proper signature validation, idempotency handling, error management, and comprehensive monitoring.

For questions or issues, refer to the troubleshooting section or contact the development team.
