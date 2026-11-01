"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertCircle, Eye, Search, FileText, Wrench, Inbox,
} from "lucide-react";
import { InvoiceFormData } from "@/types/invoice";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format, differenceInDays, startOfWeek, startOfMonth,
  eachDayOfInterval, subDays, subWeeks, subMonths, subYears,
} from "date-fns";
import { cn } from "@/lib/utils";

type ChartRange = "daily" | "weekly" | "monthly" | "yearly";
type Invoice = InvoiceFormData & { _id: string; createdAt: string };

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */
function fmtAmount(n: number) {
  if (n >= 1_000_000) return "৳" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "৳" + (n / 1_000).toFixed(1) + "k";
  return "৳" + n.toFixed(0);
}

function fmtFull(n: number) {
  return "৳" + n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ------------------------------------------------------------------ */
/*  Status badge config                                                */
/* ------------------------------------------------------------------ */
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Paid: { label: "Paid", cls: "bg-[#E1F5EE] text-[#085041] ring-[#51B9A9]/20" },
  Unpaid: { label: "Unpaid", cls: "bg-[#EEEDFE] text-[#3C3489] ring-[#5A378F]/20" },
  Hold: { label: "Pending", cls: "bg-[#FFF8E1] text-[#7A5C00] ring-[#E0B400]/20" },
};

