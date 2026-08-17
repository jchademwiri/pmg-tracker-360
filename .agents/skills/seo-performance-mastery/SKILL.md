---
name: seo-performance-mastery
description: Comprehensive SEO, Schema markup, Core Web Vitals performance, and AI visibility master skill. Use when optimizing search engine rankings, embedding JSON-LD structured data, optimizing Core Web Vitals (LCP, CLS, INP), building programmatic SEO pages, or optimizing for AI search engines (Perplexity, ChatGPT, Claude). Combines seo-audit, schema, programmatic-seo, ai-seo, and vercel-react-best-practices.
---

# SEO & Web Performance Mastery

This is the unified master skill for Technical SEO, Structured Data, Core Web Vitals, and Search Visibility.

---

## 1. Required Sub-Skills Reference
* **Technical SEO Audit**: `.agents/skills/seo-audit/SKILL.md`
* **JSON-LD & Schema Markup**: `.agents/skills/schema/SKILL.md`
* **Programmatic & Scaled Pages**: `.agents/skills/programmatic-seo/SKILL.md`
* **AI Search (GEO/AEO) & llms.txt**: `.agents/skills/ai-seo/SKILL.md`
* **Core Web Vitals & Speed**: `.agents/skills/vercel-react-best-practices/SKILL.md`

---

## 2. Core SEO & Performance Rules

### A. Next.js App Router Metadata Protocol
* **Static Metadata**: Export strongly-typed `Metadata` objects on every route with title, description, canonical URL, OpenGraph, and Twitter cards.
* **Dynamic Metadata**: Use `generateMetadata({ params })` for tender and dynamic detail pages.
* **Robots & Sitemaps**: Generate dynamic `sitemap.ts` and `robots.ts` directly in the Next.js `app/` directory.

### B. Structured Data (JSON-LD)
* Embed validated JSON-LD schema using `<script type="application/ld+json">` for:
  - `GovernmentService` / `BiddingOpportunity` / `Tender` schemas.
  - `Organization` & `WebSite` with SearchAction on the homepage.
  - `BreadcrumbList` on all hierarchical listing and detail pages.
  - `FAQPage` on landing and support pages.

### C. Core Web Vitals & Rendering Performance
* **Largest Contentful Paint (LCP < 2.5s)**:
  - Optimize hero images using `next/image` with `priority` and explicit `sizes`.
  - Self-host fonts via `next/font/google`.
* **Cumulative Layout Shift (CLS < 0.1)**:
  - Reserve aspect-ratio boxes for dynamic charts, ads, and uploaded document previews.
  - Avoid rendering un-sized layout shifts.
* **Interaction to Next Paint (INP < 200ms)**:
  - Offload heavy client computations to Web Workers or Server Actions.
  - Use `React.startTransition` for non-urgent state transitions.

### D. AI Engine Optimization (GEO / AEO)
* Maintain an up-to-date `llms.txt` and `llms-full.txt` at the root for AI crawlers (Perplexity, ChatGPT, Claude).
* Structure content with clear, direct factual answers and clear semantic HTML headings (`h1`, `h2`, `h3`).
