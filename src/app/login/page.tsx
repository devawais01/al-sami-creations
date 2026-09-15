"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/customers");
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError("Email ya password ghalat hai. Dobara koshish karein.");
      return;
    }
    router.replace("/customers");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-maroon-dark via-maroon to-maroon-light px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Al-Sami Creation's"
            width={160}
            height={160}
            className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)] w-36 h-auto sm:w-40"
            priority
          />
          <h1 className="mt-1 font-serif text-2xl font-semibold text-white tracking-wide">
            Al-Sami Creation&apos;s
          </h1>
          <p className="text-gold-light text-sm mt-1">Order &amp; Customer Management</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-cream rounded-2xl shadow-2xl p-6 space-y-4 border border-gold/30"
        >
          <h2 className="text-lg font-semibold text-maroon-dark mb-1">Login Karein</h2>

          <div>
            <label className="text-xs font-medium text-ink/60 mb-1 block">Email</label>
            <div className="flex items-center gap-2 border border-gold/40 rounded-xl px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-maroon/40">
              <Mail size={18} className="text-maroon/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aap@example.com"
                className="flex-1 outline-none text-sm bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/60 mb-1 block">Password</label>
            <div className="flex items-center gap-2 border border-gold/40 rounded-xl px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-maroon/40">
              <Lock size={18} className="text-maroon/60" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 outline-none text-sm bg-transparent"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            Login
          </button>
        </form>

        <p className="text-center text-gold-light/80 text-xs mt-6">
          Sirf authorized staff ke liye. Naya account admin banata hai.
        </p>
      </div>
    </div>
  );
}
