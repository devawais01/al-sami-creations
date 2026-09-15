"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Article, OrderWithItems } from "@/lib/types";
import { SIZES } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function ReturnModal({
  customerId,
  orders,
  onClose,
  onDone,
}: {
  customerId: string;
  orders: OrderWithItems[];
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [orderId, setOrderId] = useState<string>(orders[0]?.id ?? "");
  const [articleId, setArticleId] = useState("");
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("articles")
      .select("*")
      .order("name")
      .then(({ data }) => setArticles((data as Article[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleId || qty <= 0) {
      setError("Article aur quantity zaroor darj karein.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("returns").insert({
      customer_id: customerId,
      order_id: orderId || null,
      article_id: articleId,
      size,
      qty,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDone();
  };

  return (
    <Modal title="Wapsi (Return) Darj Karein" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Order (Ikhtiyari)</label>
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className="input">
            <option value="">— Kisi khaas order se mutaliq nahi —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                Order #{o.order_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Article *</label>
          <select required value={articleId} onChange={(e) => setArticleId(e.target.value)} className="input">
            <option value="">Article chunein</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-ink/60 mb-1 block">Size *</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="input">
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value} — {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink/60 mb-1 block">Quantity *</label>
            <input
              type="number"
              min={1}
              required
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Note (Ikhtiyari)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="wajah, waghera" className="input" />
        </div>

        {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          Return Darj Karein
        </button>
      </form>
    </Modal>
  );
}
