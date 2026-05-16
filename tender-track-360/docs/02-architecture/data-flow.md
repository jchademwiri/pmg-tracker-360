# Data Flow Diagram

## Overview
This diagram illustrates how data flows through the Tender Track 360 system, from user interactions to database storage and back.

## Diagram Description

The data flow diagram should visualize the following key processes:

### User Authentication Flow
1. User submits login credentials
2. Credentials sent to Supabase Auth
3. JWT token returned to application
4. User session established

### Tender Creation Flow
1. User inputs tender data
2. Client validation occurs
3. Server Action processes request
4. Drizzle ORM formats and validates data
5. Data stored in PostgreSQL
6. Confirmation returned to user

### Document Management Flow
1. User uploads document
2. File sent to Supabase Storage
3. Metadata stored in PostgreSQL
4. File URL and metadata returned to user

### Notification Process Flow
1. System event triggers notification (e.g., approaching deadline)
2. Notification service prepares message
3. Email sent to relevant users
4. Notification stored in database
5. In-app notification displayed to user

### Reporting Data Flow
1. User requests report
2. Server Action queries database via Drizzle
3. Data aggregated and processed
4. Formatted report returned to user
5. Optional export to external format (CSV/PDF)

## Key Data Entities
- Users
- Tenders
- Documents
- Tasks
- Notifications
- Audit Logs

## Data Transformation Points
Highlight where data undergoes significant transformation:
- Form submission to database record
- Raw database data to dashboard visualizations
- Database records to exportable reports

*Note: Create this diagram using a data flow diagramming tool. Consider using different shapes to represent processes, data stores, external entities, and data flows.*

*This document is part of the Tender Track 360 project documentation.*