"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Trash2, RotateCcw, FileText, ContactRound, AlertTriangle,
  Wrench, FileCheck, ReceiptText, Inbox, Lock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TrashInvoice = {
  _id: string;
  invoiceNumber: string;
  name: string;
  type: "invoice" | "serviceInvoice" | "quotation" | "receipt";
  to: { name: string };
  total: number;
  deletedAt: string;
};

type TrashClient = {
  _id: string;
  name: string;
  companyName?: string;
  email?: string;
  deletedAt: string;
};

type TabKey = "all" | "invoice" | "serviceInvoice" | "receipt" | "quotation" | "client";

/* ------------------------------------------------------------------ */
/*  Type config — label + colored chip                                 */
/* ------------------------------------------------------------------ */
const TYPE_LABEL: Record<string, string> = {
  invoice: "Invoice",
  serviceInvoice: "Service Invoice",
  quotation: "Quotation",
  receipt: "Receipt",
  client: "Client",
};

const TYPE_BADGE: Record<string, string> = {
  invoice: "bg-[#EEEDFE] text-[#3C3489] ring-[#5A378F]/20",
  serviceInvoice: "bg-[#E1F5EE] text-[#085041] ring-[#51B9A9]/20",
  quotation: "bg-[#FBEAF0] text-[#72243E] ring-[#EA2B7B]/20",
  receipt: "bg-[#FFF8E1] text-[#7A5C00] ring-[#E0B400]/20",
  client: "bg-[#EEEDFE] text-[#3C3489] ring-[#5A378F]/20",
};

// Icon chip colors — matches the billing list pages
const TYPE_ICON: Record<string, { Icon: React.ComponentType<{ className?: string }>; className: string }> = {
  invoice: { Icon: FileText, className: "bg-[#5A378F]/10 text-[#5A378F]" },
  serviceInvoice: { Icon: Wrench, className: "bg-[#51B9A9]/10 text-[#0E8A7C]" },
  quotation: { Icon: FileCheck, className: "bg-[#EA2B7B]/10 text-[#EA2B7B]" },
  receipt: { Icon: ReceiptText, className: "bg-[#E0B400]/10 text-[#7A5C00]" },
  client: { Icon: ContactRound, className: "bg-[#5A378F]/10 text-[#5A378F]" },
};

