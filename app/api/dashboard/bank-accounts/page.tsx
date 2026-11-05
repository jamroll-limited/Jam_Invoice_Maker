"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Plus, Search, Edit, Trash2, X, Check, Landmark, Inbox,
} from "lucide-react";
import { BankAccountData } from "@/types/bankAccount";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
    label: "",
    accountName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    swift: "",
    routingNumber: "",
    currency: "BDT",
    note: "",
};

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

function BankForm({
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
                <Field label="Label" required>
                    <Input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Main BDT Account" className="bg-slate-50/60 focus:bg-white" autoFocus />
                </Field>
                <Field label="Currency">
                    <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20">
                        <option value="BDT">BDT</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="INR">INR</option>
                        <option value="GBP">GBP</option>
                    </select>
                </Field>
                <Field label="Account Name">
                    <Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} placeholder="John Doe" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <Field label="Account Number">
                    <Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="01234567890" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <Field label="Bank Name">
                    <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="ABC Bank" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <Field label="Branch">
                    <Input value={form.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Dhaka Main" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <Field label="SWIFT Code">
                    <Input value={form.swift} onChange={(e) => set("swift", e.target.value)} placeholder="ABCBBDDH" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <Field label="Routing Number">
                    <Input value={form.routingNumber} onChange={(e) => set("routingNumber", e.target.value)} placeholder="090000123" className="bg-slate-50/60 focus:bg-white" />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="Note">
                        <Textarea value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Optional payment note" rows={2} className="bg-slate-50/60 focus:bg-white resize-none" />
                    </Field>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={saving} className="gap-1.5"><X className="h-3.5 w-3.5" /> Cancel</Button>
                <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.label.trim()} className="gap-1.5 bg-[#5A378F] text-white hover:bg-[#4a2d7a]">
                    {saving ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />} Save Account
                </Button>
            </div>
        </div>
    );
}

export default function BankAccountsPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === "Super Admin";

    const [items, setItems] = useState<BankAccountData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BankAccountData | null>(null);

    useEffect(() => {
        fetch("/api/bank-accounts")
            .then(async (r) => {
                if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Failed"); }
                return r.json();
            })
            .then((d) => { if (Array.isArray(d)) setItems(d); })
            .catch((e) => toast.error("Failed to load: " + e.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = items.filter((c) => {
        const q = search.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.bankName.toLowerCase().includes(q) || c.accountNumber.toLowerCase().includes(q);
    });

    const handleAdd = async (data: typeof EMPTY_FORM) => {
        setSaving(true);
        try {
            const res = await fetch("/api/bank-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            const j = await res.json();
            if (res.ok) { setItems((p) => [j, ...p].sort((a, b) => a.label.localeCompare(b.label))); setShowAdd(false); toast.success("Account added"); }
            else toast.error(j.message || "Failed");
        } catch { toast.error("An error occurred"); } finally { setSaving(false); }
    };

    const handleEdit = async (id: string, data: typeof EMPTY_FORM) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/bank-accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            const j = await res.json();
            if (res.ok) { setItems((p) => p.map((c) => (c._id === id ? j : c))); setEditingId(null); toast.success("Account updated"); }
            else toast.error(j.message || "Failed");
        } catch { toast.error("An error occurred"); } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget._id;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
            if (res.ok) { setItems((p) => p.filter((c) => c._id !== id)); setDeleteTarget(null); toast.success("Account moved to trash"); }
            else toast.error("Failed");
        } catch { toast.error("An error occurred"); } finally { setDeletingId(null); }
    };

    return (
        <div className="space-y-6">
            <DeleteConfirmModal open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }} itemName={deleteTarget?.label} itemLabel="bank account" onConfirm={handleDelete} isDeleting={!!deletingId} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <span>Manage</span><span aria-hidden="true">/</span><span className="text-slate-600">Bank Accounts</span>
                    </nav>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Bank Accounts</h1>
                    <p className="mt-1 text-sm text-slate-500 md:text-base">Preset bank / payment details — auto-filled into invoices.</p>
                </div>
                {isSuperAdmin && !showAdd && (
                    <Button onClick={() => setShowAdd(true)} className="gap-2 self-start rounded-lg bg-[#5A378F] text-white hover:bg-[#4a2d7a] sm:self-auto">
                        <Plus className="h-4 w-4" /> Add Account
                    </Button>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-900">All Bank Accounts{!loading && <span className="ml-2 text-sm font-normal text-slate-400">({items.length})</span>}</h2>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-8 pr-3 text-sm text-slate-700 focus:border-[#5A378F]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A378F]/20" />
                    </div>
                </div>

                {showAdd && isSuperAdmin && (
                    <div className="border-b border-slate-100 bg-[#EEEDFE]/30 px-5 py-5">
                        <div className="rounded-xl border border-[#5A378F]/15 bg-white p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5A378F]/10 text-[#5A378F]"><Landmark className="h-4 w-4" /></span>
                                <h3 className="text-sm font-semibold text-slate-900">New Bank Account</h3>
                            </div>
                            <BankForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
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
                            <p className="text-sm font-semibold text-slate-700">{search ? "No accounts match your search" : "No bank accounts yet"}</p>
                            {isSuperAdmin && !search && !showAdd && (
                                <Button onClick={() => setShowAdd(true)} className="mt-2 gap-1.5 rounded-lg bg-[#5A378F] text-white hover:bg-[#4a2d7a]"><Plus className="h-3.5 w-3.5" /> Add Account</Button>
                            )}
                        </div>
                    ) : (
                        filtered.map((c) => (
                            <div key={c._id} className="px-5 py-5">
                                {editingId === c._id ? (
                                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-5">
                                        <div className="mb-4 flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-200/60 text-amber-800"><Edit className="h-4 w-4" /></span>
                                            <h3 className="text-sm font-semibold text-slate-900">Edit Bank Account</h3>
                                        </div>
                                        <BankForm initial={{
                                            label: c.label, accountName: c.accountName, accountNumber: c.accountNumber,
                                            bankName: c.bankName, branch: c.branch, swift: c.swift,
                                            routingNumber: c.routingNumber, currency: c.currency, note: c.note ?? "",
                                        }} onSave={(d) => handleEdit(c._id, d)} onCancel={() => setEditingId(null)} saving={saving} />
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5A378F]/10 text-[#5A378F]"><Landmark className="h-5 w-5" /></div>
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-slate-900">{c.label}</p>
                                                <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{c.currency}</span>
                                                {c.bankName && <span className="text-xs text-slate-500">· {c.bankName}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                {c.accountName && <span><span className="text-slate-400">Name:</span> {c.accountName}</span>}
                                                {c.accountNumber && <span className="font-mono"><span className="text-slate-400">Acct:</span> {c.accountNumber}</span>}
                                                {c.branch && <span><span className="text-slate-400">Branch:</span> {c.branch}</span>}
                                                {c.swift && <span className="font-mono"><span className="text-slate-400">SWIFT:</span> {c.swift}</span>}
                                                {c.routingNumber && <span className="font-mono"><span className="text-slate-400">Routing:</span> {c.routingNumber}</span>}
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
                        <span>Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of <span className="font-semibold text-slate-700">{items.length}</span></span>
                    </div>
                )}
            </div>
        </div>
    );
}