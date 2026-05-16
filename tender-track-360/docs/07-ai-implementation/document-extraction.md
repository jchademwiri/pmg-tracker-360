# Document Extraction & Processing

## Overview

The document extraction system is the foundation of Tender Track 360's AI capabilities. It converts unstructured tender documents into structured, actionable data.

## Extraction Pipeline

### 1. Document Ingestion

**Supported Formats**:

- PDF (digital and scanned)
- Microsoft Word (.docx)
- Images (JPG, PNG) - scanned documents
- Text files

**Processing Steps**:

```typescript
interface DocumentProcessor {
  // Step 1: File validation and preprocessing
  validateDocument(file: File): ValidationResult;

  // Step 2: Text extraction based on file type
  extractText(file: File): Promise<ExtractedText>;

  // Step 3: Text cleaning and normalization
  preprocessText(rawText: string): CleanText;

  // Step 4: Document structure analysis
  analyzeStructure(text: CleanText): DocumentStructure;
}
```

### 2. AI-Powered Information Extraction

**Key Data Points to Extract**:

| Field                     | Detection Method    | Example Output                     |
| ------------------------- | ------------------- | ---------------------------------- |
| Tender Number             | Regex + LLM context | A-EWM 02-2025                      |
| Title/Description         | LLM summarization   | Arboriculture Maintenance Services |
| Issuing Authority         | Pattern matching    | City of Ekurhuleni                 |
| Closing Date & Time       | Regex + date parser | 2025-08-27 10:00                   |
| Submission Location       | Context matching    | Golden Heights, Germiston          |
| Mandatory Forms           | Table parsing       | Form A, Form B, Form C...          |
| Technical Requirements    | Section analysis    | Equipment, licenses, experience    |
| Financial Thresholds      | Currency regex      | R200,000, R100,000                 |
| Evaluation Method         | Formula detection   | 90/10 Price/Goals system           |
| Disqualification Criteria | List extraction     | Late submission, missing forms     |

### 3. Structured Output Generation

**JSON Schema**:

```typescript
interface TenderExtraction {
  metadata: {
    tenderNumber: string;
    title: string;
    issuingAuthority: string;
    closingDate: string;
    submissionAddress: string;
    evaluationMethod: string;
    estimatedValue?: number;
  };

  requirements: {
    mandatoryForms: string[];
    technicalRequirements: TechnicalRequirement[];
    financialRequirements: FinancialRequirement[];
    experienceRequirements: ExperienceRequirement[];
    specificGoals: SpecificGoal[];
    ohsRequirements: string[];
  };

  compliance: {
    disqualificationCriteria: string[];
    submissionRules: string[];
    documentRequirements: DocumentRequirement[];
  };

  evaluation: {
    priceWeight: number;
    goalWeight: number;
    scoringMethod: string;
    specificGoalPoints: SpecificGoalPoint[];
  };
}
```

## AI Prompt Engineering

### Master Extraction Prompt

```
ROLE: You are an expert tender compliance officer specializing in South African government and corporate tenders.

TASK: Extract comprehensive structured information from the tender document provided.

INSTRUCTIONS:
1. Read the entire document carefully
2. Identify all mandatory requirements and optional elements
3. Extract financial thresholds and technical specifications
4. Note all disqualification criteria and submission rules
5. Determine the evaluation methodology and point allocation

EXTRACTION REQUIREMENTS:

METADATA:
- Tender reference number
- Full tender title
- Issuing organization/authority
- Closing date and time
- Submission address/location
- Estimated contract value (if stated)

REQUIREMENTS:
- All mandatory forms (list each form name/number)
- Technical requirements by category
- Financial capability requirements
- Experience and qualification requirements
- Specific goals (B-BBEE, local preference, etc.)
- OHS and safety requirements

COMPLIANCE:
- Complete list of disqualification criteria
- Submission format requirements
- Document certification requirements
- Deadline and timing requirements

EVALUATION:
- Scoring methodology (e.g., 90/10, 80/20)
- Point allocation for different criteria
- Specific goal points breakdown

OUTPUT FORMAT: Return valid JSON matching the TenderExtraction interface.

DOCUMENT TEXT:
{document_content}
```

