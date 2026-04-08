const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");

// GET /api/blog - get all published blog posts [PUBLIC]
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
    });

    res.json(posts);
  } catch (error) {
    console.error("Get blog posts error:", error);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

// GET /api/blog/:slug - get single blog post by slug [PUBLIC]
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Get blog post error:", error);
    res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

// POST /api/admin/blog - create new blog post [admin only]
router.post("/admin", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { slug, title, excerpt, category, readTime, content } = req.body;

    if (!slug || !title || !excerpt || !category || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt,
        category,
        readTime: readTime || "5 min read",
        content: Array.isArray(content) ? content : [content],
      },
    });

    res.status(201).json(post);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Slug already exists" });
    }
    console.error("Create blog post error:", error);
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// PATCH /api/admin/blog/:id - update blog post [admin only]
router.patch("/admin/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...updates,
        content: Array.isArray(updates.content) ? updates.content : updates.content ? [updates.content] : undefined,
      },
    });

    res.json(post);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Blog post not found" });
    }
    console.error("Update blog post error:", error);
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// DELETE /api/admin/blog/:id - delete blog post [admin only]
router.delete("/admin/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.blogPost.delete({
      where: { id },
    });

    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Blog post not found" });
    }
    console.error("Delete blog post error:", error);
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

module.exports = router;
