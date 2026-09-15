"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, Users, Undo2, Package, Clock } from "lucide-react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";

type Preset = "today" | "week" | "2weeks" | "month" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Aaj" },
  { value: "week", label: "Yeh Hafta" },
  { value: "2weeks", label: "2 Hafte" },
  { value: "month", label: "Yeh Mahina" },
  { value: "custom", label: "Custom" },
];

interface ItemRow {
  qty_ordered: number;
  qty_delivered: number;
  created_at: string;
  article: { id: string; name: string } | null;
  order: { id: string; customer: { id: string; name: string } | null } | null;
}
interface ReturnAggRow {
  qty: number;
  created_at: string;
  customer: { id: string; name: string } | null;
}

export default function HisaabPage() {
  const supabase = createClient();
  const [preset, setPreset] = useState<Preset>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [returns, setReturns] = useState<ReturnAggRow[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const range = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "week":
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
      case "2weeks":
        return { from: startOfDay(subDays(now, 13)), to: endOfDay(now) };
      case "month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "custom":
        return {
          from: customFrom ? startOfDay(new Date(customFrom)) : startOfDay(subDays(now, 30)),
          to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now),
        };
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const fromIso = range.from.toISOString();
    const toIso = range.to.toISOString();

    Promise.all([
      supabase
        .from("order_items")
        .select("qty_ordered, qty_delivered, created_at, article:articles(id,name), order:orders(id, customer:customers(id,name))")
        .gte("created_at", fromIso)
        .lte("created_at", toIso),
      supabase
        .from("returns")
        .select("qty, created_at, customer:customers(id,name)")
        .gte("created_at", fromIso)
        .lte("created_at", toIso),
    ]).then(([itemsRes, returnsRes]) => {
      setItems((itemsRes.data as unknown as ItemRow[]) ?? []);
      setReturns((returnsRes.data as unknown as ReturnAggRow[]) ?? []);
      setLoading(false);
    });
  }, [range, supabase]);

  const topArticles = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const it of items) {
      if (!it.article) continue;
      const cur = map.get(it.article.id) ?? { name: it.article.name, qty: 0 };
      cur.qty += it.qty_ordered;
      map.set(it.article.id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [items]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const it of items) {
      const cust = it.order?.customer;
      if (!cust) continue;
      const cur = map.get(cust.id) ?? { name: cust.name, qty: 0 };
      cur.qty += it.qty_ordered;
      map.set(cust.id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [items]);

  const topReturners = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const r of returns) {
      if (!r.customer) continue;
      const cur = map.get(r.customer.id) ?? { name: r.customer.name, qty: 0 };
      cur.qty += r.qty;
      map.set(r.customer.id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [returns]);

  const summary = useMemo(() => {
    const orderIds = new Set(items.map((i) => i.order?.id).filter(Boolean));
    const totalOrdered = items.reduce((s, i) => s + i.qty_ordered, 0);
    const totalDelivered = items.reduce((s, i) => s + i.qty_delivered, 0);
    const totalReturned = returns.reduce((s, r) => s + r.qty, 0);
    return {
      orders: orderIds.size,
      ordered: totalOrdered,
      pending: Math.max(0, totalOrdered - totalDelivered),
      returned: totalReturned,
    };
  }, [items, returns]);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-4 space-y-5">
      <div>
        <h1 className="font-serif text-xl font-semibold text-maroon-dark mb-3">Hisaab Kitaab</h1>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors",
                preset === p.value
                  ? "bg-maroon text-white border-maroon"
                  : "bg-white text-ink/60 border-gold/30"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-2 mt-2 max-w-md">
            <div>
              <label className="text-xs font-medium text-ink/60 mb-1 block">Kis Tareekh Se</label>
              <input
                type="date"
                value={customFrom}
                max={customTo || todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomFrom(val);
                  // keep the range logical: "to" can't be before the new "from"
                  if (customTo && val > customTo) setCustomTo(val);
                }}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 mb-1 block">Kis Tareekh Tak</label>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                max={todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  // keep the range logical: "to" can't be before "from"
                  if (customFrom && val < customFrom) {
                    setCustomTo(customFrom);
                    return;
                  }
                  setCustomTo(val);
                }}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-maroon" size={26} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard icon={Package} label="Total Orders" value={summary.orders} />
            <StatCard icon={TrendingUp} label="Total Pieces Order Hue" value={summary.ordered} />
            <StatCard icon={Clock} label="Abhi Baqi (Pending)" value={summary.pending} />
            <StatCard icon={Undo2} label="Total Wapsi (Returns)" value={summary.returned} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
            <InsightSection
              icon={TrendingUp}
              title="Sab Se Zyada Mangi Jane Wali Dresses"
              emptyText="Is muddat mein koi order nahi mila."
              rows={topArticles.map((a) => ({ label: a.name, value: a.qty }))}
            />

            <InsightSection
              icon={Users}
              title="Sab Se Zyada Order Karne Wale Customer"
              emptyText="Is muddat mein koi order nahi mila."
              rows={topCustomers.map((c) => ({ label: c.name, value: c.qty }))}
            />

            <InsightSection
              icon={Undo2}
              title="Sab Se Zyada Wapsi Karne Wale Customer"
              emptyText="Is muddat mein koi wapsi nahi hui."
              rows={topReturners.map((c) => ({ label: c.name, value: c.qty }))}
            />
          </div>

          <p className="text-xs text-ink/40 text-center pt-2">
            Kisi customer ki poori history dekhne ke liye uske order screen mein &quot;History&quot; tab kholein.
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="bg-white border border-gold/25 rounded-xl p-3 flex items-center gap-2.5">
      <div className="bg-maroon-50 rounded-lg p-2">
        <Icon size={18} className="text-maroon" />
      </div>
      <div>
        <p className="text-lg font-bold text-maroon-dark leading-none">{value}</p>
        <p className="text-[11px] text-ink/50 mt-1">{label}</p>
      </div>
    </div>
  );
}

function InsightSection({
  icon: Icon,
  title,
  rows,
  emptyText,
}: {
  icon: React.ElementType;
  title: string;
  rows: { label: string; value: number }[];
  emptyText: string;
}) {
  return (
    <div className="bg-white border border-gold/25 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-maroon-50 border-b border-gold/20">
        <Icon size={16} className="text-maroon" />
        <h2 className="text-sm font-semibold text-maroon-dark">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-ink/40 px-4 py-5 text-center">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-gold/10">
          {rows.slice(0, 10).map((r, idx) => (
            <li key={r.label} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 text-xs font-semibold text-gold-dark">{idx + 1}</span>
              <span className="flex-1 text-sm truncate">{r.label}</span>
              <span className="text-sm font-semibold text-maroon-dark">{r.value} pc</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
