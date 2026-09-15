"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/lib/types";
import { groupItemsByArticle } from "@/lib/utils";
import { Loader2, Shirt } from "lucide-react";

export function CloseOrderModal({
  order,
  onClose,
  onDone,
}: {
  order: OrderWithItems;
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const groups = groupItemsByArticle(order.order_items);

  // itemId -> qty being delivered right now (defaults to full remaining)
  const [deliverNow, setDeliverNow] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const it of order.order_items) {
      init[it.id] = Math.max(0, it.qty_ordered - it.qty_delivered);
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setVal = (itemId: string, remaining: number, val: number) => {
    setDeliverNow((prev) => ({ ...prev, [itemId]: Math.min(Math.max(0, val || 0), remaining) }));
  };

  const totalNow = Object.values(deliverNow).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = order.order_items
        .filter((it) => (deliverNow[it.id] ?? 0) > 0)
        .map((it) =>
          supabase
            .from("order_items")
            .update({ qty_delivered: it.qty_delivered + deliverNow[it.id] })
            .eq("id", it.id)
        );
      if (updates.length === 0) {
        setError("Kam az kam ek piece deliver karein band karne ke liye.");
        setSaving(false);
        return;
      }
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch ghalat ho gaya.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Order #${order.order_number} Band Karein`} onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-xs text-ink/50">
          Har size ke liye batayein abhi kitne pieces customer ko diye gaye hain. Baqi pieces &quot;Partial&quot; mein rahenge.
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
          {groups.map((g) => (
            <div key={g.article?.id} className="bg-white border border-gold/25 rounded-xl p-2.5">
              <div className="flex items-center gap-2 mb-2">
                {g.article?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.article.photo_url} alt={g.article.name} className="w-9 h-9 rounded-lg object-cover border border-gold/30" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-maroon-50 border border-gold/30 flex items-center justify-center">
                    <Shirt size={16} className="text-maroon/50" />
                  </div>
                )}
                <span className="font-medium text-sm flex-1">{g.article?.name}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.values(g.sizes).map((item) => {
                  const remaining = item.qty_ordered - item.qty_delivered;
                  if (remaining <= 0) return null;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-ink/60 w-32">
                        {item.size} — baqi {remaining}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={deliverNow[item.id] ?? 0}
                        onChange={(e) => setVal(item.id, remaining, parseInt(e.target.value, 10))}
                        className="w-24 text-center border border-gold/30 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-maroon/30"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-maroon-50 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-maroon-dark">Ab Deliver Ho Raha Hai</span>
          <span className="text-lg font-bold text-maroon-dark">{totalNow} piece</span>
        </div>

        {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          Confirm Karein
        </button>
      </div>
    </Modal>
  );
}
