"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Trash2, Plus, Download, ArrowLeft, Search, X, UserPlus,
  FileText, User, Package, CreditCard, UserCircle, Upload, Eye, ReceiptText,
} from "lucide-react";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { InvoiceFormData, ReceiptInfo, ReceiptLineItem } from "@/types/invoice";
import { ClientData } from "@/types/client";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
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
  onSave: (c: ClientData) => void;
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E0B400]/10 text-[#7A5C00]">
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
  clients: ClientData[];
  onSelect: (c: ClientData) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.companyName.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()),
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0B400]/10 text-xs font-semibold text-[#7A5C00]">
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
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */
const defaultLineItem = (): ReceiptLineItem => ({
  invoiceNo: "",
  description: "",
  amount: 0,
});

const defaultReceiptInfo = (): ReceiptInfo => ({
  currency: "BDT",
  showInvoiceNo: true,
  lineItems: [defaultLineItem()],
  paidAmount: 0,
  receivedAmount: 0,
  paymentMethod: "",
  accountTransferName: "",
  receivedBy: { name: "", designation: "", companyName: "", address: "", mobile: "" },
});

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CreateReceiptPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [presetClients, setPresetClients] = useState<ClientData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "receipt",
    status: "Paid",
    invoiceNumber: "",
    name: "Receipt",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", routingNumber: "", currency: "BDT" },
    items: [],
    vat: 0,
    discount: 0,
    total: 0,
    receiptInfo: defaultReceiptInfo(),
  });

  /* ---------- Init (unchanged) ---------- */
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPresetClients(data);
      })
      .catch(() => { });
  }, []);

  /* ---------- Client helpers (unchanged) ---------- */
  const applyPresetClient = (client: ClientData) => {
    setFormData((p) => ({
      ...p,
      to: { name: client.name, email: client.email, phone: client.phone, address: client.address },
    }));
    toast.success(`Loaded "${client.name}"`);
  };

  const handleNewClientSaved = (client: ClientData) => {
    setPresetClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  /* ---------- Receipt info helpers (unchanged) ---------- */
  const ri = formData.receiptInfo!;

  const totalDue = useMemo(
    () => (ri.lineItems || []).reduce((s, i) => s + (i.amount || 0), 0),
    [ri.lineItems],
  );

  const updateFrom = (f: string, v: string) =>
    setFormData((p) => ({ ...p, from: { ...p.from!, [f]: v } }));
  const updateTo = (f: string, v: string) =>
    setFormData((p) => ({ ...p, to: { ...p.to!, [f]: v } }));

  const updateRI = (patch: Partial<ReceiptInfo>) =>
    setFormData((p) => ({ ...p, receiptInfo: { ...p.receiptInfo!, ...patch } }));

  const updateReceivedBy = (f: string, v: string) =>
    setFormData((p) => ({
      ...p,
      receiptInfo: {
        ...p.receiptInfo!,
        receivedBy: { ...p.receiptInfo!.receivedBy, [f]: v },
      },
    }));

  const addLineItem = () => updateRI({ lineItems: [...ri.lineItems, defaultLineItem()] });
  const removeLineItem = (i: number) => {
    const items = [...ri.lineItems];
    items.splice(i, 1);
    updateRI({ lineItems: items });
  };
  const updateLineItem = (i: number, f: keyof ReceiptLineItem, v: string | number) => {
    const items = [...ri.lineItems];
    items[i] = { ...items[i], [f]: v };
    updateRI({ lineItems: items });
  };

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
  const handleSave = async () => {
    if (!formData.invoiceNumber?.trim()) {
      toast.error("Receipt number is required");
      return;
    }
    if (!formData.to?.name?.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, dueDate: formData.date, total: totalDue }),
      });
      if (res.ok) {
        toast.success("Receipt created");
        router.push("/dashboard/receipts");
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed to create");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- PDF download (unchanged) ---------- */
  const handleDownloadPDF = async () => {
    setDownloading(true);
    const tid = toast.loading("Generating PDF…");
    try {
      const res = await fetch("/api/invoices/preview/receipt-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, total: totalDue }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.invoiceNumber || "receipt"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", { id: tid });
    } catch {
      toast.dismiss(tid);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const currentDue = totalDue - (ri.paidAmount || 0) - (ri.receivedAmount || 0);

  /* ---------- Render ---------- */
  return (
    <div className="space-y-5">
      {showAddClient && (
        <AddClientDialog onSave={handleNewClientSaved} onClose={() => setShowAddClient(false)} />
      )}

      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/dashboard/receipts")}
            className="mt-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
            aria-label="Back to receipts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span>Billing</span>
              <span aria-hidden="true">/</span>
              <span>Receipts</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-600">New</span>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              New Receipt
            </h1>
            <p className="mt-1 text-sm text-slate-500">Fill in the details below — preview updates live.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/receipts")}
            className="gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a]"
          >
            {saving && <Spinner className="h-3.5 w-3.5" />}
            {saving ? "Creating…" : "Create Receipt"}
          </Button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* Editor / Form */}
        <div className="w-full space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)] xl:w-1/2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1.5">
              <TabsTrigger
                value="details"
                className="gap-1 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger
                value="billto"
                className="gap-1 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Bill To</span>
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="gap-1 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
              >
                <Package className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Items</span>
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="gap-1 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Payment</span>
              </TabsTrigger>
              <TabsTrigger
                value="received"
                className="gap-1 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
              >
                <UserCircle className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Received</span>
              </TabsTrigger>
            </TabsList>

            {/* DETAILS TAB */}
            <TabsContent value="details" className="space-y-4 pt-4">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <ReceiptText className="h-3.5 w-3.5" />
                  Receipt Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Receipt Number" required>
                    <Input
                      placeholder="REC-001"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Receipt Date">
                    <Input
                      type="date"
                      value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date: new Date(e.target.value),
                          dueDate: new Date(e.target.value),
                        })
                      }
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
                  <Field label="Status">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className={cn(
                        "w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 transition-all",
                        "focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20",
                      )}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Hold">Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
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
                  <FileText className="h-3.5 w-3.5" />
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
                  <div className="sm:col-span-2">
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
              </div>
            </TabsContent>

            {/* BILL TO TAB */}
            <TabsContent value="billto" className="space-y-4 pt-4">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                  Load from Preset
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
                  Bill To (Client)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Client Name" required>
                    <Input value={formData.to?.name} onChange={(e) => updateTo("name", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Email">
                    <Input value={formData.to?.email} onChange={(e) => updateTo("email", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Phone">
                    <Input value={formData.to?.phone} onChange={(e) => updateTo("phone", e.target.value)} className={inputClass} />
                  </Field>
                  <div className="sm:col-span-2">
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
              </div>
            </TabsContent>

            {/* ITEMS TAB */}
            <TabsContent value="items" className="space-y-4 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <Package className="h-3.5 w-3.5" />
                  Line Items
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Currency</span>
                    <select
                      value={ri.currency}
                      onChange={(e) => updateRI({ currency: e.target.value })}
                      className={cn(
                        "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-all",
                        "focus:border-[#5A378F]/40 focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20",
                      )}
                    >
                      <option value="BDT">BDT</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={ri.showInvoiceNo}
                      onChange={(e) => updateRI({ showInvoiceNo: e.target.checked })}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#5A378F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
                    />
                    Show Invoice No
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                {ri.lineItems.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-3"
                  >
                    <div className="flex flex-wrap items-end gap-3">
                      {ri.showInvoiceNo && (
                        <div className="w-32">
                          <Field label="Invoice No">
                            <Input
                              placeholder="INV-001"
                              value={item.invoiceNo}
                              onChange={(e) => updateLineItem(i, "invoiceNo", e.target.value)}
                              className={cn("h-9", inputClass)}
                            />
                          </Field>
                        </div>
                      )}
                      <div className="min-w-[180px] flex-1">
                        <Field label="Description" required>
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(i, "description", e.target.value)}
                            className={cn("h-9", inputClass)}
                          />
                        </Field>
                      </div>
                      <div className="w-32">
                        <Field label={`Amount (${ri.currency})`}>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => updateLineItem(i, "amount", Number(e.target.value))}
                            className={cn("h-9", inputClass)}
                          />
                        </Field>
                      </div>
                      <button
                        onClick={() => removeLineItem(i)}
                        disabled={ri.lineItems.length === 1}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30 disabled:opacity-40"
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLineItem}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#5A378F]/40 bg-white text-xs font-semibold text-[#5A378F] transition-all hover:border-[#5A378F]/60 hover:bg-[#EEEDFE]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>

              {/* Totals */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">Total Due Amount</span>
                  <span className="font-bold text-slate-900">
                    {totalDue.toLocaleString()} {ri.currency}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={`Advance Amount (${ri.currency})`}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ri.paidAmount || ""}
                      placeholder="0"
                      onChange={(e) => updateRI({ paidAmount: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={`Paid Amount (${ri.currency})`}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ri.receivedAmount || ""}
                      placeholder="0"
                      onChange={(e) => updateRI({ receivedAmount: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-semibold text-slate-900">Current Due</span>
                  <span className="text-lg font-bold text-[#0E8A7C]">
                    {currentDue.toLocaleString()} {ri.currency}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* PAYMENT TAB */}
            <TabsContent value="payment" className="space-y-4 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                <CreditCard className="h-3.5 w-3.5" />
                Payment Received In
              </h3>

              <div className="space-y-2">
                {(["cash", "cheque", "accountTransfer"] as const).map((method) => {
                  const isSelected = ri.paymentMethod === method;
                  const label =
                    method === "accountTransfer"
                      ? "Account Transfer"
                      : method.charAt(0).toUpperCase() + method.slice(1);
                  return (
                    <label
                      key={method}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all",
                        isSelected
                          ? "border-[#5A378F]/40 bg-[#EEEDFE]/40 ring-1 ring-inset ring-[#5A378F]/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={isSelected}
                        onChange={() => updateRI({ paymentMethod: method })}
                        className="h-4 w-4 cursor-pointer accent-[#5A378F]"
                      />
                      <span className="text-sm font-medium capitalize text-slate-900">{label}</span>
                    </label>
                  );
                })}
              </div>

              {ri.paymentMethod === "accountTransfer" && (
                <div className="border-t border-slate-100 pt-4">
                  <Field label="Account Transfer Name / Reference">
                    <Input
                      placeholder="e.g. Bank name or reference"
                      value={ri.accountTransferName}
                      onChange={(e) => updateRI({ accountTransferName: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {ri.paymentMethod && (
                <div className="pt-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 underline transition-colors hover:text-[#EA2B7B]"
                    onClick={() => updateRI({ paymentMethod: "", accountTransferName: "" })}
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </TabsContent>

            {/* RECEIVED BY TAB */}
            <TabsContent value="received" className="space-y-4 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                <UserCircle className="h-3.5 w-3.5" />
                Received By
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={ri.receivedBy.name} onChange={(e) => updateReceivedBy("name", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Designation">
                  <Input value={ri.receivedBy.designation} onChange={(e) => updateReceivedBy("designation", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Company Name">
                  <Input value={ri.receivedBy.companyName} onChange={(e) => updateReceivedBy("companyName", e.target.value)} className={inputClass} />
                </Field>
                <Field label="Mobile">
                  <Input value={ri.receivedBy.mobile} onChange={(e) => updateReceivedBy("mobile", e.target.value)} className={inputClass} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Textarea
                      value={ri.receivedBy.address}
                      onChange={(e) => updateReceivedBy("address", e.target.value)}
                      className={cn(inputClass, "resize-none")}
                      rows={2}
                    />
                  </Field>
                </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {downloading ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
          </div>

          <div className="flex w-full justify-center overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/70 p-4">
            <div className="origin-top scale-[0.55] transition-transform sm:scale-[0.7] xl:scale-[0.85]">
              <ReceiptPreview data={{ ...formData, total: totalDue }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}