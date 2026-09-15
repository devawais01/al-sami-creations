"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Modal } from "@/components/Modal";
import type { Profile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Plus, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";

interface UserRow extends Profile {
  email: string;
}

export default function UsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && profile && profile.role !== "admin") {
      router.replace("/customers");
      return;
    }
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
  }, [authLoading, profile, router, load]);

  if (authLoading || !profile || profile.role !== "admin") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-maroon" size={26} />
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-20 bg-maroon-gradient text-white shadow-[0_2px_16px_rgba(122,18,55,0.25)] flex items-center justify-between px-3 sm:px-6 lg:px-10 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium">Users</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 bg-gold text-maroon-dark text-xs font-semibold rounded-full px-3 py-1.5"
        >
          <Plus size={14} /> Naya User
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-maroon" size={26} />
        </div>
      ) : (
        <ul className="divide-y divide-gold/15 px-2 sm:px-6 lg:px-10 py-2 max-w-2xl">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-2 py-3">
              <div className="bg-maroon-50 rounded-full p-2">
                {u.role === "admin" ? (
                  <ShieldCheck size={18} className="text-maroon" />
                ) : (
                  <UserIcon size={18} className="text-maroon" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name}</p>
                <p className="text-xs text-ink/50 truncate">{u.email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gold-dark">{u.role}</span>
                <p className="text-[10px] text-ink/40">{formatDateTime(u.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Kuch ghalat ho gaya.");
      return;
    }
    onCreated();
  };

  return (
    <Modal title="Naya User Shamil Karein" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Naam *</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Email *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-xs font-medium text-ink/60 mb-1 block">Password *</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          User Shamil Karein
        </button>
      </form>
    </Modal>
  );
}
