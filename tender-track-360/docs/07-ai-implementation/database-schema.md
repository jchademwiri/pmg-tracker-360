# Database Schema for AI Features

## Overview

This document outlines the database schema required to support AI features in Tender Track 360, extending the current Better Auth foundation with tender-specific tables.

## Current State Analysis

**Existing Tables** (from Better Auth):

- `user` - Basic user authentication
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

**Missing Critical Tables** (identified in user-database-analysis.md):

- Organization/multi-tenancy support
- Extended user profiles
- Tender management tables
- AI-specific data storage

## Core AI Schema

### 1. Tenders Table

Stores extracted tender information from AI processing.

```sql
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic tender metadata
  tender_number VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  issuing_authority VARCHAR(255) NOT NULL,
  category VARCHAR(100),

  -- Important dates
  closing_date TIMESTAMPTZ NOT NULL,
  opening_date TIMESTAMPTZ,
  briefing_date TIMESTAMPTZ,

  -- Submission details
  submission_address TEXT,
  submission_method VARCHAR(50), -- 'physical', 'electronic', 'both'

  -- Financial information
  estimated_value DECIMAL(15,2),
  evaluation_method VARCHAR(50), -- '90/10', '80/20', etc.

  -- AI processing metadata
  extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_model_version VARCHAR(50),
  processing_status VARCHAR(50) DEFAULT 'pending',

  -- Document storage
  original_document_path TEXT,
  extracted_text TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Indexes
  UNIQUE(organization_id, tender_number)
);

CREATE INDEX idx_tenders_organization ON tenders(organization_id);
CREATE INDEX idx_tenders_closing_date ON tenders(closing_date);
CREATE INDEX idx_tenders_status ON tenders(processing_status);
```

### 2. Tender Requirements Table

Stores AI-extracted requirements from tender documents.

```sql
CREATE TABLE tender_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,

  -- Requirement classification
  requirement_type VARCHAR(50) NOT NULL, -- 'mandatory_form', 'technical', 'financial', 'experience', 'specific_goal', 'ohs'
  category VARCHAR(100), -- 'Category 1', 'Category 2', etc.

  -- Requirement details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,

  -- Financial requirements
  minimum_value DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Document requirements
  required_document_type VARCHAR(100),
  document_age_limit_days INTEGER, -- e.g., 90 days for municipal accounts

  -- Scoring information
  points_available INTEGER DEFAULT 0,
  weight DECIMAL(5,2) DEFAULT 0, -- Importance weight 0-100

  -- AI extraction metadata
  extraction_confidence DECIMAL(3,2),
  source_section TEXT, -- Which part of document this came from

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requirements_tender ON tender_requirements(tender_id);
CREATE INDEX idx_requirements_type ON tender_requirements(requirement_type);
CREATE INDEX idx_requirements_mandatory ON tender_requirements(is_mandatory);
```

### 3. Company Documents Table

Enhanced document storage with AI categorization and metadata.

```sql
CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document identification
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'jpg', etc.
  file_size BIGINT NOT NULL,

  -- AI categorization
  document_category VARCHAR(100) NOT NULL, -- From DocumentCategory enum
  document_subcategory VARCHAR(100),
  ai_classification_confidence DECIMAL(3,2),

  -- Document metadata
  title VARCHAR(255),
  description TEXT,

  -- Validity tracking
  issue_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,

  -- AI extracted metadata (JSON for flexibility)
  extracted_metadata JSONB,

  -- Version control
  version INTEGER DEFAULT 1,
  replaces_document_id UUID REFERENCES company_documents(id),

  -- Quality assessment
  quality_score DECIMAL(3,2), -- AI assessment of document quality
  has_signature BOOLEAN,
  is_certified BOOLEAN DEFAULT false,

  -- Audit fields
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id)
);

CREATE INDEX idx_company_docs_org ON company_documents(organization_id);
CREATE INDEX idx_company_docs_category ON company_documents(document_category);
CREATE INDEX idx_company_docs_expiry ON company_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_company_docs_active ON company_documents(is_active);
```

### 4. Compliance Assessments Table

Stores AI-generated readiness reports and compliance checks.

```sql
CREATE TABLE compliance_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Overall assessment
  overall_score DECIMAL(5,2) NOT NULL, -- 0-100
  readiness_status VARCHAR(20) NOT NULL, -- 'READY', 'PARTIAL', 'NOT_READY'

  -- Detailed breakdown
  requirements_met INTEGER DEFAULT 0,
  requirements_missing INTEGER DEFAULT 0,
  requirements_expired INTEGER DEFAULT 0,
  requirements_total INTEGER NOT NULL,

  -- Timeline estimates
  estimated_preparation_days INTEGER,
  critical_deadline DATE,

  -- AI processing info
  ai_model_version VARCHAR(50),
  processing_duration_ms INTEGER,

  -- Report data (JSON for flexibility)
  detailed_report JSONB NOT NULL,
  action_items JSONB,

  -- Audit fields
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES users(id),

  -- Ensure one assessment per tender per org (can be updated)
  UNIQUE(tender_id, organization_id)
);

CREATE INDEX idx_assessments_tender ON compliance_assessments(tender_id);
CREATE INDEX idx_assessments_org ON compliance_assessments(organization_id);
CREATE INDEX idx_assessments_status ON compliance_assessments(readiness_status);
CREATE INDEX idx_assessments_score ON compliance_assessments(overall_score);
```

### 5. Requirement Matches Table

Tracks how company documents match against tender requirements.