/* ------------------------------------------------------------------ */
/*  Cash Flow Chart                                                    */
/* ------------------------------------------------------------------ */
function CashFlowChart({ invoices }: { invoices: Invoice[] }) {
  const [range, setRange] = useState<ChartRange>("monthly");

  const data = useMemo(() => {
    const now = new Date();

    if (range === "daily") {
      return eachDayOfInterval({ start: subDays(now, 6), end: now }).map((day) => {
        const slice = invoices.filter((inv) => {
          const d = new Date(inv.date);
          return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
        });
        return {
          label: format(day, "EEE"),
          paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
          outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
        };
      });
    }

    if (range === "weekly") {
      return Array.from({ length: 8 }, (_, i) => {
        const week = subWeeks(now, 7 - i);
        const start = startOfWeek(week);
        const slice = invoices.filter((inv) => format(startOfWeek(new Date(inv.date)), "yyyy-MM-dd") === format(start, "yyyy-MM-dd"));
        return {
          label: format(start, "dd MMM"),
          paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
          outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
        };
      });
    }

    if (range === "yearly") {
      return Array.from({ length: 5 }, (_, i) => {
        const year = subYears(now, 4 - i);
        const slice = invoices.filter((inv) => new Date(inv.date).getFullYear() === year.getFullYear());
        return {
          label: format(year, "yyyy"),
          paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
          outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
        };
      });
    }

    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const slice = invoices.filter((inv) => {
        const d = new Date(inv.date);
        return d.getMonth() === start.getMonth() && d.getFullYear() === start.getFullYear();
      });
      return {
        label: format(start, "MMM"),
        paid: slice.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
        outstanding: slice.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.total, 0),
      };
    });
  }, [invoices, range]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">Cash Flow</h3>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">Income vs outstanding invoices</p>
        </div>
        {/* Range toggle */}
        <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1">
          {(["daily", "weekly", "monthly", "yearly"] as ChartRange[]).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200",
                range === item
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              )}
              aria-current={range === item ? "true" : undefined}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#51B9A9]" />
          Paid
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5A378F]" />
          Outstanding
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={6}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#64748B", opacity: 0.6, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(90,55,143,0.04)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                    padding: "8px 12px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="paid" name="Paid" fill="#51B9A9" radius={[6, 6, 0, 0]} animationDuration={1000} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#5A378F" radius={[6, 6, 0, 0]} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  label,
  amount,
  count,
  trend,
  up,
  loading,
  accent,
}: {
  label: string;
  amount: number;
  count: number;
  trend: string;
  up: boolean;
  loading: boolean;
  accent: "violet" | "teal" | "amber" | "pink";
}) {
  const accentBar = {
    violet: "bg-[#5A378F]",
    teal: "bg-[#51B9A9]",
    amber: "bg-[#E0B400]",
    pink: "bg-[#EA2B7B]",
  }[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.1)]">
      {/* Accent bar */}
      <span className={cn("absolute left-0 top-0 h-full w-1", accentBar)} aria-hidden="true" />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            up ? "bg-[#E1F5EE] text-[#085041]" : "bg-[#FBEAF0] text-[#72243E]"
          )}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </span>
      </div>

      <div className="mt-3 truncate text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        {loading ? <Skeleton className="h-8 w-28" /> : fmtFull(amount)}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
        <span>{count}</span>
        <span>invoice{count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* ---------- Data fetching (unchanged) ---------- */
  useEffect(() => {
    Promise.all([
      fetch("/api/invoices?type=invoice").then((r) => r.json()),
      fetch("/api/invoices?type=serviceInvoice").then((r) => r.json()),
    ])
      .then(([inv, inv2]) => {
        const combined = [
          ...(Array.isArray(inv) ? inv : []),
          ...(Array.isArray(inv2) ? inv2 : []),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(combined);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Stats (unchanged logic) ---------- */
  const stats = useMemo(() => {
    const now = new Date();
    const paid = invoices.filter((i) => i.status === "Paid");
    const unpaid = invoices.filter((i) => i.status !== "Paid");
    const overdue = invoices.filter((i) => i.status !== "Paid" && new Date(i.dueDate) < now);
    const sum = (arr: Invoice[]) => arr.reduce((s, i) => s + i.total, 0);
    return {
      total: { count: invoices.length, amount: sum(invoices) },
      paid: { count: paid.length, amount: sum(paid) },
      unpaid: { count: unpaid.length, amount: sum(unpaid) },
      overdue: { count: overdue.length, amount: sum(overdue) },
    };
  }, [invoices]);

  /* ---------- Overdue list (unchanged logic) ---------- */
  const overdueList = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((i) => i.status !== "Paid" && new Date(i.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8);
  }, [invoices]);

  /* ---------- Filter (unchanged logic) ---------- */
  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.to.name.toLowerCase().includes(q) ||
        (i.to.email ?? "").toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const statCards = [
    { label: "Total Invoices", amount: stats.total.amount, count: stats.total.count, trend: "+17%", up: true, accent: "violet" as const },
    { label: "Paid", amount: stats.paid.amount, count: stats.paid.count, trend: "+32%", up: true, accent: "teal" as const },
    { label: "Unpaid", amount: stats.unpaid.amount, count: stats.unpaid.count, trend: "-17%", up: false, accent: "amber" as const },
    { label: "Overdue", amount: stats.overdue.amount, count: stats.overdue.count, trend: "+5%", up: false, accent: "pink" as const },
  ];

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>Overview</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-600">Dashboard</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 md:text-base">
          Welcome back, <span className="font-semibold text-slate-700">{session?.user?.name ?? "there"}</span>! Here&apos;s what&apos;s happening with your billing today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Cash Flow + Overdue */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Cash Flow */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
          {loading ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-56 rounded-xl" />
              </div>
              <div className="mb-4 flex items-center gap-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex h-[280px] items-end gap-3 pt-4">
                {[65, 40, 80, 55, 90, 45].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          ) : (
            <CashFlowChart invoices={invoices} />
          )}
        </div>

        {/* Overdue */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
          <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
                Overdue Invoices
              </h3>
              <p className="mt-0.5 text-xs text-slate-400 md:text-sm">Past their due date</p>
            </div>
            {stats.overdue.count > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEAF0] px-2.5 py-1 text-xs font-bold text-[#72243E] ring-1 ring-inset ring-[#EA2B7B]/20">
                <AlertCircle className="h-3.5 w-3.5" />
                {stats.overdue.count} overdue
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-slate-100">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="ml-4 h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : overdueList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E1F5EE] text-[#51B9A9]">
                  <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400">No overdue invoices right now.</p>
              </div>
            ) : (
              <div className="max-h-[340px] divide-y divide-slate-100 overflow-y-auto [scrollbar-width:thin]">
                {overdueList.map((inv) => {
                  const days = differenceInDays(new Date(), new Date(inv.dueDate));
                  const badge = STATUS_BADGE[inv.status] ?? STATUS_BADGE.Unpaid;
                  const typeIcon = inv.type === "serviceInvoice" ? Wrench : FileText;
                  const typeIconClass = inv.type === "serviceInvoice"
                    ? "bg-[#51B9A9]/10 text-[#0E8A7C]"
                    : "bg-[#5A378F]/10 text-[#5A378F]";
                  const TypeIcon = typeIcon;
                  return (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                            <span className={cn("flex h-5 w-5 items-center justify-center rounded", typeIconClass)}>
                              <TypeIcon className="h-3 w-3" aria-hidden="true" />
                            </span>
                            {inv.invoiceNumber}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-[#FBEAF0] px-1.5 py-0.5 text-[11px] font-semibold text-[#72243E]">
                            {days}d overdue
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                              badge.cls
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{inv.to.name}</span>
                          <span className="mx-1">·</span>
                          due {format(new Date(inv.dueDate), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-[#0E8A7C]">{fmtFull(inv.total)}</span>
                        <Link href={`/dashboard/${inv.type === "serviceInvoice" ? "service-invoices" : "invoices"}/${inv._id}`}>
                          <button
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                            aria-label={`View ${inv.invoiceNumber}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {overdueList.length > 0 && (
            <div className="shrink-0 border-t border-slate-100 px-5 py-3">
              <Link
                href="/dashboard/invoices"
                className="text-xs font-semibold text-[#51B9A9] transition-colors hover:text-[#0E8A7C] md:text-sm"
              >
                View all invoices →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* All Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
              All Invoices
            </h3>
            <p className="mt-0.5 text-xs text-slate-400 md:text-sm">Complete invoice history</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-48 rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all",
                  "focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20"
                )}
                aria-label="Search invoices"
              />
            </div>
            <Link
              href="/dashboard/invoices"
              className="whitespace-nowrap text-xs font-semibold text-[#51B9A9] transition-colors hover:text-[#0E8A7C] md:text-sm"
            >
              All Invoices →
            </Link>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          {loading ? (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  {["Invoice ID", "Type", "Client", "Date", "Due Date", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 first:pl-5">
                      {h}
                    </th>
                  ))}
                  <th className="w-16 py-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td className="py-3.5 pl-5 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-3.5 pl-4 pr-5"><Skeleton className="ml-auto h-7 w-7 rounded-md" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">No invoices found</p>
                <p className="mt-1 text-xs text-slate-400">
                  {search ? "Try adjusting your search." : "Create your first invoice to get started."}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  {["Invoice ID", "Type", "Client", "Date", "Due Date", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 first:pl-5">
                      {h}
                    </th>
                  ))}
                  <th className="w-16 py-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const badge = STATUS_BADGE[inv.status] ?? {
                    label: inv.status,
                    cls: "bg-slate-100 text-slate-600 ring-slate-200",
                  };
                  const now = new Date();
                  const isOverdue = inv.status !== "Paid" && new Date(inv.dueDate) < now;
                  const isService = inv.type === "serviceInvoice";
                  const typeIconClass = isService
                    ? "bg-[#51B9A9]/10 text-[#0E8A7C]"
                    : "bg-[#5A378F]/10 text-[#5A378F]";
                  const TypeIcon = isService ? Wrench : FileText;
                  return (
                    <tr key={inv._id} className="transition-colors hover:bg-slate-50/70">
                      {/* Invoice ID */}
                      <td className="py-3.5 pl-5 pr-4">
                        <Link
                          href={`/dashboard/${isService ? "service-invoices" : "invoices"}/${inv._id}`}
                          className="inline-flex items-center gap-2 font-semibold text-slate-900 transition-colors hover:text-[#5A378F]"
                        >
                          <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", typeIconClass)}>
                            <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                            isService
                              ? "bg-[#E1F5EE] text-[#085041] ring-[#51B9A9]/20"
                              : "bg-[#EEEDFE] text-[#3C3489] ring-[#5A378F]/20"
                          )}
                        >
                          {isService ? "Service" : "Invoice"}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3.5 text-slate-700">{inv.to.name}</td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {format(new Date(inv.date), "dd MMM yyyy")}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5">
                        <span className={cn("text-sm", isOverdue ? "font-semibold text-[#993556]" : "text-slate-500")}>
                          {format(new Date(inv.dueDate), "dd MMM yyyy")}
                          {isOverdue && (
                            <span className="ml-1 text-xs text-[#EA2B7B]">
                              · {differenceInDays(now, new Date(inv.dueDate))}d
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 font-semibold text-[#0E8A7C]">{fmtFull(inv.total)}</td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                            badge.cls
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-4 pr-5">
                        <Link href={`/dashboard/${isService ? "service-invoices" : "invoices"}/${inv._id}`}>
                          <button
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                            aria-label={`View ${inv.invoiceNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-500 md:text-sm">
            <span>
              <span className="font-semibold text-slate-700">{filtered.length}</span> invoice
              {filtered.length !== 1 ? "s" : ""}
              {search && invoices.length !== filtered.length && (
                <span className="ml-1 text-slate-400">of {invoices.length} total</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}