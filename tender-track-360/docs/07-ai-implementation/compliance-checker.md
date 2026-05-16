# AI Compliance Checker

## Overview

The compliance checker is the core AI feature that analyzes tender requirements against a company's stored documents and capabilities, providing instant readiness assessments.

## Compliance Analysis Engine

### 1. Readiness Assessment Logic

```typescript
interface ComplianceChecker {
  analyzeReadiness(
    tenderRequirements: TenderRequirement[],
    companyProfile: CompanyProfile
  ): Promise<ReadinessReport>;

  generateGapAnalysis(
    missing: Requirement[],
    outdated: Requirement[]
  ): GapAnalysis;

  calculateReadinessScore(
    met: number,
    total: number,
    weights: RequirementWeight[]
  ): ReadinessScore;
}
```

### 2. Traffic Light System

**Status Categories**:

- 🟢 **Ready to Bid (85-100%)**: All critical requirements met
- 🟡 **Partially Ready (60-84%)**: Some missing items, can proceed with caution
- 🔴 **Not Eligible (<60%)**: Critical requirements missing, high risk

### 3. Requirement Matching Algorithm

```typescript
class RequirementMatcher {
  async matchRequirement(
    requirement: TenderRequirement,
    companyDocs: CompanyDocument[]
  ): Promise<MatchResult> {
    // 1. Direct document type matching
    const directMatch = this.findDirectMatch(requirement, companyDocs);
    if (directMatch) return { status: 'MET', document: directMatch };

    // 2. AI-powered semantic matching
    const semanticMatch = await this.findSemanticMatch(
      requirement,
      companyDocs
    );
    if (semanticMatch.confidence > 0.8) {
      return { status: 'MET', document: semanticMatch.document };
    }

    // 3. Check for expired documents
    const expiredMatch = this.findExpiredMatch(requirement, companyDocs);
    if (expiredMatch) {
      return { status: 'EXPIRED', document: expiredMatch };
    }

    // 4. No match found
    return { status: 'MISSING', requirement };
  }
}
```

## Document Categorization System

### 1. Standard Categories

Based on common tender requirements:

```typescript
enum DocumentCategory {
  // Company Registration
  COMPANY_REGISTRATION = 'company_registration',
  CIPC_DOCUMENTS = 'cipc_documents',
  MEMORANDUM_OF_INCORPORATION = 'memorandum_of_incorporation',

  // Tax & Compliance
  TAX_COMPLIANCE_PIN = 'tax_compliance_pin',
  VAT_REGISTRATION = 'vat_registration',
  MUNICIPAL_ACCOUNT = 'municipal_account',

  // B-BBEE & Transformation
  BBEE_CERTIFICATE = 'bbee_certificate',
  EME_AFFIDAVIT = 'eme_affidavit',

  // Financial
  BANK_STATEMENTS = 'bank_statements',
  AUDITED_FINANCIALS = 'audited_financials',
  CREDIT_FACILITY = 'credit_facility',

  // Technical Capability
  EQUIPMENT_ENATIS = 'equipment_enatis',
  ASSET_REGISTER = 'asset_register',
  LEASE_AGREEMENTS = 'lease_agreements',

  // Personnel
  DRIVERS_LICENSES = 'drivers_licenses',
  PROFESSIONAL_REGISTRATIONS = 'professional_registrations',

  // Experience
  REFERENCE_LETTERS = 'reference_letters',
  PROJECT_CERTIFICATES = 'project_certificates',

  // Health & Safety
  LETTER_OF_GOOD_STANDING = 'letter_of_good_standing',
  SAFETY_PLAN = 'safety_plan',
  INSURANCE_CERTIFICATES = 'insurance_certificates',
}
```

### 2. AI Document Classification

