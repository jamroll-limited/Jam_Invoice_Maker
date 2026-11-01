"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus, Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, Eye, Edit, Trash2, ChevronDown, Wrench, Inbox,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvoiceFormData } from "@/types/invoice";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { cn } from "@/lib/utils";

type Invoice = InvoiceFormData & { _id: string; createdAt: string };
type SortField = "invoiceNumber" | "clientName" | "date" | "total";
type SortDir = "asc" | "desc";
type TabFilter = "all" | "Unpaid" | "Paid" | "Hold" | "Cancelled";

/* ------------------------------------------------------------------ */
/*  Status visual config                                               */
/* ------------------------------------------------------------------ */
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  Paid: { label: "Paid", className: "bg-[#E1F5EE] text-[#085041] ring-[#51B9A9]/20" },
  Unpaid: { label: "Due", className: "bg-[#EEEDFE] text-[#3C3489] ring-[#5A378F]/20" },
  Hold: { label: "Hold", className: "bg-[#FFF8E1] text-[#7A5C00] ring-[#E0B400]/20" },
  Cancelled: { label: "Cancelled", className: "bg-[#FBEAF0] text-[#72243E] ring-[#EA2B7B]/20" },
};

const SELECT_CLASS: Record<string, string> = {
  Paid: "bg-[#E1F5EE] text-[#085041]",
  Unpaid: "bg-[#EEEDFE] text-[#3C3489]",
  Hold: "bg-[#EEEDFE] text-[#3C3489]",
  Cancelled: "bg-[#FBEAF0] text-[#72243E]",
};

const TAB_BADGE: Record<string, string> = {
  Unpaid: "bg-[#EEEDFE] text-[#3C3489]",
  Paid: "bg-[#E1F5EE] text-[#085041]",
  Hold: "bg-[#FFF8E1] text-[#7A5C00]",
  Cancelled: "bg-[#FBEAF0] text-[#72243E]",
};

