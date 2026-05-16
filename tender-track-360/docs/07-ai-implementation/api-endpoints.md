# AI API Endpoints

## Overview

This document defines the API endpoints for AI features in Tender Track 360, including document processing, compliance checking, and readiness assessment.

## Base Configuration

**Base URL**: `/api/ai`  
**Authentication**: Required (Better Auth session)  
**Rate Limiting**: 100 requests per minute per organization  
**Content-Type**: `application/json` (except file uploads)

## Document Processing Endpoints

### 1. Upload & Extract Tender Document

**Endpoint**: `POST /api/ai/tenders/extract`  
**Purpose**: Upload a tender document and extract structured information

```typescript
// Request
interface ExtractTenderRequest {
  file: File; // PDF, DOCX, or image
  metadata?: {
    expectedTenderNumber?: string;
    issuingAuthority?: string;
  };
}

// Response
interface ExtractTenderResponse {
  success: boolean;
  data?: {
    tenderId: string;
    extraction: TenderExtraction;
    confidence: number;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Example Usage**:

```typescript
const formData = new FormData();
formData.append('file', tenderFile);
formData.append(
  'metadata',
  JSON.stringify({
    expectedTenderNumber: 'A-EWM-02-2025',
  })
);

const response = await fetch('/api/ai/tenders/extract', {
  method: 'POST',
  body: formData,
});

const result: ExtractTenderResponse = await response.json();
```

### 2. Classify Company Document

**Endpoint**: `POST /api/ai/documents/classify`  
**Purpose**: Upload and automatically classify a company document

```typescript
// Request
interface ClassifyDocumentRequest {
  file: File;
  metadata?: {
    expectedCategory?: DocumentCategory;
    description?: string;
  };
}

// Response
interface ClassifyDocumentResponse {
  success: boolean;
  data?: {
    documentId: string;
    classification: {
      category: DocumentCategory;
      subcategory?: string;
      confidence: number;
    };
    extractedMetadata: {
      issueDate?: string;
      expiryDate?: string;
      documentNumber?: string;
      issuingAuthority?: string;
      [key: string]: any;
    };
  };
  error?: APIError;
}
```

### 3. Reprocess Document

**Endpoint**: `POST /api/ai/documents/{documentId}/reprocess`  
**Purpose**: Reprocess a document with updated AI models

```typescript
// Request
interface ReprocessDocumentRequest {
  forceReprocess?: boolean;
  useLatestModel?: boolean;
}

// Response
interface ReprocessDocumentResponse {
  success: boolean;
  data?: {
    documentId: string;
    previousClassification: DocumentClassification;
    newClassification: DocumentClassification;
    improvementScore: number;
  };
  error?: APIError;
}
```

## Compliance Assessment Endpoints

### 4. Generate Readiness Report

**Endpoint**: `POST /api/ai/compliance/assess`  
**Purpose**: Generate a comprehensive readiness report for a tender

```typescript
// Request
interface AssessReadinessRequest {
  tenderId: string;
  options?: {
    includeRecommendations?: boolean;
    includeTimeline?: boolean;
    detailLevel?: 'summary' | 'detailed' | 'comprehensive';
  };
}

// Response
interface AssessReadinessResponse {
  success: boolean;
  data?: {
    assessmentId: string;
    readinessReport: ReadinessReport;
    generatedAt: string;
    validUntil: string; // When assessment becomes stale
  };
  error?: APIError;
}
```

### 5. Check Specific Requirement

**Endpoint**: `POST /api/ai/compliance/check-requirement`  
**Purpose**: Check if a specific requirement is met

```typescript
// Request
interface CheckRequirementRequest {
  requirementId: string;
  organizationId?: string; // Optional, defaults to current user's org
}

// Response
interface CheckRequirementResponse {
  success: boolean;
  data?: {
    requirement: TenderRequirement;
    status: 'MET' | 'MISSING' | 'EXPIRED' | 'INSUFFICIENT';
    matchingDocuments: CompanyDocument[];
    gap?: {
      description: string;
      recommendedActions: string[];
      estimatedDays: number;
    };
  };
  error?: APIError;
}
```

### 6. Bulk Compliance Check

**Endpoint**: `POST /api/ai/compliance/bulk-check`  
**Purpose**: Check multiple requirements at once

```typescript
// Request
interface BulkComplianceRequest {
  requirementIds: string[];
  organizationId?: string;
}

// Response
interface BulkComplianceResponse {
  success: boolean;
  data?: {
    results: RequirementCheckResult[];
    summary: {
      total: number;
      met: number;
      missing: number;
      expired: number;
    };
  };
  error?: APIError;
}
```

## Real-time Updates

### 7. WebSocket Connection

**Endpoint**: `WS /api/ai/realtime`  
**Purpose**: Real-time updates for AI processing status

```typescript
// Connection
const ws = new WebSocket('/api/ai/realtime');

// Message Types
interface AIRealtimeMessage {
  type:
    | 'processing_started'
    | 'processing_progress'
    | 'processing_completed'
    | 'error';
  data: {
    operationId: string;
    progress?: number; // 0-100
    status?: string;
    result?: any;
    error?: string;
  };
}

