"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Phone, MapPin, Hash, Pencil, Loader2, CalendarPlus } from "lucide-react";

export default function CustomerInfoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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
      <header className="sticky top-0 z-20 bg-maroon text-white shadow-md flex items-center gap-3 px-3 py-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <span className="font-medium">Grahak ki Tafseelat</span>
      </header>

      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <Avatar name={customer.name} photoUrl={customer.photo_url} size={110} />
        <h1 className="mt-3 text-xl font-semibold text-maroon-dark text-center">{customer.name}</h1>
        <button
          onClick={() => setEditing(true)}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium border border-gold/50 text-maroon-dark rounded-full px-3 py-1.5 hover:bg-maroon-50"
        >
          <Pencil size={12} /> Edit Karein
        </button>
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
