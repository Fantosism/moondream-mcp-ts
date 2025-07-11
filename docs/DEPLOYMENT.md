# Deployment Guide - Moondream MCP TypeScript Server

This comprehensive guide covers all deployment options for the Moondream MCP TypeScript server, from local development to production cloud deployments.

## Table of Contents

1. [Deployment Options Overview](#deployment-options-overview)
2. [Local Development Deployment](#local-development-deployment)
3. [Docker Deployment](#docker-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Azure Deployment](#azure-deployment)
6. [Google Cloud Deployment](#google-cloud-deployment)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [MCP Server Integration](#mcp-server-integration)
9. [Production Considerations](#production-considerations)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Deployment Options Overview

### Recommended Deployment Strategies

| Use Case | Recommended Option | Pros | Cons |
|----------|-------------------|------|------|
| **Development** | Local/Docker | Fast iteration, easy debugging | Not scalable |
| **Small Scale** | Docker + Cloud VM | Simple, cost-effective | Limited scalability |
| **Medium Scale** | AWS ECS/Lambda | Managed infrastructure | AWS-specific |
| **Large Scale** | Kubernetes | Highly scalable, cloud-agnostic | Complex setup |
| **Enterprise** | Kubernetes + Service Mesh | Enterprise-grade, observability | Highest complexity |

### Architecture Considerations

The Moondream MCP server supports three execution modes:

1. **Local Mode**: Runs Moondream locally (requires GPU/high CPU)
2. **Cloud Mode**: Uses Moondream API (recommended for production)
3. **Hybrid Mode**: Intelligent fallback between local and cloud

## Local Development Deployment

### Prerequisites

```bash
# Required software
node >= 18.0.0
npm >= 9.0.0
git
```

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/moondream-mcp-ts.git
cd moondream-mcp-ts

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Build and run
npm run build
npm start

# Or run in development mode
npm run dev src/main.ts
```

### Development Scripts

```bash
# Development commands
npm run dev          # Run with hot reload
npm run build        # Build for production
npm run typecheck    # Type checking
npm run lint         # Code linting
npm run format       # Code formatting

# Testing
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Docker Deployment

### Single Container Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S moondream -u 1001

# Change ownership
RUN chown -R moondream:nodejs /app
USER moondream

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  moondream-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MOONDREAM_MODEL_MODE=cloud
      - MOONDREAM_API_KEY=${MOONDREAM_API_KEY}
      - MOONDREAM_API_ENDPOINT=https://api.moondream.ai/v1
    volumes:
      - ./logs:/app/logs
      - ./cache:/app/cache
    restart: unless-stopped
    
  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - moondream-mcp
    restart: unless-stopped

volumes:
  redis_data:
```

#### Build and Run

```bash
# Build image
docker build -t moondream-mcp .

# Run container
docker run -d \
  --name moondream-mcp \
  -p 3000:3000 \
  -e MOONDREAM_API_KEY=your_api_key \
  -v $(pwd)/logs:/app/logs \
  moondream-mcp

# Using Docker Compose
docker-compose up -d
```

## AWS Deployment

### Option 1: AWS ECS (Recommended)

#### Task Definition (ECS)

```json
{
  "family": "moondream-mcp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "moondream-mcp",
      "image": "your-account.dkr.ecr.region.amazonaws.com/moondream-mcp:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MOONDREAM_MODEL_MODE",
          "value": "cloud"
        }
      ],
      "secrets": [
        {
          "name": "MOONDREAM_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:moondream-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/moondream-mcp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Moondream MCP Server on ECS'

Parameters:
  ImageUri:
    Type: String
    Description: ECR image URI
  
  MoondreamApiKey:
    Type: String
    Description: Moondream API Key
    NoEcho: true

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true

  # ECS Cluster
  Cluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: moondream-mcp-cluster

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup

  # ECS Service
  Service:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref Cluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups:
            - !Ref ServiceSecurityGroup
          Subnets:
            - !Ref PublicSubnet1
            - !Ref PublicSubnet2
          AssignPublicIp: ENABLED
      LoadBalancers:
        - ContainerName: moondream-mcp
          ContainerPort: 3000
          TargetGroupArn: !Ref TargetGroup

  # Auto Scaling
  ScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: ecs
      ResourceId: !Sub service/${Cluster}/${Service.Name}
      ScalableDimension: ecs:service:DesiredCount
      MinCapacity: 1
      MaxCapacity: 10
      RoleARN: !Sub arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService

  ScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: moondream-mcp-scaling-policy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
```

#### Deploy to ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account.dkr.ecr.us-east-1.amazonaws.com

docker build -t moondream-mcp .
docker tag moondream-mcp:latest account.dkr.ecr.us-east-1.amazonaws.com/moondream-mcp:latest
docker push account.dkr.ecr.us-east-1.amazonaws.com/moondream-mcp:latest

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name moondream-mcp-stack \
  --parameter-overrides \
    ImageUri=account.dkr.ecr.us-east-1.amazonaws.com/moondream-mcp:latest \
    MoondreamApiKey=your_api_key \
  --capabilities CAPABILITY_IAM
```

### Option 2: AWS Lambda (Serverless)

#### Lambda Function

```typescript
// lambda-handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { MoondreamClient } from './src/utils/moondreamClient';
import { createConfigFromEnv } from './src/utils/configManager';

let client: MoondreamClient;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Initialize client once per container
    if (!client) {
      const config = createConfigFromEnv();
      client = new MoondreamClient(config);
      await client.initialize();
    }

    const { operation, imagePath, question } = JSON.parse(event.body || '{}');

    let result;
    switch (operation) {
      case 'caption':
        result = await client.captionImage(imagePath);
        break;
      case 'query':
        result = await client.queryImage(imagePath, question);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

#### SAM Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  MoondreamApiKey:
    Type: String
    Description: Moondream API Key
    NoEcho: true

Resources:
  MoondreamFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: lambda-handler.handler
      Runtime: nodejs18.x
      MemorySize: 1024
      Timeout: 30
      Environment:
        Variables:
          NODE_ENV: production
          MOONDREAM_MODEL_MODE: cloud
          MOONDREAM_API_KEY: !Ref MoondreamApiKey
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
            RestApiId: !Ref ApiGateway

  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'*'"
        AllowHeaders: "'*'"
        AllowOrigin: "'*'"
      ThrottleConfig:
        BurstLimit: 100
        RateLimit: 50

Outputs:
  ApiUrl:
    Description: API Gateway URL
    Value: !Sub "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/"
```

## Azure Deployment

### Azure Container Instances

```bash
# Create resource group
az group create --name moondream-mcp-rg --location eastus

# Create container instance
az container create \
  --resource-group moondream-mcp-rg \
  --name moondream-mcp \
  --image your-registry/moondream-mcp:latest \
  --cpu 1 \
  --memory 2 \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    MOONDREAM_MODEL_MODE=cloud \
  --secure-environment-variables \
    MOONDREAM_API_KEY=your_api_key \
  --dns-name-label moondream-mcp-unique \
  --restart-policy Always
```

### Azure App Service

```bash
# Create App Service plan
az appservice plan create \
  --name moondream-mcp-plan \
  --resource-group moondream-mcp-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group moondream-mcp-rg \
  --plan moondream-mcp-plan \
  --name moondream-mcp-app \
  --deployment-container-image-name your-registry/moondream-mcp:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group moondream-mcp-rg \
  --name moondream-mcp-app \
  --settings \
    NODE_ENV=production \
    MOONDREAM_MODEL_MODE=cloud \
    MOONDREAM_API_KEY=your_api_key
```

## Google Cloud Deployment

### Cloud Run

```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: moondream-mcp
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 10
      containers:
      - image: gcr.io/project-id/moondream-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: MOONDREAM_MODEL_MODE
          value: cloud
        - name: MOONDREAM_API_KEY
          valueFrom:
            secretKeyRef:
              name: moondream-api-key
              key: api-key
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
          requests:
            cpu: 500m
            memory: 1Gi
```

```bash
# Deploy to Cloud Run
gcloud run services replace cloudrun.yaml --region us-central1
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: moondream-mcp
  labels:
    app: moondream-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: moondream-mcp
  template:
    metadata:
      labels:
        app: moondream-mcp
    spec:
      containers:
      - name: moondream-mcp
        image: your-registry/moondream-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: MOONDREAM_MODEL_MODE
          value: cloud
        - name: MOONDREAM_API_KEY
          valueFrom:
            secretKeyRef:
              name: moondream-api-key
              key: api-key
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: moondream-mcp-service
spec:
  selector:
    app: moondream-mcp
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: moondream-mcp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: moondream-mcp.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: moondream-mcp-service
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: moondream-mcp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: moondream-mcp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## MCP Server Integration

### MCP Server Configuration

The Moondream MCP server can be integrated with various MCP clients:

#### Claude Desktop Integration

```json
{
  "mcpServers": {
    "moondream": {
      "command": "node",
      "args": ["/path/to/moondream-mcp-ts/dist/main.js"],
      "env": {
        "MOONDREAM_MODEL_MODE": "cloud",
        "MOONDREAM_API_KEY": "your_api_key"
      }
    }
  }
}
```

#### Standalone MCP Server

```bash
# Run as MCP server
npm run mcp

# Or with specific configuration
MOONDREAM_MODEL_MODE=cloud MOONDREAM_API_KEY=your_key npm run mcp
```

### MCP Client Integration

```typescript
// Example MCP client integration
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client(
  {
    name: 'moondream-client',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Connect to MCP server
await client.connect(transport);

// Use tools
const result = await client.request(
  {
    method: 'tools/call',
    params: {
      name: 'caption_image',
      arguments: {
        image_path: '/path/to/image.jpg',
        length: 'normal'
      }
    }
  },
  { timeout: 30000 }
);
```

## Production Considerations

### Performance Optimization

1. **Caching Strategy**
   ```typescript
   // Enable Redis caching
   MOONDREAM_ENABLE_CACHING=true
   MOONDREAM_CACHE_TYPE=redis
   MOONDREAM_CACHE_TTL_SECONDS=3600
   ```

2. **Connection Pooling**
   ```typescript
   // Configure connection limits
   MOONDREAM_MAX_CONCURRENT_REQUESTS=10
   MOONDREAM_REQUEST_TIMEOUT_SECONDS=30
   ```

3. **Resource Limits**
   ```typescript
   // Set appropriate limits
   MOONDREAM_MAX_FILE_SIZE_MB=50
   MOONDREAM_MAX_IMAGE_SIZE=2048
   MOONDREAM_MEMORY_LIMIT_MB=4096
   ```

### Security Configuration

1. **Network Security**
   ```typescript
   // Production security settings
   MOONDREAM_ENABLE_SSL_VERIFICATION=true
   MOONDREAM_ENABLE_RATE_LIMITING=true
   MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE=60
   ```

2. **Input Validation**
   ```typescript
   // Enable all validation
   MOONDREAM_ENABLE_REQUEST_VALIDATION=true
   MOONDREAM_ENABLE_SANITIZATION=true
   MOONDREAM_MAX_REQUEST_SIZE_MB=100
   ```

### High Availability

1. **Load Balancing**
   - Use ALB/NLB for AWS
   - Configure health checks
   - Implement circuit breakers

2. **Auto Scaling**
   - Set up horizontal pod autoscaling
   - Configure CPU/memory thresholds
   - Implement graceful shutdown

3. **Monitoring**
   - Set up CloudWatch/Datadog monitoring
   - Configure alerts and notifications
   - Implement distributed tracing

## Monitoring and Maintenance

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});
```

### Logging Configuration

```typescript
// Production logging
MOONDREAM_LOG_LEVEL=info
MOONDREAM_LOG_FORMAT=json
MOONDREAM_ENABLE_PERFORMANCE_LOGGING=true
MOONDREAM_ENABLE_ACCESS_LOGGING=true
```

### Metrics Collection

```typescript
// Prometheus metrics
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const moondreamRequests = new prometheus.Counter({
  name: 'moondream_requests_total',
  help: 'Total number of Moondream API requests',
  labelNames: ['operation', 'status']
});
```

### Backup and Recovery

1. **Configuration Backup**
   - Store configuration in version control
   - Use encrypted secrets management
   - Implement configuration validation

2. **Data Backup**
   - Regular cache backups (if using persistent cache)
   - Log aggregation and retention
   - Application state backup

### Troubleshooting Guide

#### Common Issues

1. **Out of Memory**
   ```bash
   # Check memory usage
   kubectl top pods
   
   # Increase memory limits
   resources:
     limits:
       memory: 4Gi
   ```

2. **API Rate Limits**
   ```bash
   # Check rate limit configuration
   MOONDREAM_RATE_LIMIT_REQUESTS_PER_MINUTE=120
   
   # Implement request queuing
   MOONDREAM_MAX_CONCURRENT_REQUESTS=5
   ```

3. **Connection Timeouts**
   ```bash
   # Increase timeout values
   MOONDREAM_REQUEST_TIMEOUT_SECONDS=60
   MOONDREAM_CONNECT_TIMEOUT_SECONDS=30
   ```

#### Debugging

```bash
# Enable debug logging
MOONDREAM_LOG_LEVEL=debug
MOONDREAM_ENABLE_DEBUG_LOGGING=true

# Check application logs
docker logs moondream-mcp
kubectl logs -f deployment/moondream-mcp

# Monitor performance
docker stats moondream-mcp
kubectl top pods
```

## Cost Optimization

### Resource Optimization

1. **Right-sizing**
   - Monitor CPU/memory usage
   - Adjust container resources
   - Use spot instances where appropriate

2. **Caching Strategy**
   - Implement intelligent caching
   - Use CDN for static assets
   - Cache frequent requests

3. **Auto-scaling**
   - Scale down during low usage
   - Use predictive scaling
   - Implement efficient scaling policies

### Cost Monitoring

```bash
# AWS cost monitoring
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Conclusion

This deployment guide provides comprehensive options for deploying the Moondream MCP TypeScript server across various platforms and environments. Choose the deployment option that best fits your requirements:

- **Development**: Local or Docker
- **Small Scale**: Docker + Cloud VM
- **Medium Scale**: AWS ECS or Azure Container Instances
- **Large Scale**: Kubernetes with auto-scaling
- **Serverless**: AWS Lambda or Google Cloud Functions

For production deployments, ensure proper security, monitoring, and backup strategies are implemented. Regular maintenance and updates are essential for optimal performance and security.