"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { Plus, Search, Phone, Hash, Loader2 } from "lucide-react";

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
      <div className="sticky top-[57px] z-20 bg-cream px-4 sm:px-6 lg:px-10 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-white border border-gold/30 rounded-xl px-3 py-2 shadow-sm max-w-xl">
          <Search size={18} className="text-maroon/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Grahak talaash karein..."
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
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 px-4 sm:px-6 lg:px-10 py-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex items-center gap-3 px-3 py-3 bg-white border border-gold/20 hover:border-gold/50 hover:bg-maroon-50 active:bg-maroon-50 transition-colors rounded-xl shadow-sm"
              >
                <Avatar name={c.name} photoUrl={c.photo_url} size={52} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{c.name}</p>
                  <div className="flex items-center gap-3 text-xs text-ink/50 mt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-1 truncate">
                        <Phone size={11} /> {c.phone}
                      </span>
                    )}
                    {c.factory_code && (
                      <span className="flex items-center gap-1 truncate">
                        <Hash size={11} /> {c.factory_code}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fab bg-maroon hover:bg-maroon-dark text-white w-14 h-14 bottom-[5.5rem] right-5"
        title="Naya Grahak"
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
        {hasQuery ? "Koi grahak nahi mila." : "Abhi tak koi grahak shamil nahi kiya gaya."}
      </p>
      {!hasQuery && <p className="text-xs mt-1">Neeche + button se naya grahak shamil karein.</p>}
    </div>
  );
}
