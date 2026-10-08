"use client";

import { CalendarCheck, ChartColumn, ListChecks, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Šiandien", icon: CalendarCheck },
  { href: "/habits", label: "Įpročiai", icon: ListChecks },
  { href: "/stats", label: "Statistika", icon: ChartColumn },
  { href: "/settings", label: "Nustatymai", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

type Variant = "bottom" | "side";

// The pathname is request data on dynamic routes, so the highlighted state streams in.
function NavLinks({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={<NavList variant={variant} pathname={null} />}>
      <ActiveNavList variant={variant} />
    </Suspense>
  );
}

function ActiveNavList({ variant }: { variant: Variant }) {
  return <NavList variant={variant} pathname={usePathname()} />;
}

function NavList({ variant, pathname }: { variant: Variant; pathname: string | null }) {
  return (
    <ul className={variant === "bottom" ? "mx-auto flex max-w-lg" : "grid gap-1"}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <li key={href} className={variant === "bottom" ? "flex-1" : undefined}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "font-medium transition-colors",
                variant === "bottom"
                  ? "flex h-16 flex-col items-center justify-center gap-1 text-xs"
                  : "flex h-10 items-center gap-3 rounded-lg px-3 text-sm",
                active
                  ? variant === "bottom"
                    ? "text-foreground"
                    : "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                variant === "bottom" && "hover:bg-transparent",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phones and small tablets. */
export function BottomNav() {
  return (
    <nav
      aria-label="Pagrindinė navigacija"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden"
    >
      <NavLinks variant="bottom" />
    </nav>
  );
}

/** Tablets in landscape and desktops. */
export function SideNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar px-3 py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-3">
        <span className="text-2xl" aria-hidden>
          🔥
        </span>
        <span className="text-lg font-semibold tracking-tight">Įpročiai</span>
      </Link>
      <nav aria-label="Pagrindinė navigacija">
        <NavLinks variant="side" />
      </nav>
      <div className="mt-auto px-1">
        <Button asChild className="h-10 w-full">
          <Link href="/habits/new">
            <Plus /> Naujas įprotis
          </Link>
        </Button>
      </div>
    </aside>
  );
}
