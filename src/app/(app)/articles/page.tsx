"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Article } from "@/lib/types";
import { ArticleFormModal } from "@/components/articles/ArticleFormModal";
import { useAuth } from "@/components/AuthProvider";
import { Plus, Search, Loader2, Shirt, Pencil, Trash2 } from "lucide-react";

export default function ArticlesPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState<Article | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const { error } = await supabase.from("articles").delete().eq("id", deleting.id);
    setDeleteBusy(false);
    if (error) {
      setDeleteError(
        error.code === "23503"
          ? "Yeh article kisi order ya wapsi mein istemal ho chuka hai, is liye delete nahi ho sakta."
          : error.message
      );
      return;
    }
    setArticles((prev) => prev.filter((a) => a.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="sticky top-[57px] z-20 bg-page-gradient/95 backdrop-blur px-4 sm:px-6 lg:px-10 pt-4 pb-3">
        <div className="mb-3">
          <h1 className="font-serif text-xl font-semibold text-maroon-dark">Articles</h1>
          <p className="text-xs text-ink/45 mt-0.5">
            {articles.length} {articles.length === 1 ? "article" : "articles"} total
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-white border border-gold/25 rounded-2xl px-4 py-3 shadow-[0_2px_10px_rgba(122,18,55,0.06)] max-w-xl focus-within:border-gold/60 focus-within:shadow-[0_4px_16px_rgba(122,18,55,0.1)] transition-all">
          <Search size={18} className="text-maroon/50 flex-shrink-0" />
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
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 px-4 sm:px-6 lg:px-10 py-3">
          {filtered.map((a) => (
            <li key={a.id} className="card flex items-center gap-3.5 p-4">
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
                <p className="font-semibold text-ink truncate">{a.name}</p>
              </div>
              <button
                onClick={() => setEditing(a)}
                className="p-2 rounded-full text-maroon/60 hover:bg-maroon-50 flex-shrink-0 transition-colors"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setDeleteError(null);
                    setDeleting(a);
                  }}
                  className="p-2 rounded-full text-red-500/70 hover:bg-red-50 flex-shrink-0 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fab text-white w-14 h-14 bottom-[5.5rem] right-5"
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

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-cream rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-3">
            <h3 className="font-semibold text-maroon-dark">Article Delete Karein?</h3>
            <p className="text-sm text-ink/70">
              &quot;{deleting.name}&quot; hamesha ke liye delete ho jayega. Yeh wapis nahi ho sakta.
            </p>
            {deleteError && <p className="text-red-600 text-xs font-medium">{deleteError}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 border border-gold/40 rounded-xl py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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