/* ------------------------------------------------------------------ */
/*  Purge modal — polished warning dialog                              */
/* ------------------------------------------------------------------ */
function PurgeModal({
  open,
  onOpenChange,
  itemName,
  itemLabel,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemName?: string;
  itemLabel?: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBEAF0]">
              <AlertTriangle className="h-5 w-5 text-[#EA2B7B]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-slate-900">
                Delete Permanently
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-500">
                {itemName ? (
                  <>
                    {itemLabel && <span className="text-slate-500">{itemLabel} </span>}
                    <span className="font-semibold text-slate-900">&ldquo;{itemName}&rdquo;</span> will be permanently deleted and{" "}
                  </>
                ) : (
                  <>
                    All {itemLabel ? `${itemLabel}s` : "items"} in trash will be permanently deleted and{" "}
                  </>
                )}
                <span className="font-semibold text-[#EA2B7B]">cannot be recovered.</span>{" "}
                Are you sure?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-lg border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2 rounded-lg bg-[#EA2B7B] text-white shadow-[0_2px_8px_-2px_rgba(234,43,123,0.5)] hover:bg-[#c4215f]"
          >
            {isDeleting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Deleting…" : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Restore button — consistent styling                                */
/* ------------------------------------------------------------------ */
function RestoreButton({
  onClick,
  disabled,
  isLoading,
}: {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-1.5 rounded-lg border-[#51B9A9]/30 text-[#085041] transition-all",
        "hover:border-[#51B9A9]/50 hover:bg-[#E1F5EE] hover:text-[#085041]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#51B9A9]/30"
      )}
    >
      {isLoading ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" />
      )}
      Restore
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Purge icon button                                                  */
/* ------------------------------------------------------------------ */
function PurgeButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md p-1.5 text-slate-400 transition-colors",
        "hover:bg-[#FBEAF0] hover:text-[#EA2B7B]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30",
        "disabled:opacity-40"
      )}
      title="Delete forever"
      aria-label="Delete forever"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function TrashPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [invoices, setInvoices] = useState<TrashInvoice[]>([]);
  const [clients, setClients] = useState<TrashClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<{ id: string; name: string; kind: "invoice" | "client"; type?: string } | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  /* ---------- Load (unchanged logic) ---------- */
  const load = () => {
    setLoading(true);
    fetch("/api/trash")
      .then((r) => r.json())
      .then((data) => {
        if (data.invoices) setInvoices(data.invoices);
        if (data.clients) setClients(data.clients);
      })
      .catch(() => toast.error("Failed to load trash"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- Restore (unchanged logic) ---------- */
  const handleRestore = async (id: string, kind: "invoice" | "client") => {
    setRestoringId(id);
    try {
      const url = kind === "invoice" ? `/api/invoices/${id}` : `/api/clients/${id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: false, deletedAt: null }),
      });
      if (res.ok) {
        if (kind === "invoice") setInvoices((p) => p.filter((i) => i._id !== id));
        else setClients((p) => p.filter((c) => c._id !== id));
        toast.success("Item restored successfully");
      } else {
        toast.error("Failed to restore");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setRestoringId(null);
    }
  };

  /* ---------- Purge (unchanged logic) ---------- */
  const handlePurge = async () => {
    if (!purgeTarget) return;
    setIsPurging(true);
    try {
      const { id, kind } = purgeTarget;
      const url = kind === "invoice"
        ? `/api/invoices/${id}?permanent=true`
        : `/api/clients/${id}?permanent=true`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        if (kind === "invoice") setInvoices((p) => p.filter((i) => i._id !== id));
        else setClients((p) => p.filter((c) => c._id !== id));
        setPurgeTarget(null);
        toast.success("Permanently deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsPurging(false);
    }
  };

  /* ---------- Empty trash (unchanged logic) ---------- */
  const handleEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      await Promise.all([
        ...invoices.map((i) => fetch(`/api/invoices/${i._id}?permanent=true`, { method: "DELETE" })),
        ...clients.map((c) => fetch(`/api/clients/${c._id}?permanent=true`, { method: "DELETE" })),
      ]);
      setInvoices([]);
      setClients([]);
      setEmptyConfirm(false);
      toast.success("Trash emptied");
    } catch {
      toast.error("Failed to empty trash");
    } finally {
      setIsEmptying(false);
    }
  };

  /* ---------- Derived (unchanged logic) ---------- */
  const filteredInvoices = useMemo(() => {
    if (activeTab === "all" || activeTab === "client") return invoices;
    return invoices.filter((i) => i.type === activeTab);
  }, [invoices, activeTab]);

  const filteredClients = useMemo(() => {
    if (activeTab === "all" || activeTab === "client") return clients;
    return [];
  }, [clients, activeTab]);

  const totalCount = invoices.length + clients.length;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "invoice", label: "Invoices" },
    { key: "serviceInvoice", label: "Service Invoices" },
    { key: "receipt", label: "Receipts" },
    { key: "quotation", label: "Quotations" },
    { key: "client", label: "Clients" },
  ];

  const tabCount = (key: TabKey) => {
    if (key === "all") return totalCount;
    if (key === "client") return clients.length;
    return invoices.filter((i) => i.type === key).length;
  };

  /* ---------- Access control (preserved) ---------- */
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Access restricted</p>
          <p className="mt-1 text-xs text-slate-400">
            Only Super Admins can access the Trash. Contact a Super Admin if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      <PurgeModal
        open={!!purgeTarget}
        onOpenChange={(v) => { if (!v) setPurgeTarget(null); }}
        itemName={purgeTarget?.name}
        itemLabel={purgeTarget?.type ? TYPE_LABEL[purgeTarget.type] : purgeTarget?.kind}
        onConfirm={handlePurge}
        isDeleting={isPurging}
      />

      <PurgeModal
        open={emptyConfirm}
        onOpenChange={setEmptyConfirm}
        itemName={undefined}
        itemLabel="item"
        onConfirm={handleEmptyTrash}
        isDeleting={isEmptying}
      />

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>Manage</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600">Trash</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Trash
          </h1>
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            Items here have been moved to trash. Restore them or permanently delete them.
          </p>
        </div>
        {totalCount > 0 && (
          <Button
            variant="outline"
            onClick={() => setEmptyConfirm(true)}
            className={cn(
              "self-start gap-2 rounded-lg border-[#EA2B7B]/30 text-[#72243E] transition-all",
              "hover:border-[#EA2B7B]/50 hover:bg-[#FBEAF0] hover:text-[#72243E] sm:self-auto"
            )}
          >
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </Button>
        )}
      </div>

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-4 py-3">
          {tabs.map((tab) => {
            const count = tabCount(tab.key);
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
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      isActive ? "bg-[#5A378F] text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredInvoices.length === 0 && filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Trash is empty</p>
              <p className="mt-1 text-xs text-slate-400">
                {activeTab === "all"
                  ? "Deleted items will appear here for recovery."
                  : `No deleted ${TYPE_LABEL[activeTab]?.toLowerCase() ?? "items"} found.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Invoice rows */}
            {filteredInvoices.map((item) => {
              const iconCfg = TYPE_ICON[item.type] ?? TYPE_ICON.invoice;
              const Icon = iconCfg.Icon;
              return (
                <div
                  key={item._id}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconCfg.className)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.invoiceNumber}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          TYPE_BADGE[item.type] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                        )}
                      >
                        {TYPE_LABEL[item.type] ?? item.type}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.to?.name && <span className="mr-2 font-medium text-slate-600">{item.to.name}</span>}
                      <span className="text-slate-400">
                        Deleted {item.deletedAt ? format(new Date(item.deletedAt), "MMM dd, yyyy 'at' h:mm a") : "—"}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <RestoreButton
                      onClick={() => handleRestore(item._id, "invoice")}
                      disabled={restoringId === item._id}
                      isLoading={restoringId === item._id}
                    />
                    <PurgeButton
                      onClick={() => setPurgeTarget({ id: item._id, name: item.invoiceNumber, kind: "invoice", type: item.type })}
                      disabled={restoringId === item._id}
                    />
                  </div>
                </div>
              );
            })}

            {/* Client rows */}
            {(activeTab === "all" || activeTab === "client") && filteredClients.map((client) => {
              const iconCfg = TYPE_ICON.client;
              const Icon = iconCfg.Icon;
              return (
                <div
                  key={client._id}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconCfg.className)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{client.name}</span>
                      {client.companyName && (
                        <span className="text-xs text-slate-400">· {client.companyName}</span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          TYPE_BADGE.client
                        )}
                      >
                        Client
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {client.email && (
                        <span className="mr-2 font-mono text-slate-600">{client.email}</span>
                      )}
                      <span className="text-slate-400">
                        Deleted {client.deletedAt ? format(new Date(client.deletedAt), "MMM dd, yyyy 'at' h:mm a") : "—"}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <RestoreButton
                      onClick={() => handleRestore(client._id, "client")}
                      disabled={restoringId === client._id}
                      isLoading={restoringId === client._id}
                    />
                    <PurgeButton
                      onClick={() => setPurgeTarget({ id: client._id, name: client.name, kind: "client" })}
                      disabled={restoringId === client._id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-500 md:text-sm">
            <span>
              <span className="font-semibold text-slate-700">{totalCount}</span> item
              {totalCount !== 1 ? "s" : ""} in trash
            </span>
            <span className="text-slate-400">
              Items can be restored or permanently deleted.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}