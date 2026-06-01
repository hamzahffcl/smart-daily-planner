import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Ganti URL di bawah dengan URL domain asli Anda setelah dideploy di Vercel
  const baseUrl = "https://smart-daily-planner.vercel.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
}
