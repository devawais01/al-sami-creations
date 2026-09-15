"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/lib/types";
import { groupItemsByArticle } from "@/lib/utils";
import { Loader2, Shirt } from "lucide-react";

export function EditOrderModal({
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

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const it of order.order_items) init[it.id] = it.qty_ordered;
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = order.order_items
        .filter((it) => values[it.id] !== it.qty_ordered)
        .map((it) =>
          supabase
            .from("order_items")
            .update({
              qty_ordered: values[it.id],
              qty_delivered: Math.min(it.qty_delivered, values[it.id]),
            })
            .eq("id", it.id)
        );
      if (updates.length > 0) {
        const results = await Promise.all(updates);
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch ghalat ho gaya.");
      setSaving(false);
    }
  };

  return (
    <Modal title={`Order #${order.order_number} Edit Karein`} onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-xs text-ink/50">Har size ki order quantity yahan badal sakte hain.</p>

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
                {Object.values(g.sizes).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-ink/60 w-32">
                      {item.size} — {item.qty_delivered} pehle mil chuke
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={values[item.id] ?? 0}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [item.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                      }
                      className="w-24 text-center border border-gold/30 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-maroon/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          Tabdeeli Save Karein
        </button>
      </div>
    </Modal>
  );
}
