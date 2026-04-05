import Link from "next/link";
import { blogPosts } from "@/lib/blog";

export default function BlogPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-surface p-7 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Blog</p>
        <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-sora)] text-3xl font-bold leading-tight sm:text-5xl">
          Car buying tips, market updates, and ownership advice.
        </h1>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article key={post.slug} className="rounded-2xl border border-black/10 bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{post.category}</p>
            <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{post.excerpt}</p>
            <p className="mt-3 text-xs text-ink-muted">{post.publishedAt} • {post.readTime}</p>
            <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-semibold text-brand">
              Read article
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