```typescript
class DocumentClassifier {
  async classifyDocument(
    documentText: string,
    fileName: string
  ): Promise<ClassificationResult> {
    const prompt = `
    Analyze this document and classify it into the appropriate category.
    
    DOCUMENT CONTENT: ${documentText}
    FILE NAME: ${fileName}
    
    CATEGORIES: ${Object.values(DocumentCategory).join(', ')}
    
    Return JSON with:
    - category: primary category
    - subcategory: specific type if applicable
    - confidence: 0-1 confidence score
    - metadata: extracted key information (dates, numbers, etc.)
    `;

    const response = await this.aiService.classify(prompt);
    return this.parseClassificationResponse(response);
  }
}
```

## Readiness Report Generation

### 1. Report Structure

```typescript
interface ReadinessReport {
  overall: {
    score: number; // 0-100
    status: 'READY' | 'PARTIAL' | 'NOT_READY';
    summary: string;
  };

  categories: {
    [category: string]: CategoryAssessment;
  };

  actions: {
    critical: ActionItem[]; // Must fix before bidding
    recommended: ActionItem[]; // Should fix to improve chances
    optional: ActionItem[]; // Nice to have
  };

  timeline: {
    estimatedDays: number; // Days needed to become ready
    criticalDeadline: Date; // Last day to start preparation
  };

  metadata: {
    generatedAt: Date;
    tenderId: string;
    companyId: string;
    aiVersion: string;
  };
}
```

### 2. Category Assessment

```typescript
interface CategoryAssessment {
  name: string;
  status: 'MET' | 'PARTIAL' | 'MISSING' | 'EXPIRED';
  score: number;
  weight: number; // Importance weight (1-10)

  requirements: {
    met: RequirementStatus[];
    missing: RequirementStatus[];
    expired: RequirementStatus[];
  };

  recommendations: string[];
}
```

### 3. AI Report Generation

```typescript
class ReportGenerator {
  async generateReadinessReport(
    analysis: ComplianceAnalysis,
    tender: TenderData,
    company: CompanyProfile
  ): Promise<ReadinessReport> {
    const prompt = `
    Generate a comprehensive readiness report for this tender bid.
    
    TENDER: ${tender.title} (${tender.tenderNumber})
    COMPANY: ${company.name}
    
    ANALYSIS RESULTS:
    ${JSON.stringify(analysis, null, 2)}
    
    Create a professional report that:
    1. Summarizes overall readiness with clear status
    2. Breaks down requirements by category
    3. Prioritizes actions by criticality
    4. Estimates timeline for becoming ready
    5. Provides specific, actionable recommendations
    
    Use encouraging but realistic language. Focus on solutions.
    `;

    return await this.aiService.generateReport(prompt);
  }
}
```

## Smart Matching Features

### 1. Expiry Date Intelligence

```typescript
class ExpiryTracker {
  checkDocumentValidity(
    document: CompanyDocument,
    requirement: TenderRequirement
  ): ValidityStatus {
    if (!document.expiryDate) return 'VALID';

    const now = new Date();
    const expiry = new Date(document.expiryDate);
    const tenderClosing = new Date(requirement.tenderClosingDate);

    // Check if document expires before tender closing
    if (expiry < tenderClosing) {
      return 'EXPIRES_BEFORE_TENDER';
    }

    // Check if document is already expired
    if (expiry < now) {
      return 'EXPIRED';
    }

    // Check if document expires soon (within 30 days)
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    if (expiry < thirtyDaysFromNow) {
      return 'EXPIRES_SOON';
    }

    return 'VALID';
  }
}
```

### 2. Financial Requirement Matching

```typescript
class FinancialMatcher {
  async checkFinancialCapability(
    requirement: FinancialRequirement,
    companyFinancials: FinancialDocument[]
  ): Promise<FinancialAssessment> {
    // Extract financial data from documents
    const bankBalance = await this.extractBankBalance(companyFinancials);
    const creditFacility = await this.extractCreditFacility(companyFinancials);
    const totalCapacity = bankBalance + creditFacility;

    return {
      required: requirement.minimumAmount,
      available: totalCapacity,
      status:
        totalCapacity >= requirement.minimumAmount ? 'MET' : 'INSUFFICIENT',
      gap: Math.max(0, requirement.minimumAmount - totalCapacity),
      documents: companyFinancials.filter((doc) => doc.isValid),
    };
  }
}
```

