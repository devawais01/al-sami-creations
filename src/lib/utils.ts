import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import type { Article, OrderItem, Size } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, hh:mm a");
}

export function formatDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy");
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Groups order_items by article for display: { articleId: { article, sizes: {size: item}, total } } */
export function groupItemsByArticle(items: OrderItem[]) {
  const map = new Map<
    string,
    { article?: Article; sizes: Partial<Record<Size, OrderItem>>; totalOrdered: number; totalDelivered: number }
  >();

  for (const item of items) {
    if (!map.has(item.article_id)) {
      map.set(item.article_id, {
        article: item.article,
        sizes: {},
        totalOrdered: 0,
        totalDelivered: 0,
      });
    }
    const entry = map.get(item.article_id)!;
    entry.sizes[item.size] = item;
    entry.totalOrdered += item.qty_ordered;
    entry.totalDelivered += item.qty_delivered;
  }

  return Array.from(map.values());
}

export function orderGrandTotal(items: OrderItem[]) {
  return items.reduce(
    (acc, it) => {
      acc.ordered += it.qty_ordered;
      acc.delivered += it.qty_delivered;
      return acc;
    },
    { ordered: 0, delivered: 0 }
  );
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  partial: "Partial",
  closed: "Closed",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  partial: "bg-blue-100 text-blue-800 border-blue-300",
  closed: "bg-green-100 text-green-800 border-green-300",
};