/* ------------------------------------------------------------------ */
/*  3-dot Row Menu                                                     */
/* ------------------------------------------------------------------ */
function RowMenu({
  onDraft,
  onDelete,
  isDeleting,
  openUp = true,
}: {
  onDraft: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  openUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)]",
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          <button
            role="menuitem"
            onClick={() => { onDraft(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Edit className="h-3.5 w-3.5 text-slate-500" />
            Mark as Hold
          </button>
          <div className="my-1 h-px bg-slate-100" />
          <button
            role="menuitem"
            onClick={() => { onDelete(); setOpen(false); }}
            disabled={isDeleting}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-[#72243E] transition-colors hover:bg-[#FBEAF0] disabled:opacity-50"
          >
            {isDeleting ? (
              <Spinner className="h-3.5 w-3.5 text-[#EA2B7B]" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort button                                                        */
/* ------------------------------------------------------------------ */
function SortBtn({
  field,
  active,
  dir,
  onClick,
}: {
  field: SortField;
  active: SortField;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon = active !== field ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      className="ml-1 rounded p-0.5 text-slate-300 transition-colors hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
      aria-label={`Sort by ${field}, ${active === field ? dir : "inactive"}`}
    >
      <Icon className={cn("h-3 w-3", active === field && "text-[#5A378F]")} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function ServiceInvoicesPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  /* ---------- Data fetching (unchanged) ---------- */
  useEffect(() => {
    fetch("/api/invoices?type=serviceInvoice")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Status change (unchanged logic) ---------- */
  const handleStatusChange = async (id: string, status: string) => {
    setInvoices((prev) => prev.map((i) => (i._id === id ? { ...i, status: status as any } : i)));
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) toast.error("Failed to update status");
    } catch {
      toast.error("An error occurred");
    }
  };

  /* ---------- Delete (unchanged logic) ---------- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i._id !== id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDeleteTarget(null);
        toast.success("Invoice moved to trash");
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Derived (unchanged) ---------- */
  const tabCounts = useMemo(
    () => ({
      all: invoices.length,
      Unpaid: invoices.filter((i) => i.status === "Unpaid").length,
      Paid: invoices.filter((i) => i.status === "Paid").length,
      Hold: invoices.filter((i) => i.status === "Hold").length,
      Cancelled: invoices.filter((i) => i.status === "Cancelled").length,
    }),
    [invoices]
  );

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (activeTab !== "all") list = list.filter((i) => i.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.to.name.toLowerCase().includes(q) ||
          (i.to.email ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === "clientName") { va = a.to.name; vb = b.to.name; }
      else if (sortField === "date") { va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); }
      else if (sortField === "total") { va = a.total; vb = b.total; }
      else { va = a.invoiceNumber; vb = b.invoiceNumber; }
      if (typeof va === "string")
        return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
    return list;
  }, [invoices, activeTab, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((i) => i._id)));

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Unpaid", label: "Due" },
    { key: "Paid", label: "Paid" },
    { key: "Hold", label: "Hold" },
    { key: "Cancelled", label: "Cancelled" },
  ];

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.invoiceNumber}
        itemLabel="invoice"
        onConfirm={handleDelete}
        isDeleting={!!deletingId}
      />

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>Billing</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600">Service Invoices</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Service Invoices
          </h1>
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            Manage and track all your service-based invoices in one place.
          </p>
        </div>
        {isSuperAdmin && (
          <Button asChild className="gap-2 self-start rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a] sm:self-auto">
            <Link href="/dashboard/service-invoices/create">
              <Plus className="h-4 w-4" />
              New Service Invoice
            </Link>
          </Button>
        )}
      </div>

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        {/* Toolbar: tabs + search */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const count = tabCounts[tab.key];
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.label}
                  {tab.key !== "all" && count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                        isActive ? "bg-[#5A378F] text-white" : TAB_BADGE[tab.key]
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices, clients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-56 rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all",
                  "focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20"
                )}
              />
            </div>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors",
                "hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          {loading ? (
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  {["", "Invoice ID", "Client", "Email", "Date", "Amount", "Status", ""].map((h, i) => (
                    <th key={i} className="px-3 py-3 first:pl-5 last:pr-5 text-left">
                      {h && <Skeleton className="h-3 w-16" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["w-4", "w-20", "w-28", "w-32", "w-20", "w-16", "w-14", "w-16"],
                  ["w-4", "w-24", "w-24", "w-36", "w-20", "w-16", "w-16", "w-16"],
                  ["w-4", "w-20", "w-32", "w-28", "w-20", "w-12", "w-14", "w-16"],
                  ["w-4", "w-24", "w-20", "w-32", "w-20", "w-16", "w-16", "w-16"],
                  ["w-4", "w-20", "w-28", "w-24", "w-20", "w-14", "w-14", "w-16"],
                  ["w-4", "w-24", "w-24", "w-36", "w-20", "w-16", "w-16", "w-16"],
                ].map((widths, ri) => (
                  <tr key={ri}>
                    {widths.map((w, ci) => (
                      <td key={ci} className="px-3 py-4 first:pl-5 last:pr-5">
                        <Skeleton className={cn("h-4", w)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">No service invoices found</p>
                <p className="mt-1 text-xs text-slate-400">
                  {search ? "Try adjusting your search or filters." : "Create your first service invoice to get started."}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50/50">
                  <th className="w-10 py-3 pl-5 pr-3 text-left">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#5A378F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                      aria-label="Select all rows"
                    />
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Invoice ID
                      <SortBtn field="invoiceNumber" active={sortField} dir={sortDir} onClick={() => handleSort("invoiceNumber")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Client
                      <SortBtn field="clientName" active={sortField} dir={sortDir} onClick={() => handleSort("clientName")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Date
                      <SortBtn field="date" active={sortField} dir={sortDir} onClick={() => handleSort("date")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <div className="flex items-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Amount
                      <SortBtn field="total" active={sortField} dir={sortDir} onClick={() => handleSort("total")} />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Status
                  </th>
                  <th className="min-w-[140px] py-3 pl-3 pr-5 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv, index) => {
                  const badge = STATUS_BADGE[inv.status] ?? {
                    label: inv.status,
                    className: "bg-slate-100 text-slate-600 ring-slate-200",
                  };
                  return (
                    <tr
                      key={inv._id}
                      className={cn(
                        "group relative transition-colors hover:bg-slate-50/70",
                        selected.has(inv._id) && "bg-[#EEEDFE]/30"
                      )}
                    >
                      {/* Selection */}
                      <td className="py-3.5 pl-5 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.has(inv._id)}
                          onChange={() => toggleSelect(inv._id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#5A378F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                          aria-label={`Select invoice ${inv.invoiceNumber}`}
                        />
                      </td>

                      {/* Invoice ID */}
                      <td className="px-3 py-3.5">
                        <Link
                          href={`/dashboard/service-invoices/${inv._id}`}
                          className="inline-flex items-center gap-2 font-semibold text-slate-900 transition-colors hover:text-[#5A378F]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#51B9A9]/10 text-[#0E8A7C]">
                            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      {/* Client */}
                      <td className="px-3 py-3.5 text-slate-700">{inv.to.name}</td>

                      {/* Email */}
                      <td className="px-3 py-3.5 text-slate-400">
                        {inv.to.email ? (
                          <span className="font-mono text-xs">@{inv.to.email}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3.5 text-slate-600">
                        {format(new Date(inv.date), "dd MMM, yyyy")}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3.5 font-semibold text-[#0E8A7C]">
                        ৳{inv.total.toLocaleString("en-BD")}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        {isSuperAdmin ? (
                          <div className="relative inline-block">
                            {(() => {
                              const style = SELECT_CLASS[inv.status] ?? "bg-slate-100 text-slate-600";
                              const textColor =
                                style.split(" ").find((c) => c.startsWith("text-")) || "text-slate-600";
                              return (
                                <>
                                  <select
                                    value={inv.status}
                                    onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                                    className={cn(
                                      "cursor-pointer appearance-none rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5A378F]/30",
                                      style
                                    )}
                                    aria-label={`Change status of ${inv.invoiceNumber}`}
                                  >
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Due</option>
                                    <option value="Hold">Hold</option>
                                    <option value="Cancelled">Cancel</option>
                                  </select>
                                  <ChevronDown
                                    size={12}
                                    className={cn(
                                      "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2",
                                      textColor
                                    )}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-5">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link href={`/dashboard/service-invoices/${inv._id}`}>
                            <button
                              title="Preview"
                              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {isSuperAdmin && (
                            <Link href={`/dashboard/service-invoices/${inv._id}/edit`}>
                              <button
                                title="Edit"
                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                          )}
                          {isSuperAdmin && (
                            <RowMenu
                              onDraft={() => handleStatusChange(inv._id, "Hold")}
                              onDelete={() => setDeleteTarget(inv)}
                              isDeleting={deletingId === inv._id}
                              openUp={index !== 0}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-500 md:text-sm">
            <span>
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-700">{invoices.length}</span> invoice
              {invoices.length !== 1 ? "s" : ""}
            </span>
            {selected.size > 0 && (
              <span className="font-semibold text-[#5A378F]">{selected.size} selected</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}