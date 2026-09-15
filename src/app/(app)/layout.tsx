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
      <div className="min-h-screen flex items-center justify-center bg-cream">
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
    <div className="flex flex-col min-h-screen">
      {isRoot && (
        <header className="sticky top-0 z-30 bg-maroon text-white shadow-md">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 w-full">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Al-Sami"
                width={34}
                height={34}
                className="rounded-full bg-white/90 p-0.5"
              />
              <span className="font-serif font-semibold text-lg tracking-wide">Al-Sami Creation&apos;s</span>
            </div>
            <div className="flex items-center gap-1">
              {profile?.role === "admin" && (
                <Link
                  href="/users"
                  title="Users"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <UserCog size={20} />
                </Link>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                title="Logout"
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 w-full pb-20">{children}</main>

      {isRoot && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gold/30 safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex w-full sm:max-w-md sm:mx-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                    active ? "text-maroon" : "text-ink/40"
                  )}
                >
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
