# Sastabazar Canary Deployment Configuration

## Overview

This document describes the canary deployment strategy for the Sastabazar e-commerce platform, including traffic splitting, monitoring, and rollback procedures.

## Canary Deployment Strategy

### 1. Traffic Splitting

#### Phase 1: 5% Traffic (5 minutes)

- Deploy canary version to 5% of traffic
- Monitor key metrics closely
- Check for immediate failures

#### Phase 2: 25% Traffic (15 minutes)

- Increase traffic to 25% if Phase 1 successful
- Monitor performance metrics
- Check user experience metrics

#### Phase 3: 50% Traffic (20 minutes)

- Increase traffic to 50% if Phase 2 successful
- Monitor business metrics
- Check payment success rates

#### Phase 4: 100% Traffic (Full Deployment)

- Promote canary to full deployment
- Monitor for 30 minutes
- Complete deployment

### 2. Monitoring During Canary

#### Key Metrics to Monitor

- **Error Rate**: < 5%
- **Response Time**: < 2 seconds (95th percentile)
- **Payment Success Rate**: > 95%
- **Checkout Completion Rate**: > 90%
- **Database Performance**: Normal query times
- **Memory Usage**: < 80%
- **CPU Usage**: < 80%

#### Alert Thresholds

- **Critical**: Error rate > 10% or payment success < 90%
- **Warning**: Response time > 5 seconds or error rate > 5%
- **Info**: Any metric outside normal range

### 3. Rollback Triggers

#### Automatic Rollback

- Error rate > 10%
- Payment success rate < 90%
- Response time > 10 seconds
- Database connection failures
- Memory usage > 95%

#### Manual Rollback

- User complaints about functionality
- Business metrics degradation
- Security issues detected
- Performance degradation

## Implementation

### 1. Load Balancer Configuration

#### Nginx Configuration

```nginx
upstream sastabazar_stable {
    server 10.0.1.10:5000 weight=90;
    server 10.0.1.11:5000 weight=90;
}

upstream sastabazar_canary {
    server 10.0.1.20:5000 weight=10;
}

server {
    listen 80;
    server_name sastabazar.com;

    location / {
        # Route based on user ID hash for consistent experience
        if ($cookie_user_id) {
            set $backend sastabazar_canary;
        }

        # Route based on IP hash for testing
        if ($remote_addr ~* "^(10\.0\.1\.|192\.168\.)") {
            set $backend sastabazar_canary;
        }

        proxy_pass http://$backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### HAProxy Configuration

```
backend sastabazar_stable
    balance roundrobin
    server stable1 10.0.1.10:5000 check weight 90
    server stable2 10.0.1.11:5000 check weight 90

backend sastabazar_canary
    balance roundrobin
    server canary1 10.0.1.20:5000 check weight 10

frontend sastabazar_frontend
    bind *:80
    default_backend sastabazar_stable

    # Route 10% traffic to canary
    acl is_canary_user hdr_beg(cookie) -i user_id=
    use_backend sastabazar_canary if is_canary_user
```

### 2. Application-Level Canary

#### Feature Flags

```javascript
// Feature flag configuration
const featureFlags = {
  newCheckoutFlow: {
    enabled: true,
    percentage: 10, // 10% of users
    userGroups: ["beta_users", "internal_users"],
  },
  newPaymentGateway: {
    enabled: false,
    percentage: 0,
    userGroups: [],
  },
};

// Feature flag middleware
const featureFlagMiddleware = (req, res, next) => {
  const userId = req.user?.id;
  const userGroup = req.user?.group;

  // Check if user should see canary features
  const shouldShowCanary = checkFeatureFlag(userId, userGroup);
  req.canary = shouldShowCanary;

  next();
};
```

#### A/B Testing

```javascript
// A/B testing configuration
const abTests = {
  checkoutFlow: {
    variants: {
      control: { weight: 90, version: "v1.0" },
      treatment: { weight: 10, version: "v2.0" },
    },
    metrics: ["conversion_rate", "checkout_time", "abandonment_rate"],
  },
};
```

### 3. Database Canary

#### Read Replicas

- Use read replicas for canary database queries
- Ensure data consistency between stable and canary
- Monitor replication lag

#### Schema Changes

- Use backward-compatible schema changes
- Deploy schema changes before application changes
- Use feature flags to control new schema usage

## Monitoring and Alerting

### 1. Real-Time Monitoring

#### Dashboard Metrics

- **Traffic Split**: Current traffic distribution
- **Error Rates**: By version and endpoint
- **Response Times**: P50, P95, P99 percentiles
- **Business Metrics**: Orders, revenue, conversions
- **Infrastructure**: CPU, memory, disk usage

#### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: canary_deployment
    rules:
      - alert: CanaryHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Canary deployment has high error rate"

      - alert: CanarySlowResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Canary deployment has slow response times"
```

