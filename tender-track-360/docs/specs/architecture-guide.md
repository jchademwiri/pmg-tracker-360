# System Architecture Guide

This guide breaks down the Tender Track 360 architecture into logical components for easier understanding.

## 1. Core Application Flow

The core application runs on Vercel (Next.js) and interacts with Neon (Postgres) for data persistence. Authentication is handled via Better Auth.

```mermaid
graph LR
    User[User Browser] -->|HTTPS| NextJS[Next.js App Server]
    NextJS -->|Read/Write| DB[(Neon Postgres)]
    NextJS -->|Auth| BetterAuth[Better Auth Lib]
    BetterAuth -->|Session Data| DB

    classDef default fill:#E1F5FE,stroke:#01579B,stroke-width:2px,color:#000;
    classDef db fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#000;
    class DB db;
```

## 2. Storage Architecture (R2)

We use a "Split Storage" pattern where metadata lives in Postgres, but the actual files live in Cloudflare R2. We do not stream files through our server; we use Presigned URLs.

```mermaid
sequenceDiagram
    participant User
    participant Server
    participant R2 as Cloudflare R2

    Note over User, R2: Secure Upload
    User->>Server: 1. Request Upload URL
    Server-->>User: 2. PutObject Presigned URL
    User->>R2: 3. Upload File directly

    Note over User, R2: Secure Download
    User->>Server: 4. Request File
    Server->>Server: 5. Verify Permissions
    Server-->>User: 6. 302 Redirect to R2 (Signed URL)
    User->>R2: 7. Download
```

## 3. External Integrations

Tender Track 360 relies on several key external services for specialized functionality.

```mermaid
graph TD
    Server[Next.js Server]

    subgraph Email
        Server -->|Send Emails| Resend[Resend]
    end

    subgraph Leads
        Server -->|Submit Leads| Router[Router.so]
    end

    subgraph Payments
        Server -->|Initialize Transaction| Paystack[Paystack]
        Paystack -->|Webhooks| Server
    end

    classDef default fill:#E8F5E9,stroke:#1B5E20,stroke-width:2px,color:#000;
    classDef ext fill:#F3E5F5,stroke:#4A148C,stroke-width:2px,color:#000;
    class Resend,Router,Paystack ext;
```

## 4. Full System Overview

For a view of how everything connects together, refer to the master diagram below.

```mermaid
graph TB
    subgraph Client ["Client Side"]
        Browser["fa:fa-laptop User Browser"]
    end

    subgraph Vercel ["Vercel Infrastructure"]
        subgraph NextJS ["Next.js Application"]
            AppRouter["fa:fa-code App Router"]
            ServerActions["fa:fa-cogs Server Actions"]
            API_Routes["fa:fa-bolt API Routes"]
        end
    end

    subgraph Data ["Data Layer"]
        NeonDB[("fa:fa-database Neon DB")]
        R2[("fa:fa-cloud Cloudflare R2")]
    end

    Browser --> AppRouter
    AppRouter --> ServerActions
    ServerActions --> NeonDB
    ServerActions --> R2

    classDef default fill:#fff,stroke:#333,stroke-width:1px;
    classDef client fill:#E1F5FE,stroke:#01579B,stroke-width:2px,color:#000;
    classDef app fill:#E8F5E9,stroke:#1B5E20,stroke-width:2px,color:#000;
    classDef data fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#000;

    class Browser client;
    class AppRouter,ServerActions,API_Routes app;
    class NeonDB,R2 data;
```
