"use client";

import { useState } from "react";
import type { OrderWithItems } from "@/lib/types";
import { SIZES } from "@/lib/types";
import { formatDateTime, groupItemsByArticle, orderGrandTotal, STATUS_LABEL, STATUS_COLOR } from "@/lib/utils";
import { Pencil, CheckCircle2, ChevronDown, ChevronUp, Shirt, Trash2 } from "lucide-react";

export function OrderCard({
  order,
  onEdit,
  onClose,
  onDelete,
  canDelete,
}: {
  order: OrderWithItems;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupItemsByArticle(order.order_items);
  const totals = orderGrandTotal(order.order_items);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-maroon-dark">Order #{order.order_number}</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[order.status]}`}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="text-xs text-ink/50 mt-0.5">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/60">
            {totals.delivered}/{totals.ordered} piece
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gold/15 px-4 py-3 space-y-3">
          {groups.map((g) => (
            <div key={g.article?.id} className="bg-cream rounded-xl p-2.5">
              <div className="flex items-center gap-2 mb-2">
                {g.article?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.article.photo_url}
                    alt={g.article.name}
                    className="w-9 h-9 rounded-lg object-cover border border-gold/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-maroon-50 border border-gold/30 flex items-center justify-center">
                    <Shirt size={16} className="text-maroon/50" />
                  </div>
                )}
                <span className="font-medium text-sm flex-1">{g.article?.name ?? "—"}</span>
                <span className="text-xs font-semibold text-maroon-dark">
                  {g.totalDelivered}/{g.totalOrdered}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map(({ value, label }) => {
                  const item = g.sizes[value];
                  if (!item || item.qty_ordered === 0) return null;
                  return (
                    <span
                      key={value}
                      title={label}
                      className="text-[11px] bg-white border border-gold/30 rounded-lg px-2 py-1 font-medium text-ink/70"
                    >
                      {value}: {item.qty_delivered}/{item.qty_ordered}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <span className="text-sm font-semibold text-maroon-dark">
              Total: {totals.delivered}/{totals.ordered} piece
            </span>
            <div className="flex gap-2">
              {order.status !== "closed" && (
                <>
                  <button
                    onClick={onEdit}
                    className="btn-outline-gold flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-primary flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5"
                  >
                    <CheckCircle2 size={12} /> Close
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 text-xs font-medium border border-red-300 text-red-600 rounded-lg px-2.5 py-1.5 hover:bg-red-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
