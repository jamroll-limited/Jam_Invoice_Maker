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
    Inbox,
} from "lucide-react";
import { CompanyData } from "@/types/company";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { name: "", email: "", phone: "", address: "" };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {label}{required && <span className="ml-0.5 text-[#EA2B7B]">*</span>}
            </Label>
            {children}
        </div>
    );
}

function CompanyForm({
    initial, onSave, onCancel, saving,
}: {
    initial: typeof EMPTY_FORM;
    onSave: (data: typeof EMPTY_FORM) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState(initial);
    const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Company Name" required>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your Company Ltd." className="bg-slate-50/60 focus:bg-white" autoFocus />
                </Field>
                <Field label="Email">
                    <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="billing@yourcompany.com" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <Field label="Phone">
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+880 1700 000 000" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="Address">
                        <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Company address" rows={2} className="bg-slate-50/60 focus:bg-white resize-none" />
                    </Field>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={saving} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.name.trim()} className="gap-1.5 bg-[#5A378F] text-white hover:bg-[#4a2d7a]">
                    {saving ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />} Save Company
                </Button>
            </div>
        </div>
    );
}

export default function CompaniesPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === "Super Admin";

    const [companies, setCompanies] = useState<CompanyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CompanyData | null>(null);

    useEffect(() => {
        fetch("/api/companies")
            .then(async (r) => {
                if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Failed"); }
                return r.json();
            })
            .then((d) => { if (Array.isArray(d)) setCompanies(d); })
            .catch((e) => toast.error("Failed to load companies: " + e.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = companies.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });

    const handleAdd = async (data: typeof EMPTY_FORM) => {
        setSaving(true);
        try {
            const res = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            const j = await res.json();
            if (res.ok) { setCompanies((p) => [j, ...p].sort((a, b) => a.name.localeCompare(b.name))); setShowAdd(false); toast.success("Company added"); }
            else toast.error(j.message || "Failed");
        } catch { toast.error("An error occurred"); } finally { setSaving(false); }
    };

    const handleEdit = async (id: string, data: typeof EMPTY_FORM) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/companies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            const j = await res.json();
            if (res.ok) { setCompanies((p) => p.map((c) => (c._id === id ? j : c))); setEditingId(null); toast.success("Company updated"); }
            else toast.error(j.message || "Failed");
        } catch { toast.error("An error occurred"); } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget._id;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
            if (res.ok) { setCompanies((p) => p.filter((c) => c._id !== id)); setDeleteTarget(null); toast.success("Company moved to trash"); }
            else toast.error("Failed");
        } catch { toast.error("An error occurred"); } finally { setDeletingId(null); }
    };

    return (
        <div className="space-y-6">
            <DeleteConfirmModal open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }} itemName={deleteTarget?.name} itemLabel="company" onConfirm={handleDelete} isDeleting={!!deletingId} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <span>Manage</span><span aria-hidden="true">/</span><span className="text-slate-600">Companies</span>
                    </nav>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Companies</h1>
                    <p className="mt-1 text-sm text-slate-500 md:text-base">Preset &quot;Your Company (From)&quot; info — auto-filled into invoices & quotations.</p>
                </div>
                {isSuperAdmin && !showAdd && (
                    <Button onClick={() => setShowAdd(true)} className="gap-2 self-start rounded-lg bg-[#5A378F] text-white hover:bg-[#4a2d7a] sm:self-auto">
                        <Plus className="h-4 w-4" /> Add Company
                    </Button>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">All Companies{!loading && <span className="ml-2 text-sm font-normal text-slate-400">({companies.length})</span>}</h2>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-sm text-slate-700 focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20" />
                    </div>
                </div>

                {showAdd && isSuperAdmin && (
                    <div className="border-b border-slate-100 bg-[#EEEDFE]/30 px-5 py-5">
                        <div className="rounded-xl border border-[#5A378F]/15 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5A378F]/10 text-[#5A378F]"><Building2 className="h-4 w-4" /></span>
                                <h3 className="text-sm font-semibold text-slate-900">New Company</h3>
                            </div>
                            <CompanyForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
                        </div>
                    </div>
                )}

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 px-5 py-5">
                                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-60" /><Skeleton className="h-3 w-48" /></div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-7 w-7" /></div>
                            <p className="text-sm font-semibold text-slate-700">{search ? "No companies match your search" : "No companies yet"}</p>
                            {isSuperAdmin && !search && !showAdd && (
                                <Button onClick={() => setShowAdd(true)} className="mt-2 gap-1.5 rounded-lg bg-[#5A378F] text-white hover:bg-[#4a2d7a]"><Plus className="h-3.5 w-3.5" /> Add Company</Button>
                            )}
                        </div>
                    ) : (
                        filtered.map((c) => (
                            <div key={c._id} className="px-5 py-5">
                                {editingId === c._id ? (
                                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-5">
                                        <div className="mb-4 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-200/60 text-amber-800"><Edit className="h-4 w-4" /></span>
                                            <h3 className="text-sm font-semibold text-slate-900">Edit Company</h3>
                                        </div>
                                        <CompanyForm initial={{ name: c.name, email: c.email, phone: c.phone, address: c.address }} onSave={(d) => handleEdit(c._id, d)} onCancel={() => setEditingId(null)} saving={saving} />
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5A378F]/10 text-[#5A378F]"><Building2 className="h-5 w-5" /></div>
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <p className="font-semibold text-slate-900">{c.name}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                                                {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-[#5A378F]"><Mail className="h-3.5 w-3.5 text-slate-400" /><span className="font-mono text-xs">{c.email}</span></a>}
                                                {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-[#5A378F]"><Phone className="h-3.5 w-3.5 text-slate-400" /><span className="font-mono text-xs">{c.phone}</span></a>}
                                                {c.address && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span className="truncate">{c.address}</span></span>}
                                            </div>
                                        </div>
                                        {isSuperAdmin && (
                                            <div className="flex shrink-0 items-center gap-0.5">
                                                <button onClick={() => setEditingId(c._id)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => setDeleteTarget(c)} disabled={deletingId === c._id} className="rounded-md p-1.5 text-[#EA2B7B] hover:bg-[#FBEAF0] disabled:opacity-50" title="Delete">
                                                    {deletingId === c._id ? <Spinner className="h-4 w-4 text-[#EA2B7B]" /> : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-500 md:text-sm">
                        <span>Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{companies.length}</span></span>
                    </div>
                )}
            </div>
        </div>
    );
}