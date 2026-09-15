"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Article } from "@/lib/types";
import { ArticleFormModal } from "@/components/articles/ArticleFormModal";
import { Plus, Search, Loader2, Shirt, Pencil } from "lucide-react";

export default function ArticlesPage() {
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("articles").select("*").order("name");
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => a.name.toLowerCase().includes(q));
  }, [articles, query]);

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="sticky top-[57px] z-20 bg-cream px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-white border border-gold/30 rounded-xl px-3 py-2 shadow-sm">
          <Search size={18} className="text-maroon/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Article talaash karein..."
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-maroon" size={26} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-ink/50">
          <p className="text-sm">{query ? "Koi article nahi mila." : "Abhi tak koi article shamil nahi kiya gaya."}</p>
          {!query && <p className="text-xs mt-1">Neeche + button se naya article shamil karein.</p>}
        </div>
      ) : (
        <ul className="divide-y divide-gold/15 px-1">
          {filtered.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-3">
              {a.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.photo_url}
                  alt={a.name}
                  className="w-14 h-14 rounded-xl object-cover border border-gold/30 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-maroon-50 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <Shirt size={22} className="text-maroon/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">{a.name}</p>
              </div>
              <button
                onClick={() => setEditing(a)}
                className="p-2 rounded-full text-maroon/60 hover:bg-maroon-50"
              >
                <Pencil size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fab bg-maroon hover:bg-maroon-dark text-white w-14 h-14"
        title="Naya Article"
      >
        <Plus size={26} />
      </button>

      {showAdd && (
        <ArticleFormModal
          onClose={() => setShowAdd(false)}
          onSaved={(a) => {
            setArticles((prev) => [...prev, a].sort((x, y) => x.name.localeCompare(y.name)));
            setShowAdd(false);
          }}
        />
      )}

      {editing && (
        <ArticleFormModal
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={(a) => {
            setArticles((prev) => prev.map((x) => (x.id === a.id ? a : x)).sort((x, y) => x.name.localeCompare(y.name)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