### 3. Equipment & Asset Matching

```typescript
class AssetMatcher {
  matchEquipmentRequirements(
    requirements: EquipmentRequirement[],
    companyAssets: CompanyAsset[]
  ): EquipmentAssessment[] {
    return requirements.map((req) => {
      const matchingAssets = companyAssets.filter((asset) =>
        this.isAssetMatch(asset, req)
      );

      return {
        requirement: req,
        matchingAssets,
        status: matchingAssets.length >= req.quantity ? 'MET' : 'INSUFFICIENT',
        gap: Math.max(0, req.quantity - matchingAssets.length),
      };
    });
  }

  private isAssetMatch(
    asset: CompanyAsset,
    requirement: EquipmentRequirement
  ): boolean {
    // Check asset type, specifications, and validity
    return (
      asset.type === requirement.type &&
      asset.specifications.gvm >= requirement.minimumGvm &&
      asset.hasValidDocumentation()
    );
  }
}
```

## Proactive Recommendations

### 1. Action Item Generation

```typescript
class ActionItemGenerator {
  generateActionItems(gapAnalysis: GapAnalysis): ActionItem[] {
    const actions: ActionItem[] = [];

    // Critical missing documents
    gapAnalysis.missing.forEach((req) => {
      if (req.isMandatory) {
        actions.push({
          priority: 'CRITICAL',
          type: 'OBTAIN_DOCUMENT',
          title: `Obtain ${req.documentType}`,
          description: `This document is mandatory for bid submission`,
          estimatedDays: this.getEstimatedDays(req.documentType),
          steps: this.getObtainSteps(req.documentType),
        });
      }
    });

    // Expired documents
    gapAnalysis.expired.forEach((req) => {
      actions.push({
        priority: 'HIGH',
        type: 'RENEW_DOCUMENT',
        title: `Renew ${req.documentType}`,
        description: `Document expires before tender closing`,
        estimatedDays: this.getRenewalDays(req.documentType),
        steps: this.getRenewalSteps(req.documentType),
      });
    });

    return actions.sort(
      (a, b) =>
        this.priorityWeight(a.priority) - this.priorityWeight(b.priority)
    );
  }
}
```

### 2. Timeline Estimation

```typescript
class TimelineEstimator {
  estimatePreparationTime(actionItems: ActionItem[]): TimelineEstimate {
    const criticalPath = this.calculateCriticalPath(actionItems);
    const parallelTasks = this.identifyParallelTasks(actionItems);

    return {
      minimumDays: Math.max(...criticalPath.map((item) => item.estimatedDays)),
      recommendedDays: this.addBufferTime(criticalPath),
      criticalDeadline: this.calculateDeadline(actionItems),
      milestones: this.generateMilestones(actionItems),
    };
  }
}
```

## Integration Points

### 1. Real-time Updates

```typescript
class ComplianceMonitor {
  // Monitor document uploads and update readiness in real-time
  async onDocumentUploaded(document: CompanyDocument): Promise<void> {
    const affectedTenders = await this.findAffectedTenders(document);

    for (const tender of affectedTenders) {
      const updatedReport = await this.recalculateReadiness(tender.id);
      await this.notifyStakeholders(updatedReport);
    }
  }

  // Monitor document expiries and alert users
  async checkExpiringDocuments(): Promise<void> {
    const expiringDocs = await this.findExpiringDocuments(30); // 30 days

    for (const doc of expiringDocs) {
      await this.sendExpiryAlert(doc);
    }
  }
}
```

### 2. Notification System

```typescript
interface ComplianceNotification {
  type: 'READINESS_UPDATED' | 'DOCUMENT_EXPIRING' | 'ACTION_REQUIRED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  actionUrl?: string;
  tenderId?: string;
  documentId?: string;
}
```

---

_This compliance checker implements the AI readiness assessment capabilities outlined in the comprehensive analysis from `ai-readiness.md`._
