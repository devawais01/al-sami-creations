"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { Plus, Search, Phone, Hash, Loader2, ChevronRight } from "lucide-react";

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("name");
    setCustomers((data as Customer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.factory_code?.toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="sticky top-[57px] z-20 bg-page-gradient/95 backdrop-blur px-4 sm:px-6 lg:px-10 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h1 className="font-serif text-xl font-semibold text-maroon-dark">Customers</h1>
            <p className="text-xs text-ink/45 mt-0.5">
              {customers.length} {customers.length === 1 ? "customer" : "customers"} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-white border border-gold/25 rounded-2xl px-4 py-3 shadow-[0_2px_10px_rgba(122,18,55,0.06)] max-w-xl focus-within:border-gold/60 focus-within:shadow-[0_4px_16px_rgba(122,18,55,0.1)] transition-all">
          <Search size={18} className="text-maroon/50 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Customer talaash karein..."
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-maroon" size={26} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!query} />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 px-4 sm:px-6 lg:px-10 py-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="card group flex items-center gap-3.5 p-4"
              >
                <Avatar name={c.name} photoUrl={c.photo_url} size={54} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{c.name}</p>
                  <div className="flex items-center gap-3 text-xs text-ink/50 mt-1">
                    {c.phone && (
                      <span className="flex items-center gap-1 truncate">
                        <Phone size={11} className="text-maroon/40" /> {c.phone}
                      </span>
                    )}
                    {c.factory_code && (
                      <span className="flex items-center gap-1 truncate">
                        <Hash size={11} className="text-maroon/40" /> {c.factory_code}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gold-dark/40 group-hover:text-maroon flex-shrink-0 transition-colors"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fab text-white w-14 h-14 bottom-[5.5rem] right-5"
        title="Naya Customer"
      >
        <Plus size={26} />
      </button>

      {showAdd && (
        <CustomerFormModal
          onClose={() => setShowAdd(false)}
          onSaved={(c) => {
            setCustomers((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-ink/50">
      <p className="text-sm">
        {hasQuery ? "Koi customer nahi mila." : "Abhi tak koi customer shamil nahi kiya gaya."}
      </p>
      {!hasQuery && <p className="text-xs mt-1">Neeche + button se naya customer shamil karein.</p>}
    </div>
  );
}
