"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Search, Edit, Trash2, X, Check, Building2, Mail, Phone, MapPin,
  ContactRound, Inbox, User, Landmark,
} from "lucide-react";
import { ClientData } from "@/types/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Empty form — now includes From + bank details                      */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  address: "",
  // Your Company (From) — issuer info
  from: { name: "", email: "", phone: "", address: "" },
  // Bank / payment details
  accountName: "",
  accountNumber: "",
  bankName: "",
  branch: "",
  swift: "",
  routingNumber: "",
};

type ClientFormShape = typeof EMPTY_FORM;

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
/* ------------------------------------------------------------------ */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-[#EA2B7B]">*</span>}
      </Label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client form — add / edit (now with From + Bank sections)           */
/* ------------------------------------------------------------------ */
function ClientForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ClientFormShape;
  onSave: (data: ClientFormShape) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ClientFormShape>(initial);

  // supports flat fields + nested from.name / from.email / ...
  const set = (field: string, value: string) =>
    setForm((p) => {
      if (field.startsWith("from.")) {
        const key = field.split(".")[1];
        return { ...p, from: { ...p.from, [key]: value } };
      }
      return { ...p, [field]: value };
    });

  return (
    <div className="space-y-4">
      {/* ── Client info (existing block) */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <User className="h-3.5 w-3.5" />
          Client Info
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="John Doe"
              className="bg-slate-50/60 focus:bg-white"
              autoFocus
            />
          </Field>
          <Field label="Company Name">
            <Input
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Acme Corp"
              className="bg-slate-50/60 focus:bg-white"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="john@example.com"
              className="bg-slate-50/60 focus:bg-white"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 234 567 890"
              className="bg-slate-50/60 focus:bg-white"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Textarea
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="123 Main St, City, Country"
                rows={2}
                className="bg-slate-50/60 focus:bg-white resize-none"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ── NEW: Your Company (From) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <Building2 className="h-3.5 w-3.5" />
          Your Company (From)
        </h3>
        <p className="mb-3 text-[11px] text-slate-400">
          Auto-suggested when this client is picked in Invoices, Quotations & Receipts.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company Name">
            <Input
              value={form.from.name}
              onChange={(e) => set("from.name", e.target.value)}
              placeholder="Your Company Ltd."
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.from.email}
              onChange={(e) => set("from.email", e.target.value)}
              placeholder="billing@yourcompany.com"
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.from.phone}
              onChange={(e) => set("from.phone", e.target.value)}
              placeholder="+880 1700 000 000"
              className="bg-white focus:bg-white"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Textarea
                value={form.from.address}
                onChange={(e) => set("from.address", e.target.value)}
                placeholder="Company address"
                rows={2}
                className="bg-white focus:bg-white resize-none"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ── NEW: Bank / payment details */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <Landmark className="h-3.5 w-3.5" />
          Bank Details
        </h3>
        <p className="mb-3 text-[11px] text-slate-400">
          Auto-suggested into the Payment tab when this client is picked.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Account Name">
            <Input
              value={form.accountName}
              onChange={(e) => set("accountName", e.target.value)}
              placeholder="John Doe"
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="Account Number">
            <Input
              value={form.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value)}
              placeholder="01234567890"
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="Bank Name">
            <Input
              value={form.bankName}
              onChange={(e) => set("bankName", e.target.value)}
              placeholder="ABC Bank"
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="Branch">
            <Input
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              placeholder="Dhaka Main"
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="SWIFT Code">
            <Input
              value={form.swift}
              onChange={(e) => set("swift", e.target.value)}
              placeholder="ABCBBDDH"
              className="bg-white focus:bg-white"
            />
          </Field>
          <Field label="Routing Number">
            <Input
              value={form.routingNumber}
              onChange={(e) => set("routingNumber", e.target.value)}
              placeholder="090000123"
              className="bg-white focus:bg-white"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
          className="gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="gap-1.5 bg-[#5A378F] text-white hover:bg-[#4a2d7a]"
        >
          {saving ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Save Client
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client avatar — initials in a tinted circle                        */
/* ------------------------------------------------------------------ */
function ClientAvatar({ name, companyName }: { name: string; companyName?: string }) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tints = [
    "bg-[#5A378F]/10 text-[#5A378F]",
    "bg-[#51B9A9]/10 text-[#0E8A7C]",
    "bg-[#EA2B7B]/10 text-[#EA2B7B]",
    "bg-[#E0B400]/10 text-[#7A5C00]",
    "bg-[#3C3489]/10 text-[#3C3489]",
  ];
  const tint = tints[(name?.charCodeAt(0) || 0) % tints.length];

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        tint
      )}
      aria-hidden="true"
    >
      {companyName ? <Building2 className="h-5 w-5" /> : initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function ClientsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "Super Admin";

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientData | null>(null);

  /* ---------- Data fetching ---------- */
  useEffect(() => {
    fetch("/api/clients")
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.message || "Failed to fetch");
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
        else console.error("Expected array, got:", data);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        toast.error("Failed to load clients: " + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Filter ---------- */
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  /* ---------- Add ---------- */
  const handleAdd = async (data: ClientFormShape) => {
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setClients((prev) => [json, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        setShowAdd(false);
        toast.success("Client added");
      } else {
        toast.error(json.message || "Failed to add client");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Edit ---------- */
  const handleEdit = async (id: string, data: ClientFormShape) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setClients((prev) => prev.map((c) => (c._id === id ? json : c)));
        setEditingId(null);
        toast.success("Client updated");
      } else {
        toast.error(json.message || "Failed to update");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c._id !== id));
        setDeleteTarget(null);
        toast.success("Client moved to trash");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.name}
        itemLabel="client"
        onConfirm={handleDelete}
        isDeleting={!!deletingId}
      />

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>Manage</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600">Clients</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            Manage preset client info, your company details, and bank info to auto-fill invoices.
          </p>
        </div>
        {isSuperAdmin && !showAdd && (
          <Button
            onClick={() => setShowAdd(true)}
            className="gap-2 self-start rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a] sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            All Clients
            {!loading && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({clients.length})
              </span>
            )}
          </h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-56 rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all",
                "focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20"
              )}
              aria-label="Search clients"
            />
          </div>
        </div>

        {/* Add form */}
        {showAdd && isSuperAdmin && (
          <div className="border-b border-slate-100 bg-[#EEEDFE]/30 px-5 py-5">
            <div className="rounded-xl border border-[#5A378F]/15 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5A378F]/10 text-[#5A378F]">
                  <User className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">New Client</h3>
              </div>
              <ClientForm
                initial={EMPTY_FORM}
                onSave={handleAdd}
                onCancel={() => setShowAdd(false)}
                saving={saving}
              />
            </div>
          </div>
        )}

        {/* Client list */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-5">
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {search ? "No clients match your search" : "No clients yet"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {search
                    ? "Try a different name, company, or email."
                    : "Add your first client to auto-fill invoices faster."}
                </p>
              </div>
              {isSuperAdmin && !search && !showAdd && (
                <Button
                  onClick={() => setShowAdd(true)}
                  className="mt-2 gap-1.5 rounded-lg bg-[#5A378F] text-white hover:bg-[#4a2d7a]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Client
                </Button>
              )}
            </div>
          ) : (
            filtered.map((client) => (
              <div key={client._id} className="px-5 py-5">
                {editingId === client._id ? (
                  <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-200/60 text-amber-800">
                        <Edit className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">Edit Client</h3>
                    </div>
                    <ClientForm
                      initial={{
                        name: client.name,
                        companyName: client.companyName,
                        email: client.email,
                        phone: client.phone,
                        address: client.address,
                        from: client.from ?? { name: "", email: "", phone: "", address: "" },
                        accountName: client.accountName ?? "",
                        accountNumber: client.accountNumber ?? "",
                        bankName: client.bankName ?? "",
                        branch: client.branch ?? "",
                        swift: client.swift ?? "",
                        routingNumber: client.routingNumber ?? "",
                      }}
                      onSave={(data) => handleEdit(client._id, data)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <ClientAvatar name={client.name} companyName={client.companyName} />

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{client.name}</p>
                        {client.companyName && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            <Building2 className="h-3 w-3" aria-hidden="true" />
                            {client.companyName}
                          </span>
                        )}
                        {client.bankName && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EEEDFE] px-2 py-0.5 text-xs font-medium text-[#3C3489]">
                            <Landmark className="h-3 w-3" aria-hidden="true" />
                            {client.bankName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#5A378F]"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            <span className="font-mono text-xs">{client.email}</span>
                          </a>
                        )}
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#5A378F]"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            <span className="font-mono text-xs">{client.phone}</span>
                          </a>
                        )}
                        {client.address && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            <span className="truncate">{client.address}</span>
                          </span>
                        )}
                      </div>

                      {/* From preview line — only when present */}
                      {client.from?.name && (
                        <p className="text-xs text-slate-400">
                          <span className="font-medium text-slate-500">From:</span>{" "}
                          {client.from.name}
                          {client.from.email ? ` · ${client.from.email}` : ""}
                        </p>
                      )}
                    </div>

                    {isSuperAdmin && (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => setEditingId(client._id)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                          title="Edit"
                          aria-label={`Edit ${client.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
                          disabled={deletingId === client._id}
                          className="rounded-md p-1.5 text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30"
                          title="Delete"
                          aria-label={`Delete ${client.name}`}
                        >
                          {deletingId === client._id ? (
                            <Spinner className="h-4 w-4 text-[#EA2B7B]" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-500 md:text-sm">
            <span>
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-700">{clients.length}</span> client
              {clients.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}