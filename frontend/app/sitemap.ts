import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";
import { getCars } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const routes = ["/", "/cars", "/blog", "/about", "/contact", "/login", "/admin", "/admin/analytics"];
  const blogRoutes = blogPosts.map((post) => `/blog/${post.slug}`);
  const cars = await getCars({ limit: "500" });
  const carRoutes = cars.map((car) => `/cars/${car.id}`);
  const allRoutes = [...routes, ...blogRoutes, ...carRoutes];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
