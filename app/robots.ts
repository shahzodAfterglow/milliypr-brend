import type { MetadataRoute } from "next";

// Butun sayt qidiruv tizimlaridan yopiq. Sitemap yo'q.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
