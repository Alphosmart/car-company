import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPostBySlug } from "@/lib/blog";

type BlogDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Article not found | Sarkin Mota Autos" };
  }

  return {
    title: `${post.title} | Sarkin Mota Autos`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{post.category}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{post.publishedAt} • {post.readTime}</p>
      <div className="mt-6 grid gap-4 text-base leading-7 text-foreground">
        {post.content.map((paragraph, index) => (
          <p key={`${post.slug}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
