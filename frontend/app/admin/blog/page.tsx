"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  content: string[];
  publishedAt: string;
};

type BlogFormState = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  content: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const emptyForm: BlogFormState = {
  slug: "",
  title: "",
  excerpt: "",
  category: "Guides",
  readTime: "5 min read",
  content: "",
};

export default function AdminBlogPage() {
  const [token, setToken] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";

    setToken(existingToken);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/blog`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load posts (${response.status})`);
      }

      const payload = (await response.json()) as BlogPost[];
      setPosts(payload || []);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to load blog posts";
      setError(text);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  function startNew() {
    setSelectedPostId(null);
    setForm(emptyForm);
    setMessage(null);
  }

  function startEdit(post: BlogPost) {
    setSelectedPostId(post.id);
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      readTime: post.readTime,
      content: post.content.join("\n\n"),
    });
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const contentLines = form.content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      const response = await fetch(
        selectedPostId ? `${API_BASE}/api/blog/admin/${selectedPostId}` : `${API_BASE}/api/blog/admin`,
        {
          method: selectedPostId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
            title: form.title.trim(),
            excerpt: form.excerpt.trim(),
            category: form.category.trim(),
            readTime: form.readTime.trim() || "5 min read",
            content: contentLines,
          }),
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to save post");
      }

      setMessage(selectedPostId ? "Post updated successfully." : "Post created successfully.");
      startNew();
      await loadPosts();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to save post";
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!window.confirm("Delete this blog post?")) return;

    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/blog/admin/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to delete post");
      }

      if (selectedPostId === id) {
        startNew();
      }
      setMessage("Post deleted successfully.");
      await loadPosts();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to delete post";
      setError(text);
    }
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Blog Management</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Create and update dealership articles for SEO and customer education.
            </p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold"
          >
            New Post
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <h2 className="text-lg font-semibold">{selectedPostId ? "Edit Post" : "Create Post"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} required />
              <Input label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
              <Input
                label="Excerpt"
                value={form.excerpt}
                onChange={(value) => setForm({ ...form, excerpt: value })}
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Category"
                  value={form.category}
                  onChange={(value) => setForm({ ...form, category: value })}
                  required
                />
                <Input
                  label="Read Time"
                  value={form.readTime}
                  onChange={(value) => setForm({ ...form, readTime: value })}
                  required
                />
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Content (one paragraph per line)
                <textarea
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  rows={10}
                  required
                  className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                />
              </label>
              <button
                type="submit"
                disabled={saving || !token}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : selectedPostId ? "Update Post" : "Publish Post"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <h2 className="text-lg font-semibold">Published Posts</h2>
            {loading ? <p className="mt-4 text-sm text-ink-muted">Loading posts...</p> : null}
            {!loading && posts.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">No blog posts available yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {posts.map((post) => (
                  <article key={post.id} className="rounded-xl border border-black/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">{post.category}</p>
                    <h3 className="mt-1 font-semibold">{post.title}</h3>
                    <p className="mt-2 text-sm text-ink-muted">{post.excerpt}</p>
                    <p className="mt-1 text-xs text-ink-muted">{post.readTime}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(post)}
                        className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePost(post.id)}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminGate>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="rounded-lg border border-black/15 px-3 py-2 font-normal"
      />
    </label>
  );
}
