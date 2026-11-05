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
  Trash2, Plus, Search, X, UserPlus, Building2, Mail, Phone, MapPin,
  FileText, User, CreditCard, Package, Upload, Eye, Download, Pause,
  CheckCircle2, Clock,
} from "lucide-react";
import { InvoicePreview, PAGE_WIDTH, PAGE_HEIGHT } from "@/components/InvoicePreview";
import { InvoiceFormData } from "@/types/invoice";
import { ClientData } from "@/types/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
  onSave: (client: ClientData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

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
        {/* Header */}
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

        {/* Body */}
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

        {/* Footer */}
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
            {saving ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A378F]/10 text-xs font-semibold text-[#5A378F]">
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
/*  Save button variant                                                */
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
        className
      )}
    >
      {isLoading ? <Spinner className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CreateInvoicePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savingAs, setSavingAs] = useState<string | null>(null);
  const [presetClients, setPresetClients] = useState<ClientData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({
    type: "invoice",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: { accountName: "", accountNumber: "", bankName: "", branch: "", swift: "", routingNumber: "", currency: "BDT" },
    items: [{ name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    vat: 0,
    discount: 0,
    advancePaid: 0,
    total: 0,
  });

  /* ---------- Init (unchanged logic) ---------- */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      invoiceNumber: "INV-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPresetClients(data);
      })
      .catch(() => { });
  }, []);

  /* ---------- Client handlers (unchanged logic) ---------- */
  const applyPresetClient = (client: ClientData) => {
    setFormData((prev) => ({
      ...prev,
      to: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
      },
    }));
    toast.success(`Loaded "${client.name}"`);
  };

  const handleNewClientSaved = (client: ClientData) => {
    setPresetClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  /* ---------- Field updaters (unchanged logic) ---------- */
  const updateFrom = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, from: { ...prev.from!, [field]: value } }));
  };
  const updateTo = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, to: { ...prev.to!, [field]: value } }));
  };
  const updatePayment = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, paymentInfo: { ...prev.paymentInfo!, [field]: value } }));
  };

  /* ---------- Item handlers (unchanged logic) ---------- */
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), { name: "", quantity: 1, unitPrice: 0, note: "", subItems: [] }],
    }));
  };
  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };
  const removeItem = (index: number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };
  const addSubItem = (itemIndex: number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        subItems: [...(newItems[itemIndex].subItems || []), ""],
      };
      return { ...prev, items: newItems };
    });
  };
  const updateSubItem = (itemIndex: number, subIndex: number, value: string) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      const subItems = [...(newItems[itemIndex].subItems || [])];
      subItems[subIndex] = value;
      newItems[itemIndex] = { ...newItems[itemIndex], subItems };
      return { ...prev, items: newItems };
    });
  };
  const removeSubItem = (itemIndex: number, subIndex: number) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || [])];
      const subItems = [...(newItems[itemIndex].subItems || [])];
      subItems.splice(subIndex, 1);
      newItems[itemIndex] = { ...newItems[itemIndex], subItems };
      return { ...prev, items: newItems };
    });
  };

  /* ---------- Total calc (unchanged logic) ---------- */
  const subtotal = (formData.items || []).reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalAmount =
    (subtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100) - (formData.advancePaid || 0);

  if (formData.total !== totalAmount) {
    setFormData((prev) => ({ ...prev, total: totalAmount }));
  }

  /* ---------- Logo upload (unchanged logic) ---------- */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({ ...prev, logoUrl: data.url }));
        toast.success("Logo uploaded");
      } else {
        toast.error(data.message || "Failed to upload logo");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploadingLogo(false);
    }
  };

  /* ---------- Save (unchanged logic) ---------- */
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
        router.push("/dashboard/invoices");
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

  /* ---------- PDF download (unchanged logic) ---------- */
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setDownloading(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const pageEls = pdfRef.current.querySelectorAll<HTMLElement>("[data-invoice-page]");
      if (!pageEls.length) {
        toast.error("Invoice not ready", { id: toastId });
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [PAGE_WIDTH, PAGE_HEIGHT],
      });

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], "portrait");
        pdf.addImage(imgData, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      }

      pdf.save(`${formData.invoiceNumber}.pdf`);
      toast.success("PDF Downloaded", { id: toastId });
    } catch {
      toast.dismiss(toastId);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      {showAddClient && (
        <AddClientDialog
          onSave={handleNewClientSaved}
          onClose={() => setShowAddClient(false)}
        />
      )}

      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span>Billing</span>
              <span aria-hidden="true">/</span>
              <span>Invoices</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-600">New</span>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Create Invoice
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the details on the left and watch the preview update live on the right.
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
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1.5">
                <TabsTrigger
                  value="details"
                  className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm data-[state=active]:hover:text-[#5A378F]"
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
                  value="items"
                  className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Items</span>
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

                  {/* Row 1: Invoice Number + Document Name */}
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
                  </div>

                  {/* Row 2: Description (full width) */}
                  <div className="mt-4">
                    <Field label="Description" hint="Shown on the invoice below the title">
                      <Textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g. Web development services for Q4 2024"
                        rows={2}
                        className={cn(inputClass, "resize-none")}
                      />
                    </Field>
                  </div>

                  {/* Row 3: Date + Due Date */}
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          uploadingLogo && "opacity-60"
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

              {/* ITEMS TAB */}
              <TabsContent value="items" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Package className="h-3.5 w-3.5" />
                    Line Items
                  </h3>
                  <Button
                    size="sm"
                    onClick={addItem}
                    className="gap-1.5 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.items?.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[180px] flex-1">
                          <Field label="Description">
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(index, "name", e.target.value)}
                              className={inputClass}
                              placeholder="Item name or service"
                            />
                          </Field>
                        </div>
                        <div className="w-20">
                          <Field label="Qty">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                              className={inputClass}
                            />
                          </Field>
                        </div>
                        <div className="w-28">
                          <Field label="Price">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                              className={inputClass}
                            />
                          </Field>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Subtotal for this item */}
                      <div className="mt-2 pl-1 text-right text-xs text-slate-500">
                        Subtotal:{" "}
                        <span className="font-semibold text-slate-700">
                          ৳{(item.quantity * item.unitPrice).toLocaleString("en-BD")}
                        </span>
                      </div>

                      {/* Note */}
                      <div className="mt-3">
                        <Field label="Note (optional)">
                          <Input
                            placeholder="Add a note for this item…"
                            value={item.note || ""}
                            onChange={(e) => updateItem(index, "note", e.target.value)}
                            className={inputClass}
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
                            onClick={() => addSubItem(index)}
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
                                className={cn("h-8 flex-1 text-sm", inputClass)}
                                placeholder="Sub-item description…"
                                value={sub}
                                onChange={(e) => updateSubItem(index, si, e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => removeSubItem(index, si)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0]"
                                aria-label="Remove sub-item"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Adjustments */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <CreditCard className="h-3.5 w-3.5" />
                    Adjustments
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Discount (৳)">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="VAT (%)">
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.vat}
                        onChange={(e) => setFormData({ ...formData, vat: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Advance Paid (৳)">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                {/* Total summary */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-700">৳{subtotal.toLocaleString("en-BD")}</span>
                  </div>
                  {formData.discount ? (
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-semibold text-[#72243E]">−৳{(formData.discount || 0).toLocaleString("en-BD")}</span>
                    </div>
                  ) : null}
                  {formData.vat ? (
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">VAT ({formData.vat}%)</span>
                      <span className="font-semibold text-slate-700">
                        +৳{((subtotal - (formData.discount || 0)) * (formData.vat / 100)).toLocaleString("en-BD", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ) : null}
                  {formData.advancePaid ? (
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Advance Paid</span>
                      <span className="font-semibold text-[#0E8A7C]">−৳{(formData.advancePaid || 0).toLocaleString("en-BD")}</span>
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-sm font-semibold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-[#0E8A7C]">৳{totalAmount.toLocaleString("en-BD", { maximumFractionDigits: 0 })}</span>
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
              <div className="origin-top transition-transform scale-[0.6] sm:scale-75 xl:scale-90">
                <InvoicePreview data={formData} ref={printRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden full-size invoice used only for PDF capture — no parent CSS transform */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}
      >
        <InvoicePreview data={formData} ref={pdfRef} />
      </div>
    </>
  );
}