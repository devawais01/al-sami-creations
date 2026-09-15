"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/uploadPhoto";
import type { Customer } from "@/lib/types";
import { Camera, Loader2 } from "lucide-react";

export function CustomerFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Customer | null;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(existing?.name ?? "");
  const [factoryCode, setFactoryCode] = useState(existing?.factory_code ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [photoUrl] = useState(existing?.photo_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existing?.photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let finalPhotoUrl = photoUrl;
      if (file) {
        finalPhotoUrl = await uploadPhoto("customer-photos", file);
      }

      if (existing) {
        const { data, error } = await supabase
          .from("customers")
          .update({
            name: name.trim(),
            factory_code: factoryCode.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null,
            photo_url: finalPhotoUrl || null,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as Customer);
      } else {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            name: name.trim(),
            factory_code: factoryCode.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null,
            photo_url: finalPhotoUrl || null,
          })
          .select()
          .single();
        if (error) throw error;
        onSaved(data as Customer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch ghalat ho gaya.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={existing ? "Customer Edit Karein" : "Naya Customer Shamil Karein"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <label className="relative cursor-pointer group">
            <Avatar name={name || "?"} photoUrl={preview} size={84} />
            <span className="absolute -bottom-1 -right-1 bg-maroon text-white rounded-full p-1.5 shadow group-hover:bg-maroon-dark">
              <Camera size={14} />
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="text-xs text-ink/50">Tasveer laganay ke liye tap karein</span>
        </div>

        <Field label="Naam *">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer ka naam"
            className="input"
          />
        </Field>

        <Field label="Factory Code">
          <input
            value={factoryCode}
            onChange={(e) => setFactoryCode(e.target.value)}
            placeholder="jaise FC-102"
            className="input"
          />
        </Field>

        <Field label="Phone Number">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03xx-xxxxxxx"
            className="input"
          />
        </Field>

        <Field label="Address">
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Poora pata"
            rows={2}
            className="input resize-none"
          />
        </Field>

        {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          {existing ? "Tabdeeli Save Karein" : "Customer Shamil Karein"}
        </button>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink/60 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
