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
    <div className="min-h-screen flex flex-col items-center justify-center bg-maroon-dark px-6 py-12">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.png"
            alt="Al-Sami Creation's"
            width={180}
            height={180}
            className="w-40 h-auto sm:w-44"
            priority
          />
          <h1 className="mt-3 font-serif text-2xl font-semibold text-white tracking-wide">
            Al-Sami Creation&apos;s
          </h1>
          <p className="text-gold-light/90 text-xs mt-1 tracking-wide uppercase">
            Order &amp; Customer Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-7 space-y-5">
          <div>
            <label className="text-xs font-medium text-ink/50 mb-1.5 block">Email</label>
            <div className="flex items-center gap-2.5 border border-ink/10 rounded-xl px-3.5 py-3 bg-cream/60 focus-within:border-maroon focus-within:bg-white transition-colors">
              <Mail size={17} className="text-maroon/50 flex-shrink-0" />
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
            <label className="text-xs font-medium text-ink/50 mb-1.5 block">Password</label>
            <div className="flex items-center gap-2.5 border border-ink/10 rounded-xl px-3.5 py-3 bg-cream/60 focus-within:border-maroon focus-within:bg-white transition-colors">
              <Lock size={17} className="text-maroon/50 flex-shrink-0" />
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
            className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white font-medium rounded-xl py-3.5 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            Login
          </button>
        </form>

        <p className="text-center text-white/50 text-xs mt-7">
          Sirf authorized staff ke liye. Naya account admin banata hai.
        </p>
      </div>
    </div>
  );
}
