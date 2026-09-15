"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Article } from "@/lib/types";
import { SIZES } from "@/lib/types";
import { Search, Loader2, Shirt } from "lucide-react";

type QtyMap = Record<string, Record<string, number>>; // articleId -> size -> qty

export function AddOrderModal({
  customerId,
  onClose,
  onCreated,
}: {
  customerId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<QtyMap>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("articles")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setArticles((data as Article[]) ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => a.name.toLowerCase().includes(q));
  }, [articles, query]);

  const setCell = (articleId: string, size: string, value: number) => {
    setQty((prev) => ({
      ...prev,
      [articleId]: { ...prev[articleId], [size]: Math.max(0, value || 0) },
    }));
  };

  const articleTotal = (articleId: string) =>
    Object.values(qty[articleId] ?? {}).reduce((a, b) => a + b, 0);

  const grandTotal = Object.keys(qty).reduce((sum, id) => sum + articleTotal(id), 0);

  const handleSubmit = async () => {
    if (grandTotal === 0) {
      setError("Kam az kam ek size ki quantity darj karein.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ customer_id: customerId })
        .select()
        .single();
      if (orderErr) throw orderErr;

      const rows: { order_id: string; article_id: string; size: string; qty_ordered: number }[] = [];
      for (const articleId of Object.keys(qty)) {
        for (const size of Object.keys(qty[articleId])) {
          const value = qty[articleId][size];
          if (value > 0) {
            rows.push({ order_id: order.id, article_id: articleId, size, qty_ordered: value });
          }
        }
      }

      const { error: itemsErr } = await supabase.from("order_items").insert(rows);
      if (itemsErr) throw itemsErr;

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch ghalat ho gaya.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Naya Order Shamil Karein" onClose={onClose} wide>
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-white border border-gold/30 rounded-xl px-3 py-2">
          <Search size={16} className="text-maroon/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Article talaash karein..."
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-maroon" size={22} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-ink/50 py-8">
            Pehle &quot;Article&quot; section mein articles shamil karein.
          </p>
        ) : (
          <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-0.5">
            {filtered.map((a) => (
              <div key={a.id} className="bg-white border border-gold/25 rounded-xl p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  {a.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.photo_url} alt={a.name} className="w-9 h-9 rounded-lg object-cover border border-gold/30" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-maroon-50 border border-gold/30 flex items-center justify-center">
                      <Shirt size={16} className="text-maroon/50" />
                    </div>
                  )}
                  <span className="font-medium text-sm flex-1">{a.name}</span>
                  {articleTotal(a.id) > 0 && (
                    <span className="text-xs font-semibold text-maroon-dark">{articleTotal(a.id)} pc</span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {SIZES.map(({ value, label }) => (
                    <div key={value} className="flex flex-col items-center">
                      <span className="text-[10px] text-ink/50 mb-0.5" title={label}>
                        {value}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={qty[a.id]?.[value] || ""}
                        onChange={(e) => setCell(a.id, value, parseInt(e.target.value, 10))}
                        placeholder="0"
                        className="w-full text-center text-sm border border-gold/30 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-maroon/30"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between bg-maroon-50 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-maroon-dark">Overall Total</span>
          <span className="text-lg font-bold text-maroon-dark">{grandTotal} piece</span>
        </div>

        {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving || loading}
          className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          Order Shamil Karein
        </button>
      </div>
    </Modal>
  );
}
