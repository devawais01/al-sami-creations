"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/lib/uploadPhoto";
import type { Article } from "@/lib/types";
import { ImagePlus, Loader2 } from "lucide-react";

export function ArticleFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Article | null;
  onClose: () => void;
  onSaved: (a: Article) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(existing?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existing?.photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      let photoUrl = existing?.photo_url ?? null;
      if (file) photoUrl = await uploadPhoto("article-photos", file);

      if (existing) {
        const { data, error } = await supabase
          .from("articles")
          .update({ name: name.trim(), photo_url: photoUrl })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as Article);
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert({ name: name.trim(), photo_url: photoUrl })
          .select()
          .single();
        if (error) throw error;
        onSaved(data as Article);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kuch ghalat ho gaya.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={existing ? "Article Edit Karein" : "Naya Article Shamil Karein"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gold/40 rounded-xl h-36 cursor-pointer bg-white hover:bg-maroon-50 transition-colors overflow-hidden relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <ImagePlus size={28} className="text-maroon/50" />
              <span className="text-xs text-ink/50">Dress ki tasveer laganay ke liye tap karein</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>

        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Dress ka Naam *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="jaise Z 208 Pink"
            className="input"
          />
        </div>

        {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          {existing ? "Tabdeeli Save Karein" : "Article Shamil Karein"}
        </button>
      </form>
    </Modal>
  );
}
