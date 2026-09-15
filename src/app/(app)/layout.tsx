"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Users, Shirt, BarChart3, LogOut, UserCog, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/customers", label: "Grahak", icon: Users },
  { href: "/articles", label: "Kapray", icon: Shirt },
  { href: "/hisaab", label: "Hisaab", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-gradient">
        <Loader2 className="animate-spin text-maroon" size={28} />
      </div>
    );
  }

  const isRoot = NAV.some((n) => pathname === n.href);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-page-gradient">
      {isRoot && (
        <header className="sticky top-0 z-30 bg-maroon-gradient text-white shadow-[0_2px_16px_rgba(122,18,55,0.25)]">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden p-1">
                <Image
                  src="/logo-mark.png"
                  alt="Al-Sami"
                  width={359}
                  height={261}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="font-serif font-semibold text-lg tracking-wide">Al-Sami Creation&apos;s</span>
            </div>
            <div className="flex items-center gap-1">
              {profile?.role === "admin" && (
                <Link
                  href="/users"
                  title="Users"
                  className="p-2 rounded-full hover:bg-white/15 active:bg-white/20 transition-colors"
                >
                  <UserCog size={20} />
                </Link>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                title="Logout"
                className="p-2 rounded-full hover:bg-white/15 active:bg-white/20 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="h-[3px] w-full bg-gradient-to-r from-gold-dark via-gold to-gold-light opacity-80" />
        </header>
      )}

      <main className="flex-1 w-full pb-20">{children}</main>

      {isRoot && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gold/25 safe-bottom shadow-[0_-4px_18px_rgba(122,18,55,0.08)]">
          <div className="flex w-full sm:max-w-md sm:mx-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                    active ? "text-maroon-dark" : "text-ink/40"
                  )}
                >
                  {active && (
                    <span className="absolute top-0 h-[3px] w-8 rounded-full bg-gradient-to-r from-gold-dark to-gold" />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
