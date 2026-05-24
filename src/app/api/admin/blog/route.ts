import { PostStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission, requireSameOrigin, writeAuditLog } from "@/lib/authz";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";

const blogPostIdSchema = z.string().trim().min(1).max(120);
const emptyString = z.literal("");
const httpsOrRelativeUrl = z.string().trim().max(2048).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}, "URL must use https or start with /");
const optionalDateTime = z.string().trim().datetime({ offset: true }).nullable().optional();

const blogPostSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(600).default(""),
  content: z.string().trim().min(1).max(100000),
  featuredImage: httpsOrRelativeUrl.optional().or(emptyString).nullable(),
  category: z.string().trim().max(80).default(""),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  author: z.string().trim().max(120).default(""),
  locale: z.string().trim().min(2).max(8).default("en"),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  publishedAt: optionalDateTime,
  scheduledAt: optionalDateTime,
  readTime: z.coerce.number().int().min(1).default(5),
  metaTitle: z.string().trim().max(180).nullable().optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  seoTitle: z.string().trim().max(180).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  focusKeyword: z.string().trim().max(120).nullable().optional(),
});

const updateSchema = blogPostSchema.extend({
  id: blogPostIdSchema,
});

export async function GET(request: NextRequest) {
  const { response } = await requirePermission("blog.view");
  if (response) {
    return response;
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return jsonWithRequestId({ posts }, undefined, request);
  } catch (error) {
    logApiError("admin.blog.list", error, request);
    return jsonWithRequestId({ error: "Failed to fetch posts" }, { status: 500 }, request);
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
    const parsed = blogPostSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;

    const existing = await prisma.blogPost.findUnique({
      where: { slug_locale: { slug: data.slug, locale: data.locale } },
    });
    if (existing) {
      return jsonWithRequestId(
        { error: "A post with this slug already exists for this language" },
        { status: 400 },
        request,
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage || null,
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

    return jsonWithRequestId({ success: true, post }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.blog.create", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to create post" }, { status: 500 }, request);
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
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsed.error.errors }, { status: 400 }, request);
    }

    const data = parsed.data;
    const existing = await prisma.blogPost.findUnique({ where: { id: data.id } });

    if (!existing) {
      return jsonWithRequestId({ error: "Post not found" }, { status: 404 }, request);
    }

    if (data.slug !== existing.slug || data.locale !== existing.locale) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug_locale: { slug: data.slug, locale: data.locale } },
      });
      if (slugExists && slugExists.id !== data.id) {
        return jsonWithRequestId(
          { error: "A post with this slug already exists for this language" },
          { status: 400 },
          request,
        );
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage || null,
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

    return jsonWithRequestId({ success: true, post }, undefined, request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithRequestId({ error: "Validation failed", details: error.errors }, { status: 400 }, request);
    }
    logApiError("admin.blog.update", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to update post" }, { status: 500 }, request);
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
    const rawId = searchParams.get("id");

    if (!rawId) {
      return jsonWithRequestId({ error: "Post id is required" }, { status: 400 }, request);
    }
    const parsedId = blogPostIdSchema.safeParse(rawId);
    if (!parsedId.success) {
      return jsonWithRequestId({ error: "Validation failed", details: parsedId.error.errors }, { status: 400 }, request);
    }
    const id = parsedId.data;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return jsonWithRequestId({ error: "Post not found" }, { status: 404 }, request);
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

    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError("admin.blog.delete", error, request, { userId: user.id });
    return jsonWithRequestId({ error: "Failed to delete post" }, { status: 500 }, request);
  }
}
