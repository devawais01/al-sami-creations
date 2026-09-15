"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { useAuth } from "@/components/AuthProvider";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Phone, MapPin, Hash, Pencil, Loader2, CalendarPlus, Trash2 } from "lucide-react";

export default function CustomerInfoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("customers").select("*").eq("id", params.id).single();
    setCustomer(data as Customer);
    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading || !customer) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-maroon" size={26} />
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-maroon text-white shadow-md flex items-center gap-3 px-3 sm:px-6 lg:px-10 py-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <span className="font-medium">Grahak ki Tafseelat</span>
      </header>

      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <Avatar name={customer.name} photoUrl={customer.photo_url} size={110} />
        <h1 className="mt-3 text-xl font-semibold text-maroon-dark text-center">{customer.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-medium border border-gold/50 text-maroon-dark rounded-full px-3 py-1.5 hover:bg-maroon-50"
          >
            <Pencil size={12} /> Edit Karein
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setDeleteError(null);
                setShowDelete(true);
              }}
              className="flex items-center gap-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-full px-3 py-1.5 hover:bg-red-50"
            >
              <Trash2 size={12} /> Delete Karein
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-2.5 max-w-md mx-auto">
        <InfoRow icon={Hash} label="Factory Code" value={customer.factory_code} />
        <InfoRow icon={Phone} label="Phone Number" value={customer.phone} href={customer.phone ? `tel:${customer.phone}` : undefined} />
        <InfoRow icon={MapPin} label="Address" value={customer.address} />
        <InfoRow icon={CalendarPlus} label="Shamil Kiya Gaya" value={formatDateTime(customer.created_at)} />
      </div>

      {editing && (
        <CustomerFormModal
          existing={customer}
          onClose={() => setEditing(false)}
          onSaved={(c) => {
            setCustomer(c);
            setEditing(false);
          }}
        />
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-cream rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-semibold text-maroon-dark">Grahak Delete Karein?</h3>
            <p className="text-sm text-ink/70">
              &quot;{customer.name}&quot; aur unke <strong>tamam orders aur wapsi ki history</strong> hamesha
              ke liye delete ho jayenge. Yeh wapis nahi ho sakta.
            </p>
            {deleteError && <p className="text-red-600 text-xs font-medium">{deleteError}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 border border-gold/40 rounded-xl py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleteBusy(true);
                  setDeleteError(null);
                  const { error } = await supabase.from("customers").delete().eq("id", customer.id);
                  setDeleteBusy(false);
                  if (error) {
                    setDeleteError(error.message);
                    return;
                  }
                  router.replace("/customers");
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

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 bg-white border border-gold/25 rounded-xl px-4 py-3">
      <Icon size={18} className="text-maroon/60 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-ink/50">{label}</p>
        <p className="text-sm font-medium text-ink">{value || "—"}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}
