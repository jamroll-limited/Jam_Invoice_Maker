"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Trash2, Plus, Search, X, UserPlus, ChevronDown, ChevronUp,
  Building2, FileText, User, CreditCard, Wrench, Upload, Eye,
  Pause, CheckCircle2, Clock,
} from "lucide-react";
import { ServiceInvoicePreview } from "@/components/ServiceInvoicePreview";
import { ServiceInvoiceFormData, ServiceGroup, ServiceItem } from "@/types/invoice";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Field wrapper — consistent label + input spacing                   */
/* ------------------------------------------------------------------ */
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-[#EA2B7B]">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass = "bg-slate-50/60 text-sm transition-all focus:bg-white";

/* ------------------------------------------------------------------ */
/*  Quick-Add Client Dialog                                            */
/* ------------------------------------------------------------------ */
function AddClientDialog({
  onSave,
  onClose,
}: {
  onSave: (c: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Client saved");
        onSave(json);
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5A378F]/10 text-[#5A378F]">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold text-slate-900">Add New Client</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="John Doe"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Company Name">
              <Input
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@example.com"
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 234 567 890"
                className={inputClass}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Address">
                <Textarea
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 Main St, City"
                  rows={2}
                  className={cn(inputClass, "resize-none")}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="gap-1.5 rounded-lg border-slate-200 hover:bg-slate-100"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="gap-1.5 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a]"
          >
            {saving ? <Spinner className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            Save &amp; Use
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Client Search Dropdown                                             */
/* ------------------------------------------------------------------ */
function ClientSearch({
  clients,
  onSelect,
  onAddNew,
}: {
  clients: any[];
  onSelect: (c: any) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase()),
    )
    : clients;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className={cn("pl-9", inputClass)}
          placeholder="Search preset clients…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      {open && (
        <div className="absolute z-40 mt-1.5 max-h-60 w-full overflow-y-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] [scrollbar-width:thin]">
          {filtered.length === 0 && query.trim() && (
            <p className="px-4 py-3 text-sm text-slate-400">No clients found.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => {
                onSelect(c);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#51B9A9]/10 text-xs font-semibold text-[#0E8A7C]">
                {(c.name || "U").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                {(c.companyName || c.email) && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {[c.companyName, c.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddNew();
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-[#5A378F] transition-colors hover:bg-[#EEEDFE]/50"
          >
            <UserPlus className="h-4 w-4" />
            Add new client
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Save button                                                        */
/* ------------------------------------------------------------------ */
function SaveButton({
  onClick,
  disabled,
  isLoading,
  icon: Icon,
  children,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-1.5 rounded-lg border text-xs font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        className,
      )}
    >
      {isLoading ? <Spinner className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Service Card                                                       */
/* ------------------------------------------------------------------ */
function ServiceCard({
  service,
  serviceIdx,
  onUpdateName,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddSubItem,
  onUpdateSubItem,
  onRemoveSubItem,
  onRemoveService,
}: {
  service: ServiceGroup;
  serviceIdx: number;
  onUpdateName: (v: string) => void;
  onAddItem: () => void;
  onUpdateItem: (ii: number, f: string, v: string | number) => void;
  onRemoveItem: (ii: number) => void;
  onAddSubItem: (ii: number) => void;
  onUpdateSubItem: (ii: number, si: number, v: string) => void;
  onRemoveSubItem: (ii: number, si: number) => void;
  onRemoveService: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const subtotal = service.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
      {/* Service header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[#51B9A9]/5 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#51B9A9]/10 text-[#0E8A7C]">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0E8A7C]">
            Service {serviceIdx + 1}
          </span>
          <Input
            value={service.serviceName}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="e.g. Graphics Design Service"
            className="h-8 flex-1 border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:border-[#5A378F]/40 focus:ring-[#5A378F]/20"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-[#51B9A9]/10 px-2.5 py-1 text-xs font-bold text-[#0E8A7C]">
            ${subtotal.toFixed(2)}
          </span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
            aria-label={collapsed ? "Expand service" : "Collapse service"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={onRemoveService}
            className="rounded-md p-1.5 text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30"
            aria-label="Remove service"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="space-y-3 bg-white p-4">
          {service.items.map((item, ii) => (
            <div
              key={ii}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-3"
            >
              {/* Item row */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <Field label="Description">
                    <Input
                      value={item.name}
                      onChange={(e) => onUpdateItem(ii, "name", e.target.value)}
                      placeholder="Item description"
                      className={cn("h-8", inputClass)}
                    />
                  </Field>
                </div>
                <div className="w-20">
                  <Field label="Qty">
                    <Input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(ii, "quantity", Number(e.target.value))}
                      className={cn("h-8", inputClass)}
                    />
                  </Field>
                </div>
                <div className="w-28">
                  <Field label="Unit Price">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(ii, "unitPrice", Number(e.target.value))}
                      className={cn("h-8", inputClass)}
                    />
                  </Field>
                </div>
                <div className="w-24">
                  <Field label="Amount">
                    <div className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-[#0E8A7C]">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </Field>
                </div>
                <button
                  onClick={() => onRemoveItem(ii)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Note */}
              <div className="mt-3">
                <Field label="Note (optional)">
                  <Input
                    placeholder="Add a note for this item…"
                    value={item.note || ""}
                    onChange={(e) => onUpdateItem(ii, "note", e.target.value)}
                    className={cn("h-7 text-xs", inputClass)}
                  />
                </Field>
              </div>

              {/* Sub-items */}
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Sub-items
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddSubItem(ii)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#5A378F] transition-colors hover:bg-[#EEEDFE]"
                  >
                    <Plus className="h-3 w-3" />
                    Add sub-item
                  </button>
                </div>
                <div className="space-y-2">
                  {(item.subItems || []).map((sub, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <span className="text-slate-300">—</span>
                      <Input
                        className={cn("h-7 flex-1 text-xs", inputClass)}
                        placeholder="Sub-item description…"
                        value={sub}
                        onChange={(e) => onUpdateSubItem(ii, si, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveSubItem(ii, si)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0]"
                        aria-label="Remove sub-item"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Add item + service subtotal */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddItem}
              className="h-7 gap-1 border-dashed border-[#5A378F]/40 text-xs text-[#5A378F] hover:bg-[#EEEDFE]/50"
            >
              <Plus className="h-3 w-3" />
              Add Item
            </Button>
            <div className="text-sm font-semibold text-slate-600">
              Service Subtotal:{" "}
              <span className="text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
const defaultService = (): ServiceGroup => ({
  serviceName: "",
  items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
});

export default function CreateServiceInvoicePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingAs, setSavingAs] = useState<string | null>(null);
  const [presetClients, setPresetClients] = useState<any[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<ServiceInvoiceFormData>>({
    type: "serviceInvoice",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", routingNumber: "", currency: "BDT" },
    services: [defaultService()],
    vat: 0,
    discount: 0,
    advancePaid: 0,
    total: 0,
  });

  /* ---------- Init (unchanged) ---------- */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      invoiceNumber: "INV2-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPresetClients(data);
      })
      .catch(() => { });
  }, []);

  /* ---------- Computed totals (unchanged) ---------- */
  const grandSubtotal = (formData.services || []).reduce(
    (s, svc) => s + svc.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0),
    0,
  );
  const totalAmount =
    (grandSubtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100) -
    (formData.advancePaid || 0);
  if (formData.total !== totalAmount) setFormData((p) => ({ ...p, total: totalAmount }));

  /* ---------- Client helpers (unchanged) ---------- */
  const applyPresetClient = (client: any) => {
    setFormData((p) => ({
      ...p,
      to: { name: client.name, email: client.email, phone: client.phone, address: client.address },
    }));
    toast.success(`Loaded "${client.name}"`);
  };
  const handleNewClientSaved = (client: any) => {
    setPresetClients((p) => [...p, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  /* ---------- Service helpers (unchanged) ---------- */
  const updateServices = (fn: (prev: ServiceGroup[]) => ServiceGroup[]) =>
    setFormData((p) => ({ ...p, services: fn([...(p.services || [])]) }));

  const addService = () => updateServices((s) => [...s, defaultService()]);
  const removeService = (si: number) => updateServices((s) => s.filter((_, i) => i !== si));
  const updateServiceName = (si: number, v: string) =>
    updateServices((s) => {
      s[si] = { ...s[si], serviceName: v };
      return s;
    });

  const addItem = (si: number) =>
    updateServices((s) => {
      s[si] = {
        ...s[si],
        items: [...s[si].items, { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
      };
      return s;
    });
  const removeItem = (si: number, ii: number) =>
    updateServices((s) => {
      const items = [...s[si].items];
      items.splice(ii, 1);
      s[si] = { ...s[si], items };
      return s;
    });
  const updateItem = (si: number, ii: number, f: string, v: string | number) =>
    updateServices((s) => {
      const items = [...s[si].items];
      items[ii] = { ...items[ii], [f]: v };
      s[si] = { ...s[si], items };
      return s;
    });

  const addSubItem = (si: number, ii: number) =>
    updateServices((s) => {
      const items = [...s[si].items];
      items[ii] = { ...items[ii], subItems: [...(items[ii].subItems || []), ""] };
      s[si] = { ...s[si], items };
      return s;
    });
  const updateSubItem = (si: number, ii: number, subI: number, v: string) =>
    updateServices((s) => {
      const items = [...s[si].items];
      const subs = [...(items[ii].subItems || [])];
      subs[subI] = v;
      items[ii] = { ...items[ii], subItems: subs };
      s[si] = { ...s[si], items };
      return s;
    });
  const removeSubItem = (si: number, ii: number, subI: number) =>
    updateServices((s) => {
      const items = [...s[si].items];
      const subs = [...(items[ii].subItems || [])];
      subs.splice(subI, 1);
      items[ii] = { ...items[ii], subItems: subs };
      s[si] = { ...s[si], items };
      return s;
    });

  /* ---------- Other helpers (unchanged) ---------- */
  const updateTo = (f: string, v: string) =>
    setFormData((p) => ({ ...p, to: { ...p.to!, [f]: v } }));
  const updateFrom = (f: string, v: string) =>
    setFormData((p) => ({ ...p, from: { ...p.from!, [f]: v } }));
  const updatePayment = (f: string, v: string) =>
    setFormData((p) => ({ ...p, paymentInfo: { ...p.paymentInfo!, [f]: v } }));

  /* ---------- Logo upload (unchanged) ---------- */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        setFormData((p) => ({ ...p, logoUrl: data.url }));
        toast.success("Logo uploaded");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploadingLogo(false);
    }
  };

  /* ---------- Save (unchanged) ---------- */
  const handleSave = async (status: "Paid" | "Unpaid" | "Hold") => {
    setLoading(true);
    setSavingAs(status);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status }),
      });
      if (res.ok) {
        toast.success(`Invoice saved as ${status}`);
        router.push("/dashboard/service-invoices");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save invoice");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
      setSavingAs(null);
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      {showAddClient && (
        <AddClientDialog onSave={handleNewClientSaved} onClose={() => setShowAddClient(false)} />
      )}

      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span>Billing</span>
              <span aria-hidden="true">/</span>
              <span>Service Invoices</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-600">New</span>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Create Service Invoice
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Group your services into billable categories and watch the preview update live.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SaveButton
              onClick={() => handleSave("Hold")}
              disabled={loading}
              isLoading={savingAs === "Hold"}
              icon={Pause}
              className="border-[#E0B400]/40 bg-[#FFF8E1] text-[#7A5C00] hover:bg-[#F9C551]/30 focus-visible:ring-[#E0B400]/40"
            >
              Save Hold
            </SaveButton>
            <SaveButton
              onClick={() => handleSave("Unpaid")}
              disabled={loading}
              isLoading={savingAs === "Unpaid"}
              icon={Clock}
              className="border-[#AFA9EC]/40 bg-[#EEEDFE] text-[#3C3489] hover:bg-[#AFA9EC]/30 focus-visible:ring-[#5A378F]/40"
            >
              Save Unpaid
            </SaveButton>
            <SaveButton
              onClick={() => handleSave("Paid")}
              disabled={loading}
              isLoading={savingAs === "Paid"}
              icon={CheckCircle2}
              className="border-[#51B9A9]/40 bg-[#E1F5EE] text-[#085041] hover:bg-[#51B9A9]/30 focus-visible:ring-[#51B9A9]/40"
            >
              Save Paid
            </SaveButton>
          </div>
        </div>

        {/* Editor + Preview */}
        <div className="flex flex-col gap-5 xl:flex-row">
          {/* Editor / Form */}
          <div className="w-full space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)] xl:w-1/2">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1.5">
                <TabsTrigger
                  value="details"
                  className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="client"
                  className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Client</span>
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Services</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Payment</span>
                </TabsTrigger>
              </TabsList>

              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-4 pt-4">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <FileText className="h-3.5 w-3.5" />
                    Invoice Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Invoice Number">
                      <Input
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Document Name">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Date">
                      <Input
                        type="date"
                        value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Due Date">
                      <Input
                        type="date"
                        value={formData.dueDate ? new Date(formData.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                {/* Logo */}
                <div className="border-t border-slate-100 pt-4">
                  <Field label="Logo" hint="PNG, JPG, or SVG up to ~2MB">
                    <div className="flex items-center gap-3">
                      {formData.logoUrl ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                          <Upload className="h-4 w-4" />
                        </div>
                      )}
                      <label
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors",
                          "hover:border-slate-300 hover:bg-slate-50",
                          uploadingLogo && "opacity-60",
                        )}
                      >
                        {uploadingLogo ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {uploadingLogo ? "Uploading…" : formData.logoUrl ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logoUrl: undefined }))}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#FBEAF0] hover:text-[#EA2B7B]"
                          aria-label="Remove logo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </Field>
                </div>

                {/* From */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Your Company (From)
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Company Name">
                      <Input value={formData.from?.name} onChange={(e) => updateFrom("name", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Email">
                      <Input value={formData.from?.email} onChange={(e) => updateFrom("email", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Phone">
                      <Input value={formData.from?.phone} onChange={(e) => updateFrom("phone", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Address">
                      <Textarea
                        value={formData.from?.address}
                        onChange={(e) => updateFrom("address", e.target.value)}
                        className={cn(inputClass, "resize-none")}
                        rows={2}
                      />
                    </Field>
                  </div>
                </div>
              </TabsContent>

              {/* CLIENT TAB */}
              <TabsContent value="client" className="space-y-4 pt-4">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                    Search Preset Clients
                  </h3>
                  <ClientSearch
                    clients={presetClients}
                    onSelect={applyPresetClient}
                    onAddNew={() => setShowAddClient(true)}
                  />
                  {presetClients.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      No preset clients yet.{" "}
                      <button
                        type="button"
                        onClick={() => setShowAddClient(true)}
                        className="font-medium text-[#5A378F] hover:underline"
                      >
                        Add one now
                      </button>
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    Client Details (To) — or fill in manually
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Client Name">
                      <Input value={formData.to?.name} onChange={(e) => updateTo("name", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Email">
                      <Input value={formData.to?.email} onChange={(e) => updateTo("email", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Phone">
                      <Input value={formData.to?.phone} onChange={(e) => updateTo("phone", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Address">
                      <Textarea
                        value={formData.to?.address}
                        onChange={(e) => updateTo("address", e.target.value)}
                        className={cn(inputClass, "resize-none")}
                        rows={2}
                      />
                    </Field>
                  </div>
                </div>
              </TabsContent>

              {/* SERVICES TAB */}
              <TabsContent value="services" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Wrench className="h-3.5 w-3.5" />
                    Service Groups
                  </h3>
                  <span className="text-xs text-slate-400">
                    {(formData.services || []).length} service
                    {(formData.services || []).length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-4">
                  {(formData.services || []).map((svc, si) => (
                    <ServiceCard
                      key={si}
                      service={svc}
                      serviceIdx={si}
                      onUpdateName={(v) => updateServiceName(si, v)}
                      onAddItem={() => addItem(si)}
                      onUpdateItem={(ii, f, v) => updateItem(si, ii, f, v)}
                      onRemoveItem={(ii) => removeItem(si, ii)}
                      onAddSubItem={(ii) => addSubItem(si, ii)}
                      onUpdateSubItem={(ii, subI, v) => updateSubItem(si, ii, subI, v)}
                      onRemoveSubItem={(ii, subI) => removeSubItem(si, ii, subI)}
                      onRemoveService={() => removeService(si)}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={addService}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#5A378F]/30 bg-[#51B9A9]/5 text-sm font-semibold text-[#0E8A7C] transition-all hover:border-[#51B9A9]/50 hover:bg-[#51B9A9]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#51B9A9]/30"
                  >
                    <Plus className="h-4 w-4" />
                    Add Service
                  </button>
                </div>

                {/* Grand totals summary */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/60">
                  <div className="border-b border-slate-200 bg-white px-4 py-2.5">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                      <CreditCard className="h-3.5 w-3.5" />
                      Adjustments &amp; Total
                    </h3>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Grand Subtotal</span>
                      <span className="font-semibold text-slate-700">${grandSubtotal.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Discount ($)">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                          className={cn("h-8 text-right", inputClass)}
                        />
                      </Field>
                      <Field label="VAT (%)">
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.vat}
                          onChange={(e) => setFormData({ ...formData, vat: Number(e.target.value) })}
                          className={cn("h-8 text-right", inputClass)}
                        />
                      </Field>
                      <Field label="Advance Paid ($)">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.advancePaid}
                          onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                          className={cn("h-8 text-right", inputClass)}
                        />
                      </Field>
                    </div>

                    {formData.discount ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Discount</span>
                        <span className="font-semibold text-[#72243E]">−${(formData.discount || 0).toFixed(2)}</span>
                      </div>
                    ) : null}
                    {formData.vat ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">VAT ({formData.vat}%)</span>
                        <span className="font-semibold text-slate-700">
                          +${((grandSubtotal - (formData.discount || 0)) * (formData.vat / 100)).toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    {formData.advancePaid ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Advance Paid</span>
                        <span className="font-semibold text-[#0E8A7C]">−${(formData.advancePaid || 0).toFixed(2)}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-sm font-semibold text-slate-900">Total</span>
                      <span className="text-lg font-bold text-[#0E8A7C]">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* PAYMENT TAB */}
              <TabsContent value="payment" className="space-y-4 pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <CreditCard className="h-3.5 w-3.5" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Currency">
                    <Input
                      value={formData.paymentInfo?.currency}
                      onChange={(e) => updatePayment("currency", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Bank Name">
                    <Input
                      value={formData.paymentInfo?.bankName}
                      onChange={(e) => updatePayment("bankName", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Account Name">
                    <Input
                      value={formData.paymentInfo?.accountName}
                      onChange={(e) => updatePayment("accountName", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Account Number">
                    <Input
                      value={formData.paymentInfo?.accountNumber}
                      onChange={(e) => updatePayment("accountNumber", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Branch">
                    <Input
                      value={formData.paymentInfo?.branch}
                      onChange={(e) => updatePayment("branch", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="SWIFT / BIC">
                    <Input
                      value={formData.paymentInfo?.swift}
                      onChange={(e) => updatePayment("swift", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Routing Number">
                    <Input
                      value={formData.paymentInfo?.routingNumber ?? ""}
                      onChange={(e) => updatePayment("routingNumber", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="flex w-full flex-col xl:w-1/2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-700">Live Preview</h2>
              </div>
            </div>

            <div className="flex w-full justify-center overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/70 p-4">
              <div className="origin-top scale-[0.6] transition-transform sm:scale-75 xl:scale-90">
                <ServiceInvoicePreview data={formData} ref={printRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}