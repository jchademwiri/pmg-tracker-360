import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/organization/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Google-Extended",
          "Bingbot",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/pricing.md"],
        disallow: ["/dashboard/", "/api/", "/organization/"],
      },
    ],
    sitemap: "https://tendertrack360.co.za/sitemap.xml",
  };
}