### 2. Business Metrics Monitoring

#### Key Performance Indicators

- **Conversion Rate**: Orders / Visitors
- **Average Order Value**: Revenue / Orders
- **Cart Abandonment Rate**: (Carts - Orders) / Carts
- **Payment Success Rate**: Successful Payments / Total Payments
- **Customer Satisfaction**: User feedback scores

#### Automated Rollback Triggers

```javascript
// Business metrics rollback logic
const checkBusinessMetrics = (canaryMetrics, stableMetrics) => {
  const conversionRateDiff =
    (canaryMetrics.conversionRate - stableMetrics.conversionRate) /
    stableMetrics.conversionRate;
  const paymentSuccessDiff =
    (canaryMetrics.paymentSuccess - stableMetrics.paymentSuccess) /
    stableMetrics.paymentSuccess;

  if (conversionRateDiff < -0.1 || paymentSuccessDiff < -0.05) {
    return { shouldRollback: true, reason: "Business metrics degradation" };
  }

  return { shouldRollback: false };
};
```

## Rollback Procedures

### 1. Automatic Rollback

#### Triggers

- Error rate > 10%
- Payment success rate < 90%
- Response time > 10 seconds
- Database connection failures
- Memory usage > 95%

#### Process

1. Stop canary deployment
2. Route all traffic to stable version
3. Notify team of automatic rollback
4. Investigate root cause
5. Fix issues before next deployment

### 2. Manual Rollback

#### Process

1. **Immediate Actions**
   - Stop canary deployment
   - Route traffic to stable version
   - Notify stakeholders

2. **Investigation**
   - Analyze logs and metrics
   - Identify root cause
   - Document findings

3. **Recovery**
   - Fix identified issues
   - Test fixes in staging
   - Plan next deployment

### 3. Rollback Script

```bash
#!/bin/bash
# Canary rollback script

echo "Rolling back canary deployment..."

# Stop canary deployment
pm2 stop canary

# Update load balancer configuration
# (Implementation depends on load balancer)

# Notify team
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  --data '{"text":"Canary deployment rolled back due to issues"}'

# Update monitoring
echo "Canary rollback completed at $(date)" >> /var/log/canary-rollbacks.log
```

## Best Practices

### 1. Pre-Deployment

- **Testing**: Comprehensive testing in staging environment
- **Monitoring**: Ensure monitoring is in place
- **Rollback Plan**: Have rollback plan ready
- **Team Communication**: Notify team of deployment

### 2. During Deployment

- **Gradual Rollout**: Start with small traffic percentage
- **Continuous Monitoring**: Monitor metrics continuously
- **Quick Response**: Be ready to rollback quickly
- **Documentation**: Document any issues or observations

### 3. Post-Deployment

- **Monitoring**: Continue monitoring for 24-48 hours
- **Analysis**: Analyze deployment success/failure
- **Documentation**: Update deployment procedures
- **Team Review**: Conduct post-deployment review

## Troubleshooting

### Common Issues

#### 1. High Error Rate

- **Cause**: Code bugs, configuration issues
- **Solution**: Immediate rollback, investigate logs

#### 2. Slow Response Times

- **Cause**: Performance regressions, resource constraints
- **Solution**: Check resource usage, optimize queries

#### 3. Payment Failures

- **Cause**: Payment gateway issues, configuration problems
- **Solution**: Immediate rollback, check payment logs

#### 4. Database Issues

- **Cause**: Schema changes, connection problems
- **Solution**: Check database health, rollback schema changes

### Debugging Commands

```bash
# Check canary deployment status
pm2 status canary

# View canary logs
pm2 logs canary

# Check traffic distribution
curl -s "$LOAD_BALANCER_URL/api/metrics" | jq '.traffic_split'

# Monitor error rates
curl -s "$CANARY_URL/api/metrics" | jq '.error_rate'

# Check payment success rate
curl -s "$CANARY_URL/api/metrics" | jq '.payment_success_rate'
```

## Conclusion

Canary deployment provides a safe way to deploy new versions of the Sastabazar e-commerce platform by gradually rolling out changes to a small percentage of users. This approach minimizes risk while allowing for real-world testing and quick rollback if issues are detected.

The key to successful canary deployment is:

1. **Comprehensive monitoring** of both technical and business metrics
2. **Quick rollback procedures** when issues are detected
3. **Gradual traffic increase** to allow for proper monitoring
4. **Team coordination** and clear communication
5. **Post-deployment analysis** to improve future deployments
