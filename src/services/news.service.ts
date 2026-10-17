/*
 * Vai trò: Lấy/ghi/xóa tin tức, localize bài viết, normalize category và resolve ảnh tin.
 */
import cityImage from "../models/assets/images/du-an-khu-do-thi-xanh.jpg";
import planningImage from "../models/assets/images/du-an-quy-hoach-do-thi.jpg";
import towerImage from "../models/assets/images/du-an-thap-do-thi.jpg";
import riversideImage from "../models/assets/images/du-an-ven-song.jpg";
import materialImage from "../models/assets/images/khong-gian-trung-bay-vat-lieu.jpg";
import threeDImage from "../models/assets/images/mo-hinh-khong-gian-3d.jpg";
import interiorImage from "../models/assets/images/noi-that-phong-khach-cao-cap.jpg";
import {
  newsCategoryKeys,
  type ArticleCategoryKey,
  type NewsArticle,
} from "../models/content/news-articles";
import type { AppLanguage } from "../models/content/site-content";
import { apiFetch } from "./api";

export type NewsStatus = "DRAFT" | "PUBLISHED";

export interface NewsArticleRecord {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  summary: string;
  summaryEn: string | null;
  body: unknown;
  bodyEn: unknown;
  highlights: unknown;
  highlightsEn: unknown;
  tags: unknown;
  tagsEn: unknown;
  category: string;
  imageUrl: string;
  readingMinutes: number;
  isFeatured: boolean;
  status: NewsStatus;
  publishedAt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveNewsArticleInput {
  id?: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  summary: string;
  summaryEn?: string | null;
  body: string[];
  bodyEn?: string[] | null;
  highlights: string[];
  highlightsEn?: string[] | null;
  tags: string[];
  tagsEn?: string[] | null;
  category: ArticleCategoryKey;
  imageUrl: string;
  readingMinutes: number;
  isFeatured: boolean;
  status: NewsStatus;
  publishedAt: string;
  sortOrder?: number;
}

const bundledNewsImages: Record<string, string> = {
  "cmid-asset://news-city": cityImage,
  "cmid-asset://news-planning": planningImage,
  "cmid-asset://news-tower": towerImage,
  "cmid-asset://news-riverside": riversideImage,
  "cmid-asset://news-green": cityImage,
  "cmid-asset://news-material": materialImage,
  "cmid-asset://news-3d": threeDImage,
  "cmid-asset://news-interior": interiorImage,
  "cmid-asset://project-tower": towerImage,
  "cmid-asset://project-riverside": riversideImage,
  "cmid-asset://project-material-showroom": materialImage,
  "cmid-asset://project-green-district": cityImage,
};

export function getNewsArticles(): Promise<NewsArticleRecord[]> {
  return apiFetch<NewsArticleRecord[]>("/news", { skipAuth: true });
}

export function getNewsArticleBySlug(slug: string): Promise<NewsArticleRecord> {
  return apiFetch<NewsArticleRecord>(`/news/${encodeURIComponent(slug)}`, {
    skipAuth: true,
  });
}

export function getAdminNewsArticles(
  useDemoAccess = false,
): Promise<NewsArticleRecord[]> {
  return apiFetch<NewsArticleRecord[]>(newsAdminListPath(useDemoAccess), {
    headers: adminHeaders(useDemoAccess),
    authScope: "admin",
    skipAuth: useDemoAccess,
  });
}

export function saveNewsArticle(
  input: SaveNewsArticleInput,
  useDemoAccess = false,
): Promise<NewsArticleRecord> {
  return apiFetch<NewsArticleRecord>(newsWritePath(useDemoAccess), {
    method: "POST",
    authScope: "admin",
    headers: {
      "Content-Type": "application/json",
      ...adminHeaders(useDemoAccess),
    },
    skipAuth: useDemoAccess,
    body: JSON.stringify(input),
  });
}

export function deleteNewsArticle(
  id: string,
  useDemoAccess = false,
): Promise<void> {
  return apiFetch<void>(
    `${newsWritePath(useDemoAccess)}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      authScope: "admin",
      headers: adminHeaders(useDemoAccess),
      skipAuth: useDemoAccess,
    },
  );
}

export function localizeNewsArticle(
  article: NewsArticleRecord,
  language: AppLanguage,
): NewsArticle {
  const useEnglish = language === "en";

  return {
    slug: article.slug,
    title: useEnglish ? article.titleEn || article.title : article.title,
    summary: useEnglish
      ? article.summaryEn || article.summary
      : article.summary,
    date: formatNewsDate(article.publishedAt, language),
    publishedAt: article.publishedAt,
    category: normalizeCategory(article.category),
    image: resolveNewsImage(article.imageUrl),
    body: useEnglish
      ? toStringArray(article.bodyEn, article.body)
      : toStringArray(article.body),
    highlights: useEnglish
      ? toStringArray(article.highlightsEn, article.highlights)
      : toStringArray(article.highlights),
    tags: useEnglish
      ? toStringArray(article.tagsEn, article.tags)
      : toStringArray(article.tags),
    readingMinutes: article.readingMinutes,
    featured: article.isFeatured,
  };
}

export function resolveNewsImage(imageUrl: string) {
  return bundledNewsImages[imageUrl] ?? imageUrl;
}

function normalizeCategory(category: string): ArticleCategoryKey {
  return newsCategoryKeys.includes(
    category as (typeof newsCategoryKeys)[number],
  ) && category !== "all"
    ? (category as ArticleCategoryKey)
    : "cmid-news";
}

function toStringArray(value: unknown, fallback?: unknown) {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (Array.isArray(fallback))
    return fallback.filter((item): item is string => typeof item === "string");
  return [];
}

function formatNewsDate(value: string, language: AppLanguage) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: language === "vi" ? "2-digit" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function newsAdminListPath(useDemoAccess: boolean) {
  return `/news/${useDemoAccess ? "demo" : "admin"}`;
}

function newsWritePath(useDemoAccess: boolean) {
  return useDemoAccess ? "/news/demo" : "/news";
}

function adminHeaders(useDemoAccess: boolean) {
  return useDemoAccess ? { "X-CMID-Demo-Admin": "true" } : undefined;
}
