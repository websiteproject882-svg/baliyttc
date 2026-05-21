import { PostStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";

export const dynamic = "force-dynamic";

const blogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().default(""),
  content: z.string().min(1),
  featuredImage: z.string().url().optional().or(z.literal("")).nullable(),
  category: z.string().default(""),
  tags: z.array(z.string()).default([]),
  author: z.string().default(""),
  locale: z.string().min(2).max(8).default("en"),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  publishedAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  readTime: z.number().int().min(1).default(5),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  focusKeyword: z.string().nullable().optional(),
});

const updateSchema = blogPostSchema.extend({
  id: z.string(),
});

export async function GET() {
  const { response } = await requirePermission("blog.view");
  if (response) {
    return response;
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET admin blog error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("blog.create");
  if (!user || response) {
    return response;
  }

  try {
    const data = blogPostSchema.parse(await request.json());

    const existing = await prisma.blogPost.findUnique({
      where: { slug_locale: { slug: data.slug, locale: data.locale } },
    });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists for this language" }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        category: data.category,
        tags: data.tags,
        author: data.author,
        locale: data.locale,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        readTime: data.readTime,
        metaTitle: data.metaTitle ?? data.seoTitle,
        metaDescription: data.metaDescription ?? data.seoDescription,
        focusKeyword: data.focusKeyword,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "blog.created",
      entity: "blogPost",
      entityId: post.id,
      newValue: post,
      request,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("POST admin blog error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("blog.edit");
  if (!user || response) {
    return response;
  }

  try {
    const data = updateSchema.parse(await request.json());
    const existing = await prisma.blogPost.findUnique({ where: { id: data.id } });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (data.slug !== existing.slug || data.locale !== existing.locale) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug_locale: { slug: data.slug, locale: data.locale } },
      });
      if (slugExists && slugExists.id !== data.id) {
        return NextResponse.json({ error: "A post with this slug already exists for this language" }, { status: 400 });
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        category: data.category,
        tags: data.tags,
        author: data.author,
        locale: data.locale,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        readTime: data.readTime,
        metaTitle: data.metaTitle ?? data.seoTitle,
        metaDescription: data.metaDescription ?? data.seoDescription,
        focusKeyword: data.focusKeyword,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "blog.updated",
      entity: "blogPost",
      entityId: post.id,
      oldValue: existing,
      newValue: post,
      request,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("PATCH admin blog error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sameOriginResponse = requireSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const { user, response } = await requirePermission("blog.edit");
  if (!user || response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: user.id,
      action: "blog.deleted",
      entity: "blogPost",
      entityId: id,
      oldValue: existing,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE admin blog error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
