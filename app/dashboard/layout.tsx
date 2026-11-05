"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
  MessageSquare,
  UserCircle,
  ContactRound,
  ReceiptText,
  Trash2,
  Plus,
  Bell,
  Search,
  X,
  ChevronsUpDown,
  Building2,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Navigation config — unchanged items, grouped for clearer hierarchy */
/* ------------------------------------------------------------------ */
type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
    ],
  },
  {
    label: "Billing",
    items: [
      { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
      { name: "Service Invoices", href: "/dashboard/service-invoices", icon: FileText },
      { name: "Quotations", href: "/dashboard/quotations", icon: FileText },
      { name: "Receipts", href: "/dashboard/receipts", icon: ReceiptText },
    ],
  },
  {
    label: "Manage",
    items: [
      { name: "Clients", href: "/dashboard/clients", icon: ContactRound },
      { name: "Companies", href: "/dashboard/companies", icon: Building2 },
      { name: "Bank Accounts", href: "/dashboard/bank-accounts", icon: Landmark },
      { name: "Users", href: "/dashboard/users", icon: Users },
      { name: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
      { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page title resolver — derived from pathname for context-aware header */
/* ------------------------------------------------------------------ */
function getActiveTitle(pathname: string): string {
  const all = navSections.flatMap((s) => s.items);
  const match = all
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!match) return "Dashboard";

  if (match.href === "/dashboard/invoices" && pathname.endsWith("/create"))
    return "New Invoice";
  if (pathname !== match.href && pathname.startsWith(match.href + "/")) {
    const sub = pathname.split(match.href + "/")[1]?.split("/")[0];
    if (sub) {
      return `${match.name} / ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
    }
  }
  return match.name;
}

/* ------------------------------------------------------------------ */
/*  Single nav link — accessible, with active rail + bg, refined hover */
/* ------------------------------------------------------------------ */
function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#51B9A9]/60 focus-visible:ring-offset-0",
        isActive
          ? "bg-white/[0.07] text-white"
          : "text-white/55 hover:bg-white/[0.04] hover:text-white/90"
      )}
    >
      {/* Active rail */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200",
          isActive ? "bg-[#51B9A9] opacity-100" : "bg-transparent opacity-0"
        )}
      />
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
          isActive
            ? "bg-[#5A378F]/40 text-[#51B9A9]"
            : "bg-transparent text-[#7F77DD] group-hover:text-[#A09CE8]"
        )}
      >
        <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar body — shared between desktop rail and mobile sheet         */
/* ------------------------------------------------------------------ */
function SidebarContent({
  pathname,
  setSidebarOpen,
}: {
  pathname: string;
  setSidebarOpen: (v: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#15152b] text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6A45BF] to-[#4A2D7A] shadow-[0_4px_12px_-2px_rgba(90,55,143,0.5)]">
          <Plus className="h-4 w-4 rotate-45 text-white" aria-hidden="true" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#15152b] bg-[#51B9A9]" />
        </div>
        <div className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">
            Jamroll
          </span>
          <span className="block text-[11px] font-medium text-white/35">
            Billing Suite
          </span>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:thin]">
        <nav aria-label="Main" className="space-y-5 pb-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.name !== "Dashboard" &&
                      pathname.startsWith(item.href + "/"));
                  return (
                    <li key={item.name}>
                      <NavLink
                        item={item}
                        isActive={isActive}
                        onClick={() => setSidebarOpen(false)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Upgrade / status card */}
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#51B9A9] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#51B9A9]" />
            </span>
            <span className="text-xs font-medium text-white/80">
              All systems operational
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
            Synced just now. Last backup 2h ago.
          </p>
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-white/5 px-3 py-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            "text-[#9E97E2] hover:bg-[#EA2B7B]/10 hover:text-[#EA2B7B]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/40"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton for the user chip while session loads                     */
/* ------------------------------------------------------------------ */
function UserChipSkeleton() {
  return (
    <div className="flex items-center gap-3 pl-4">
      <div className="hidden text-right sm:block">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-1 h-3 w-16 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-9 w-9 animate-pulse rounded-full bg-[#5A378F]/30" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top bar                                                             */
/* ------------------------------------------------------------------ */
function TopBar({
  setSidebarOpen,
  title,
  session,
  status,
}: {
  setSidebarOpen: (v: boolean) => void;
  title: string;
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
}) {
  const initials = (session?.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl md:px-8">
      {/* Left — menu + title */}
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 text-slate-500 md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {session?.user?.role && (
            <span className="hidden shrink-0 items-center rounded-full border border-[#AFA9EC]/40 bg-[#EEEDFE] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#3C3489] md:inline-flex">
              {session.user.role}
            </span>
          )}
        </div>
      </div>

      {/* Right — search + bell + user */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search (decorative; wire to your own search later) */}
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-sm text-slate-400 transition-colors focus-within:border-[#5A378F]/40 focus-within:bg-white lg:flex">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search invoices, clients…"
            className="w-44 bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none xl:w-56"
            aria-label="Search"
          />
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/40"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-[#EA2B7B]" />
        </button>

        {/* User */}
        {status === "loading" ? (
          <UserChipSkeleton />
        ) : (
          <div className="flex items-center gap-3 border-l border-slate-100 pl-3 md:pl-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-900">
                {session?.user?.name || "User"}
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-[#51B9A9] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#51B9A9]" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#51B9A9]">
                  Active now
                </p>
              </div>
            </div>
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#6A45BF] to-[#4A2D7A] ring-2 ring-white">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                  {initials}
                </span>
              )}
            </div>
            <ChevronsUpDown
              className="hidden h-4 w-4 text-slate-400 md:block"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Root layout                                                         */
/* ------------------------------------------------------------------ */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sheet on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when sheet open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const title = getActiveTitle(pathname);

  return (
    <div className="flex h-screen flex-col bg-[#F4F5F7] font-sans text-slate-900 antialiased md:flex-row">
      {/* Mobile sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[280px] border-none p-0"
          aria-label="Navigation"
        >
          {/* Visually-hidden title for a11y (Sheet requires it) */}
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
          {/* Close button overlay for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 md:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          setSidebarOpen={setSidebarOpen}
          title={title}
          session={session}
          status={status}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Floating action button — new invoice (kept) */}
      <Link
        href="/dashboard/invoices/create"
        className="group fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-[#5A378F] py-3 pl-3 pr-1 text-white shadow-[0_8px_24px_-6px_rgba(90,55,143,0.6)] transition-all duration-200 hover:bg-[#4a2d7a] hover:pr-5 hover:shadow-[0_10px_30px_-6px_rgba(90,55,143,0.7)] active:scale-95 md:inline-flex"
        aria-label="Create new invoice"
      >
        <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" aria-hidden="true" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover:max-w-[120px] group-hover:opacity-100">
          New Invoice
        </span>
      </Link>
    </div>
  );
}