### Specialized Prompts

**Requirements Classification**:

```
Classify each requirement as:
- MANDATORY: Must have or automatic disqualification
- CONDITIONAL: Required only if claiming specific points
- OPTIONAL: Beneficial but not required
- CATEGORY_SPECIFIC: Only applies to certain bid categories
```

**Financial Extraction**:

```
Extract all financial requirements including:
- Minimum bank balance/credit facility per category
- Annual turnover requirements
- Insurance coverage amounts
- Bond/guarantee requirements
- Proof documentation needed (bank statements, credit letters, etc.)
```

## Implementation Details

### 1. OCR Integration

**For Scanned Documents**:

```typescript
class OCRProcessor {
  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    // AWS Textract implementation
    const textract = new AWS.Textract();
    const result = await textract
      .detectDocumentText({
        Document: { Bytes: imageBuffer },
      })
      .promise();

    return this.assembleText(result.Blocks);
  }

  private assembleText(blocks: TextractBlock[]): string {
    // Reconstruct text maintaining document structure
    return blocks
      .filter((block) => block.BlockType === 'LINE')
      .sort((a, b) => a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top)
      .map((block) => block.Text)
      .join('\n');
  }
}
```

### 2. Text Preprocessing

**Cleaning Pipeline**:

```typescript
class TextPreprocessor {
  clean(rawText: string): string {
    return rawText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable chars
      .replace(/(\r\n|\r)/g, '\n') // Normalize line endings
      .trim();
  }

  extractSections(text: string): DocumentSections {
    // Identify major sections using headers and formatting
    const sections = {
      introduction: this.findSection(text, /introduction|overview/i),
      requirements: this.findSection(text, /requirements|specifications/i),
      evaluation: this.findSection(text, /evaluation|scoring|points/i),
      submission: this.findSection(text, /submission|closing/i),
    };

    return sections;
  }
}
```

### 3. AI Service Integration

**OpenAI Integration**:

```typescript
class AIExtractor {
  async extractTenderData(documentText: string): Promise<TenderExtraction> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: this.getExtractionPrompt(),
        },
        {
          role: 'user',
          content: documentText,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent extraction
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

## Quality Assurance

### 1. Extraction Validation

**Validation Rules**:

```typescript
interface ValidationRules {
  // Required fields must be present
  requiredFields: string[];

  // Date formats must be valid
  dateValidation: (date: string) => boolean;

  // Financial amounts must be reasonable
  financialValidation: (amount: number) => boolean;

  // Tender numbers must match expected patterns
  tenderNumberPattern: RegExp;
}
```

### 2. Confidence Scoring

**Confidence Metrics**:

- **High (90-100%)**: Clear, unambiguous extraction
- **Medium (70-89%)**: Some uncertainty, manual review recommended
- **Low (<70%)**: Significant uncertainty, manual verification required

### 3. Human Review Workflow

**Review Triggers**:

- Low confidence scores
- Missing critical information
- Unusual document formats
- User-reported inaccuracies

## Error Handling

### 1. Graceful Degradation

```typescript
class ExtractionService {
  async processDocument(file: File): Promise<ExtractionResult> {
    try {
      // Primary AI extraction
      return await this.aiExtractor.extract(file);
    } catch (aiError) {
      // Fallback to rule-based extraction
      return await this.ruleBasedExtractor.extract(file);
    }
  }
}
```

### 2. Retry Logic

- **API Failures**: Exponential backoff with jitter
- **Rate Limits**: Queue system with delayed processing
- **Timeout Handling**: Chunked processing for large documents

## Performance Optimization

### 1. Caching Strategy

```typescript
class ExtractionCache {
  // Cache results by document hash
  async getCachedResult(documentHash: string): Promise<TenderExtraction | null>;

  // Store successful extractions
  async cacheResult(
    documentHash: string,
    result: TenderExtraction
  ): Promise<void>;

  // Cache expiry for updated AI models
  getCacheExpiry(): number; // 30 days
}
```

### 2. Batch Processing

- Process multiple documents in parallel
- Optimize API calls with batch requests
- Stream results for real-time updates

---

_This extraction system implements the document parsing capabilities outlined in the AI strategy from `ai-readiness.md`._