// Subscribe to specific operations
ws.send(
  JSON.stringify({
    action: 'subscribe',
    operationIds: ['tender-extract-123', 'compliance-check-456'],
  })
);
```

## Monitoring & Analytics

### 8. AI Usage Statistics

**Endpoint**: `GET /api/ai/analytics/usage`  
**Purpose**: Get AI usage statistics for the organization

```typescript
// Query Parameters
interface UsageAnalyticsQuery {
  startDate?: string; // ISO date
  endDate?: string;
  operationType?: 'extraction' | 'classification' | 'compliance';
  groupBy?: 'day' | 'week' | 'month';
}

// Response
interface UsageAnalyticsResponse {
  success: boolean;
  data?: {
    period: {
      start: string;
      end: string;
    };
    metrics: {
      totalOperations: number;
      successRate: number;
      averageProcessingTime: number;
      totalCost: number;
      tokenUsage: number;
    };
    breakdown: {
      [key: string]: {
        operations: number;
        successRate: number;
        avgProcessingTime: number;
        cost: number;
      };
    };
  };
  error?: APIError;
}
```

### 9. Model Performance

**Endpoint**: `GET /api/ai/analytics/performance`  
**Purpose**: Get AI model performance metrics

```typescript
// Response
interface ModelPerformanceResponse {
  success: boolean;
  data?: {
    models: {
      [modelName: string]: {
        version: string;
        operations: number;
        averageConfidence: number;
        successRate: number;
        averageLatency: number;
        costPerOperation: number;
        lastUsed: string;
      };
    };
    recommendations: {
      suggestedModel: string;
      reason: string;
      potentialSavings?: number;
    }[];
  };
  error?: APIError;
}
```

## Configuration Endpoints

### 10. AI Settings

**Endpoint**: `GET/PUT /api/ai/settings`  
**Purpose**: Manage AI configuration for the organization

```typescript
// GET Response / PUT Request
interface AISettings {
  preferredModels: {
    extraction: string;
    classification: string;
    compliance: string;
  };
  processingOptions: {
    autoClassifyDocuments: boolean;
    autoGenerateReports: boolean;
    confidenceThreshold: number; // 0-1
    enableRealTimeUpdates: boolean;
  };
  notifications: {
    processingComplete: boolean;
    lowConfidenceResults: boolean;
    errorAlerts: boolean;
  };
  costLimits: {
    monthlyBudget?: number; // in cents
    operationLimit?: number;
    alertThreshold: number; // percentage
  };
}
```

## Error Handling

### Standard Error Response

```typescript
interface APIError {
  code: string;
  message: string;
  details?: {
    field?: string;
    value?: any;
    suggestion?: string;
  };
  timestamp: string;
  requestId: string;
}
```

### Common Error Codes

| Code                      | Description                   | HTTP Status |
| ------------------------- | ----------------------------- | ----------- |
| `AI_SERVICE_UNAVAILABLE`  | AI provider is down           | 503         |
| `DOCUMENT_TOO_LARGE`      | File exceeds size limit       | 413         |
| `UNSUPPORTED_FORMAT`      | File format not supported     | 400         |
| `EXTRACTION_FAILED`       | Could not extract information | 422         |
| `INSUFFICIENT_CONFIDENCE` | AI confidence below threshold | 422         |
| `RATE_LIMIT_EXCEEDED`     | Too many requests             | 429         |
| `QUOTA_EXCEEDED`          | Monthly AI budget exceeded    | 402         |
| `INVALID_DOCUMENT`        | Document appears corrupted    | 400         |

## Rate Limiting

### Limits by Endpoint

| Endpoint             | Limit        | Window   |
| -------------------- | ------------ | -------- |
| `/extract`           | 10 requests  | 1 minute |
| `/classify`          | 50 requests  | 1 minute |
| `/assess`            | 20 requests  | 1 minute |
| `/check-requirement` | 100 requests | 1 minute |
| `/analytics/*`       | 60 requests  | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

## Authentication & Authorization

### Required Headers

```
Authorization: Bearer <session-token>
Content-Type: application/json
X-Organization-ID: <org-id> // Optional, defaults to user's primary org
```

### Permission Levels

| Operation          | Required Role      |
| ------------------ | ------------------ |
| Upload documents   | Tender Specialist+ |
| Generate reports   | Tender Specialist+ |
| View analytics     | Tender Manager+    |
| Modify AI settings | Admin              |
| Bulk operations    | Tender Manager+    |

## Implementation Example

### Next.js API Route Structure

```typescript
// pages/api/ai/tenders/extract.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth';
import { AIService } from '@/lib/ai/service';
import { rateLimit } from '@/lib/middleware/rate-limit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Authentication
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return res
      .status(401)
      .json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(req, res, {
    max: 10,
    windowMs: 60000,
  });
  if (!rateLimitResult.success) {
    return res
      .status(429)
      .json({
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
      });
  }

  // Method validation
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed' },
      });
  }

  try {
    const aiService = new AIService();
    const result = await aiService.extractTenderDocument(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      },
    });
  }
}
```

---

_These API endpoints support the AI features outlined in the comprehensive analysis from `ai-readiness.md` and provide a complete interface for AI-powered tender management._
