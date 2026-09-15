"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Customer, OrderWithItems, ReturnRow } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { OrderCard } from "@/components/orders/OrderCard";
import { AddOrderModal } from "@/components/orders/AddOrderModal";
import { CloseOrderModal } from "@/components/orders/CloseOrderModal";
import { EditOrderModal } from "@/components/orders/EditOrderModal";
import { ReturnModal } from "@/components/orders/ReturnModal";
import { useAuth } from "@/components/AuthProvider";
import { formatDateTime, cn } from "@/lib/utils";
import { ArrowLeft, Plus, Undo2, Loader2, Phone, PackageOpen } from "lucide-react";

type Tab = "pending" | "partial" | "closed" | "history";

const TABS: { value: Tab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "closed", label: "Closed" },
  { value: "history", label: "History" },
];

export default function CustomerOrdersPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");

  const [showAdd, setShowAdd] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [closingOrder, setClosingOrder] = useState<OrderWithItems | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<OrderWithItems | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: o }, { data: r }] = await Promise.all([
      supabase.from("customers").select("*").eq("id", customerId).single(),
      supabase
        .from("orders")
        .select("*, order_items(*, article:articles(*))")
        .eq("customer_id", customerId)
        .order("order_number", { ascending: false }),
      supabase
        .from("returns")
        .select("*, article:articles(*), order:orders(order_number)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
    ]);
    setCustomer(c as Customer);
    setOrders((o as OrderWithItems[]) ?? []);
    setReturns((r as ReturnRow[]) ?? []);
    setLoading(false);
  }, [customerId, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => o.status === tab),
    [orders, tab]
  );

  const historyEvents = useMemo(() => {
    type Ev = { date: string; node: React.ReactNode; key: string };
    const events: Ev[] = [];
    for (const o of orders) {
      events.push({
        date: o.created_at,
        key: `order-${o.id}`,
        node: (
          <div key={`order-${o.id}`} className="flex items-start gap-2">
            <span className="mt-1 w-2 h-2 rounded-full bg-maroon flex-shrink-0" />
            <div>
              <p className="text-sm">
                <span className="font-semibold">Order #{o.order_number}</span> banaya gaya
              </p>
              <p className="text-xs text-ink/50">{formatDateTime(o.created_at)}</p>
            </div>
          </div>
        ),
      });
    }
    for (const r of returns) {
      events.push({
        date: r.created_at,
        key: `ret-${r.id}`,
        node: (
          <div key={`ret-${r.id}`} className="flex items-start gap-2">
            <span className="mt-1 w-2 h-2 rounded-full bg-gold-dark flex-shrink-0" />
            <div>
              <p className="text-sm">
                <span className="font-semibold">Wapsi:</span> {r.article?.name} ({r.size}) × {r.qty}
                {r.order?.order_number ? ` — Order #${r.order.order_number}` : ""}
              </p>
              <p className="text-xs text-ink/50">{formatDateTime(r.created_at)}</p>
            </div>
          </div>
        ),
      });
    }
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, returns]);

  if (loading || !customer) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-maroon" size={26} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <header className="sticky top-0 z-20 bg-maroon text-white shadow-md">
        <div className="flex items-center gap-3 px-3 sm:px-6 lg:px-10 py-3">
          <button onClick={() => router.push("/customers")} className="p-1.5 rounded-full hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>
          <Link href={`/customers/${customerId}/info`} className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar name={customer.name} photoUrl={customer.photo_url} size={40} />
            <div className="min-w-0">
              <p className="font-medium truncate">{customer.name}</p>
              {customer.phone && (
                <p className="text-xs text-white/70 flex items-center gap-1">
                  <Phone size={10} /> {customer.phone}
                </p>
              )}
            </div>
          </Link>
        </div>

        <div className="flex px-2 sm:px-6 lg:px-10 gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
                tab === t.value ? "bg-gold text-maroon-dark" : "bg-white/10 text-white/80"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 sm:px-6 lg:px-10 py-3">
        {tab === "history" ? (
          historyEvents.length === 0 ? (
            <EmptyTab text="Abhi tak koi history nahi hai." />
          ) : (
            <div className="bg-white border border-gold/25 rounded-2xl p-4 space-y-4 max-w-2xl">
              {historyEvents.map((e) => e.node)}
            </div>
          )
        ) : filteredOrders.length === 0 ? (
          <EmptyTab text={`${TABS.find((t) => t.value === tab)?.label} mein koi order nahi hai.`} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onEdit={() => setEditingOrder(o)}
                onClose={() => setClosingOrder(o)}
                onDelete={() => {
                  setDeleteError(null);
                  setDeletingOrder(o);
                }}
                canDelete={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      <div className="fixed z-20 bottom-[5.5rem] right-5 flex items-center gap-3">
        <button
          onClick={() => setShowReturn(true)}
          className="flex items-center gap-1.5 bg-white border border-gold/50 text-maroon-dark rounded-full h-12 px-4 shadow-[0_6px_18px_rgba(0,0,0,0.18)] active:scale-95 transition-transform font-medium text-sm"
        >
          <Undo2 size={18} /> Return
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center bg-maroon hover:bg-maroon-dark text-white rounded-full w-14 h-14 shadow-[0_6px_18px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
          title="Naya Order"
        >
          <Plus size={26} />
        </button>
      </div>

      {showAdd && (
        <AddOrderModal
          customerId={customerId}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            setTab("pending");
            load();
          }}
        />
      )}

      {showReturn && (
        <ReturnModal
          customerId={customerId}
          orders={orders}
          onClose={() => setShowReturn(false)}
          onDone={() => {
            setShowReturn(false);
            load();
          }}
        />
      )}

      {closingOrder && (
        <CloseOrderModal
          order={closingOrder}
          onClose={() => setClosingOrder(null)}
          onDone={() => {
            setClosingOrder(null);
            load();
          }}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onDone={() => {
            setEditingOrder(null);
            load();
          }}
        />
      )}

      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-cream rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-semibold text-maroon-dark">Order #{deletingOrder.order_number} Delete Karein?</h3>
            <p className="text-sm text-ink/70">
              Yeh order hamesha ke liye delete ho jayega aur Hisaab ke numbers se bhi hat jayega. Yeh wapis
              nahi ho sakta.
            </p>
            {deleteError && <p className="text-red-600 text-xs font-medium">{deleteError}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingOrder(null)}
                className="flex-1 border border-gold/40 rounded-xl py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleteBusy(true);
                  setDeleteError(null);
                  const { error } = await supabase.from("orders").delete().eq("id", deletingOrder.id);
                  setDeleteBusy(false);
                  if (error) {
                    setDeleteError(error.message);
                    return;
                  }
                  setDeletingOrder(null);
                  load();
                }}
                disabled={deleteBusy}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {deleteBusy ? "Delete ho raha hai..." : "Delete Karein"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTab({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-ink/40">
      <PackageOpen size={32} className="mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
