"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Trash2, Plus, Search, X, UserPlus,
  FileText, User, Package, CreditCard, Upload, Eye, Wrench,
  Pause, CheckCircle2, Clock, Building2, Landmark,
} from "lucide-react";
import { ServiceInvoicePreview, PAGE_WIDTH_2, PAGE_HEIGHT_2 } from "@/components/ServiceInvoicePreview";
import { ServiceInvoiceFormData, ServiceGroup, ServiceItem } from "@/types/invoice";
import { ClientData } from "@/types/client";
import { CompanyData } from "@/types/company";
import { BankAccountData } from "@/types/bankAccount";
import { CompanySearch } from "@/components/CompanySearch";
import { BankAccountSearch } from "@/components/BankAccountSearch";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Link from "next/link";

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
/*  Quick-Add Client Dialog                                           */
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#51B9A9]/10 text-[#0E8A7C]">
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
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" className={inputClass} autoFocus />
            </Field>
            <Field label="Company Name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Acme Corp" className={inputClass} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" className={inputClass} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 234 567 890" className={inputClass} />
            </Field>
            <div className="col-span-2">
              <Field label="Address">
                <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City" rows={2} className={cn(inputClass, "resize-none")} />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="gap-1.5 rounded-lg border-slate-200 hover:bg-slate-100">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()} className="gap-1.5 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a]">
            {saving ? <Spinner className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />} Save &amp; Use
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
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
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
              onClick={() => { onSelect(c); setQuery(""); setOpen(false); }}
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
            onClick={() => { setOpen(false); onAddNew(); }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-[#5A378F] transition-colors hover:bg-[#EEEDFE]/50"
          >
            <UserPlus className="h-4 w-4" /> Add new client
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
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */
const defaultServiceItem = (): ServiceItem => ({
  name: "",
  quantity: 1,
  unitPrice: 0,
  note: "",
  subItems: [],
});

const defaultServiceGroup = (): ServiceGroup => ({
  serviceName: "",
  items: [defaultServiceItem()],
});

const defaultPaymentInfo = () => ({
  accountName: "",
  accountNumber: "",
  bankName: "",
  branch: "",
  swift: "",
  routingNumber: "",
  currency: "BDT",
  note: "",
});

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CreateServiceInvoicePage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savingAs, setSavingAs] = useState<string | null>(null);
  const [presetClients, setPresetClients] = useState<ClientData[]>([]);
  const [presetCompanies, setPresetCompanies] = useState<CompanyData[]>([]);
  const [presetBankAccounts, setPresetBankAccounts] = useState<BankAccountData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);

  const [formData, setFormData] = useState<Partial<ServiceInvoiceFormData>>({
    type: "serviceInvoice",
    status: "Unpaid",
    invoiceNumber: "",
    name: "Service Invoice",
    date: new Date(),
    dueDate: new Date(),
    from: { name: "", email: "", phone: "", address: "" },
    to: { name: "", email: "", phone: "", address: "" },
    paymentInfo: defaultPaymentInfo(),
    services: [defaultServiceGroup()],
    vat: 0,
    discount: 0,
    advancePaid: 0,
    total: 0,
  });

  /* ---------- Init: generate number + load presets ---------- */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      invoiceNumber: "SVI-" + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }));

    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/bank-accounts").then((r) => r.json()),
    ])
      .then(([clients, companies, bankAccounts]) => {
        if (Array.isArray(clients)) setPresetClients(clients);
        if (Array.isArray(companies)) setPresetCompanies(companies);
        if (Array.isArray(bankAccounts)) setPresetBankAccounts(bankAccounts);
      })
      .catch(() => { });
  }, []);

  /* ---------- Preset loaders ---------- */
  const applyPresetClient = (client: ClientData) => {
    setFormData((prev) => ({
      ...prev,
      to: { name: client.name, email: client.email, phone: client.phone, address: client.address },
    }));
    toast.success(`Loaded "${client.name}"`);
  };

  const applyPresetCompany = (company: CompanyData) => {
    setFormData((prev) => ({
      ...prev,
      from: {
        name: company.name || prev.from?.name || "",
        email: company.email || prev.from?.email || "",
        phone: company.phone || prev.from?.phone || "",
        address: company.address || prev.from?.address || "",
      },
    }));
    toast.success(`Loaded company "${company.name}"`);
  };

  const applyPresetBankAccount = (acct: BankAccountData) => {
    setFormData((prev) => ({
      ...prev,
      paymentInfo: {
        accountName: acct.accountName || prev.paymentInfo?.accountName || "",
        accountNumber: acct.accountNumber || prev.paymentInfo?.accountNumber || "",
        bankName: acct.bankName || prev.paymentInfo?.bankName || "",
        branch: acct.branch || prev.paymentInfo?.branch || "",
        swift: acct.swift || prev.paymentInfo?.swift || "",
        routingNumber: acct.routingNumber || prev.paymentInfo?.routingNumber || "",
        currency: acct.currency || prev.paymentInfo?.currency || "BDT",
        note: acct.note ?? prev.paymentInfo?.note ?? "",
      },
    }));
    toast.success(`Loaded bank account "${acct.label}"`);
  };

  const handleNewClientSaved = (client: ClientData) => {
    setPresetClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    applyPresetClient(client);
    setShowAddClient(false);
  };

  /* ---------- Field updaters ---------- */
  const updateTo = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, to: { ...prev.to!, [field]: value } }));
  const updateFrom = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, from: { ...prev.from!, [field]: value } }));
  const updatePayment = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, paymentInfo: { ...prev.paymentInfo!, [field]: value } }));

  /* ---------- Service group / item handlers ---------- */
  const addServiceGroup = () =>
    setFormData((prev) => ({
      ...prev,
      services: [...(prev.services || []), defaultServiceGroup()],
    }));

  const removeServiceGroup = (gi: number) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      services.splice(gi, 1);
      return { ...prev, services: services.length ? services : [defaultServiceGroup()] };
    });

  const updateServiceGroupName = (gi: number, value: string) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      services[gi] = { ...services[gi], serviceName: value };
      return { ...prev, services };
    });

  const addServiceItem = (gi: number) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      services[gi] = {
        ...services[gi],
        items: [...services[gi].items, defaultServiceItem()],
      };
      return { ...prev, services };
    });

  const removeServiceItem = (gi: number, ii: number) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      const items = [...services[gi].items];
      items.splice(ii, 1);
      services[gi] = { ...services[gi], items: items.length ? items : [defaultServiceItem()] };
      return { ...prev, services };
    });

  const updateServiceItem = (gi: number, ii: number, field: string, value: string | number) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      const items = [...services[gi].items];
      items[ii] = { ...items[ii], [field]: value };
      services[gi] = { ...services[gi], items };
      return { ...prev, services };
    });

  const addSubItem = (gi: number, ii: number) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      const items = [...services[gi].items];
      items[ii] = { ...items[ii], subItems: [...(items[ii].subItems || []), ""] };
      services[gi] = { ...services[gi], items };
      return { ...prev, services };
    });

  const updateSubItem = (gi: number, ii: number, si: number, value: string) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      const items = [...services[gi].items];
      const subItems = [...(items[ii].subItems || [])];
      subItems[si] = value;
      items[ii] = { ...items[ii], subItems };
      services[gi] = { ...services[gi], items };
      return { ...prev, services };
    });

  const removeSubItem = (gi: number, ii: number, si: number) =>
    setFormData((prev) => {
      const services = [...(prev.services || [])];
      const items = [...services[gi].items];
      const subItems = [...(items[ii].subItems || [])];
      subItems.splice(si, 1);
      items[ii] = { ...items[ii], subItems };
      services[gi] = { ...services[gi], items };
      return { ...prev, services };
    });

  /* ---------- Total calc ---------- */
  const subtotal = useMemo(
    () => (formData.services || []).reduce(
      (acc, grp) => acc + grp.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      0,
    ),
    [formData.services],
  );
  const totalAmount = (subtotal - (formData.discount || 0)) * (1 + (formData.vat || 0) / 100) - (formData.advancePaid || 0);
  if (formData.total !== totalAmount) {
    setFormData((prev) => ({ ...prev, total: totalAmount }));
  }

  /* ---------- Logo upload ---------- */
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

  /* ---------- Save ---------- */
  const handleSave = async (status: "Paid" | "Unpaid" | "Hold") => {
    // Make sure at least one service group has a non-empty item name
    const cleanedServices = (formData.services || [])
      .map((g) => ({
        serviceName: g.serviceName,
        items: g.items.filter((it) => (it.name || "").trim() !== ""),
      }))
      .filter((g) => g.items.length > 0);

    if (cleanedServices.length === 0) {
      toast.error("Add at least one line item with a description.");
      return;
    }

    setLoading(true);
    setSavingAs(status);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, services: cleanedServices, status }),
      });
      if (res.ok) {
        toast.success("Service invoice saved");
        router.push("/dashboard/service-invoices");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to save service invoice");
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
              Build a service invoice with grouped line items. Preset data can be auto-filled below.
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
              Save Draft
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
                <TabsTrigger value="details" className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger value="client" className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Client</span>
                </TabsTrigger>
                <TabsTrigger value="items" className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm">
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Services</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="gap-1.5 rounded-lg text-xs font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#5A378F] data-[state=active]:shadow-sm">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Payment</span>
                </TabsTrigger>
              </TabsList>

              {/* ====================== DETAILS TAB ====================== */}
              <TabsContent value="details" className="space-y-4 pt-4">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Wrench className="h-3.5 w-3.5" />
                    Service Invoice Details
                  </h3>

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Service Invoice Number">
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

                  {/* Row 2: Description */}
                  <div className="mt-4">
                    <Field label="Description" hint="Shown on the invoice below the title">
                      <Textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g. Professional services for November 2024"
                        rows={2}
                        className={cn(inputClass, "resize-none")}
                      />
                    </Field>
                  </div>

                  {/* Row 3: Date + Due Date + Status */}
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                        <option value="Unpaid">Due</option>
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
                        {uploadingLogo ? <Spinner className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                        {uploadingLogo ? "Uploading…" : formData.logoUrl ? "Replace" : "Upload"}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
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

                {/* ============ From: Load from Preset Company ============ */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Your Company (From)
                  </h3>

                  {/* ⬇⬇⬇ THIS IS THE "Load from Preset Company" SEARCH BAR ⬇⬇⬇ */}
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Load from Preset Company
                    </p>
                    <CompanySearch companies={presetCompanies} onSelect={applyPresetCompany} />
                    {presetCompanies.length === 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        No preset companies yet.{" "}
                        <Link href="/dashboard/companies" className="font-medium text-[#5A378F] hover:underline">
                          Add one now
                        </Link>
                      </p>
                    )}
                  </div>

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

              {/* ====================== CLIENT TAB ====================== */}
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

              {/* ====================== SERVICES TAB ====================== */}
              <TabsContent value="items" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Package className="h-3.5 w-3.5" />
                    Service Groups & Items
                  </h3>
                  <Button
                    size="sm"
                    onClick={addServiceGroup}
                    className="gap-1.5 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Service Group
                  </Button>
                </div>

                <div className="space-y-4">
                  {(formData.services || []).map((group, gi) => (
                    <div key={gi} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                      {/* Group header */}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#51B9A9]/15 text-xs font-semibold text-[#0E8A7C]">
                          {gi + 1}
                        </span>
                        <Input
                          value={group.serviceName}
                          onChange={(e) => updateServiceGroupName(gi, e.target.value)}
                          placeholder="Service group name (e.g. Design Services)"
                          className={cn(inputClass, "flex-1 font-medium")}
                        />
                        <button
                          onClick={() => removeServiceGroup(gi)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30"
                          aria-label="Remove service group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Items in this group */}
                      <div className="space-y-3">
                        {group.items.map((item, ii) => (
                          <div key={ii} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="min-w-[180px] flex-1">
                                <Field label="Description">
                                  <Input
                                    value={item.name}
                                    onChange={(e) => updateServiceItem(gi, ii, "name", e.target.value)}
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
                                    onChange={(e) => updateServiceItem(gi, ii, "quantity", Number(e.target.value))}
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
                                    onChange={(e) => updateServiceItem(gi, ii, "unitPrice", Number(e.target.value))}
                                    className={inputClass}
                                  />
                                </Field>
                              </div>
                              <button
                                onClick={() => removeServiceItem(gi, ii)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#EA2B7B] transition-colors hover:bg-[#FBEAF0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2B7B]/30"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Subtotal */}
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
                                  onChange={(e) => updateServiceItem(gi, ii, "note", e.target.value)}
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
                                  onClick={() => addSubItem(gi, ii)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#5A378F] transition-colors hover:bg-[#EEEDFE]"
                                >
                                  <Plus className="h-3 w-3" /> Add sub-item
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
                                      onChange={(e) => updateSubItem(gi, ii, si, e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeSubItem(gi, ii, si)}
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

                      <button
                        type="button"
                        onClick={() => addServiceItem(gi)}
                        className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#5A378F]/40 bg-white text-xs font-semibold text-[#5A378F] transition-all hover:border-[#5A378F]/60 hover:bg-[#EEEDFE]/40"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Item to this Group
                      </button>
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
                    <span className="text-lg font-bold text-[#0E8A7C]">
                      ৳{totalAmount.toLocaleString("en-BD", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* ====================== PAYMENT TAB ====================== */}
              <TabsContent value="payment" className="space-y-4 pt-4">
                {/* ============ Load from Preset Bank Account ============ */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <Landmark className="h-3.5 w-3.5" />
                    Load from Preset Bank Account
                  </h3>

                  <BankAccountSearch accounts={presetBankAccounts} onSelect={applyPresetBankAccount} />
                  {presetBankAccounts.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      No preset bank accounts yet.{" "}
                      <Link href="/dashboard/bank-accounts" className="font-medium text-[#5A378F] hover:underline">
                        Add one now
                      </Link>
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <CreditCard className="h-3.5 w-3.5" />
                    Payment Information — or fill in manually
                  </h3>

                  {/* Note (full width) */}
                  <div className="mb-2">
                    <Field label="Note" hint="Shown on the invoice in the payment block">
                      <Textarea
                        value={formData.paymentInfo?.note || ""}
                        onChange={(e) => updatePayment("note", e.target.value)}
                        placeholder="e.g. Please make payment within 14 days of invoice date."
                        rows={2}
                        className={cn(inputClass, "resize-none")}
                      />
                    </Field>
                  </div>

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

      {/* Hidden full-size invoice used only for PDF capture — no parent CSS transform */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}
      >
        <ServiceInvoicePreview data={formData} ref={pdfRef} />
      </div>
    </>
  );
}