```sql
CREATE TABLE requirement_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES tender_requirements(id) ON DELETE CASCADE,
  document_id UUID REFERENCES company_documents(id) ON DELETE SET NULL,

  -- Match status
  match_status VARCHAR(20) NOT NULL, -- 'MET', 'MISSING', 'EXPIRED', 'INSUFFICIENT'
  match_confidence DECIMAL(3,2), -- AI confidence in the match

  -- Gap analysis
  gap_description TEXT,
  recommended_action TEXT,

  -- Priority and timeline
  priority VARCHAR(10) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  estimated_resolution_days INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assessment_id, requirement_id)
);

CREATE INDEX idx_matches_assessment ON requirement_matches(assessment_id);
CREATE INDEX idx_matches_requirement ON requirement_matches(requirement_id);
CREATE INDEX idx_matches_status ON requirement_matches(match_status);
CREATE INDEX idx_matches_priority ON requirement_matches(priority);
```

### 6. AI Processing Logs Table

Tracks AI operations for monitoring and debugging.

```sql
CREATE TABLE ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Operation details
  operation_type VARCHAR(50) NOT NULL, -- 'document_extraction', 'compliance_check', 'document_classification'
  entity_type VARCHAR(50) NOT NULL, -- 'tender', 'document', 'assessment'
  entity_id UUID NOT NULL,

  -- AI service details
  ai_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'local'
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50),

  -- Performance metrics
  processing_duration_ms INTEGER NOT NULL,
  token_usage INTEGER,
  cost_cents INTEGER, -- Cost in cents

  -- Quality metrics
  confidence_score DECIMAL(3,2),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Request/response data (for debugging)
  input_hash VARCHAR(64), -- SHA256 of input for deduplication
  output_summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_ai_logs_org ON ai_processing_logs(organization_id);
CREATE INDEX idx_ai_logs_type ON ai_processing_logs(operation_type);
CREATE INDEX idx_ai_logs_entity ON ai_processing_logs(entity_type, entity_id);
CREATE INDEX idx_ai_logs_created ON ai_processing_logs(created_at);
CREATE INDEX idx_ai_logs_success ON ai_processing_logs(success);
```

## Supporting Tables

### 7. Document Categories Reference

```sql
CREATE TABLE document_categories (
  id VARCHAR(100) PRIMARY KEY, -- matches DocumentCategory enum
  name VARCHAR(255) NOT NULL,
  description TEXT,
  typical_expiry_months INTEGER, -- How long these docs typically last
  is_mandatory_for_most_tenders BOOLEAN DEFAULT false,
  parent_category VARCHAR(100) REFERENCES document_categories(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard categories
INSERT INTO document_categories (id, name, description, typical_expiry_months, is_mandatory_for_most_tenders) VALUES
('company_registration', 'Company Registration', 'CIPC registration documents', NULL, true),
('tax_compliance_pin', 'Tax Compliance PIN', 'SARS tax compliance certificate', 12, true),
('municipal_account', 'Municipal Account', 'Municipal rates and taxes account', 3, true),
('bbee_certificate', 'B-BBEE Certificate', 'Broad-Based Black Economic Empowerment certificate', 12, true),
('bank_statements', 'Bank Statements', 'Recent bank statements showing financial capacity', 1, true),
('audited_financials', 'Audited Financial Statements', 'Annual audited financial statements', 12, true),
('equipment_enatis', 'Equipment ENATIS', 'Vehicle registration documents', NULL, false),
('drivers_licenses', 'Drivers Licenses', 'Valid drivers licenses and PrDP', NULL, false),
('reference_letters', 'Reference Letters', 'Client reference letters for similar work', NULL, false),
('insurance_certificates', 'Insurance Certificates', 'Public liability and other insurance', 12, false);
```

### 8. AI Model Configurations

```sql
CREATE TABLE ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model identification
  provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'local'
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,

  -- Configuration
  operation_type VARCHAR(50) NOT NULL, -- 'extraction', 'classification', 'compliance'
  prompt_template TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.1,
  max_tokens INTEGER DEFAULT 4000,

  -- Performance settings
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  cost_per_1k_tokens DECIMAL(8,4), -- Cost tracking

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider, model_name, version, operation_type)
);
```

## Data Relationships

```
organizations (Better Auth)
├── users (Better Auth)
├── tenders
│   ├── tender_requirements
│   └── compliance_assessments
│       └── requirement_matches
├── company_documents
└── ai_processing_logs

document_categories (reference)
ai_model_configs (configuration)
```

## Migration Strategy

### Phase 1: Core Tables

1. Create organizations support (Better Auth plugin)
2. Add tenders and tender_requirements tables
3. Enhance company_documents table

### Phase 2: AI Features

1. Add compliance_assessments table
2. Add requirement_matches table
3. Add AI processing logs

### Phase 3: Optimization

1. Add document_categories reference
2. Add AI model configurations
3. Add performance indexes

## Drizzle Schema Implementation

```typescript
// src/db/schema/ai.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tenders = pgTable('tenders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  tenderNumber: varchar('tender_number', { length: 100 }).notNull(),
  title: text('title').notNull(),
  issuingAuthority: varchar('issuing_authority', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  closingDate: timestamp('closing_date', { withTimezone: true }).notNull(),
  submissionAddress: text('submission_address'),
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
  evaluationMethod: varchar('evaluation_method', { length: 50 }),
  extractionConfidence: decimal('extraction_confidence', {
    precision: 3,
    scale: 2,
  }),
  aiModelVersion: varchar('ai_model_version', { length: 50 }),
  processingStatus: varchar('processing_status', { length: 50 }).default(
    'pending'
  ),
  originalDocumentPath: text('original_document_path'),
  extractedText: text('extracted_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
});

// Add other tables following similar pattern...
```

---

_This database schema supports all AI features outlined in the comprehensive analysis from `ai-readiness.md` and addresses the gaps identified in `user-database-analysis.md`._
