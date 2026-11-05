"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Landmark } from "lucide-react";
import { BankAccountData } from "@/types/bankAccount";
import { cn } from "@/lib/utils";

export function BankAccountSearch({
    accounts,
    onSelect,
}: {
    accounts: BankAccountData[];
    onSelect: (b: BankAccountData) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query.trim()
        ? accounts.filter(
            (b) =>
                b.label.toLowerCase().includes(query.toLowerCase()) ||
                b.bankName.toLowerCase().includes(query.toLowerCase()) ||
                b.accountNumber.toLowerCase().includes(query.toLowerCase()),
        )
        : accounts;

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
                    className="pl-9 bg-slate-50/60 text-sm focus:bg-white"
                    placeholder="Search preset bank accounts…"
                    value={query}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                />
            </div>
            {open && (
                <div className="absolute z-40 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] [scrollbar-width:thin]">
                    {filtered.length === 0 && query.trim() && (
                        <p className="px-4 py-3 text-sm text-slate-400">No bank accounts found.</p>
                    )}
                    {filtered.map((b) => (
                        <button
                            key={b._id}
                            type="button"
                            onClick={() => { onSelect(b); setQuery(""); setOpen(false); }}
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A378F]/10 text-[#5A378F]">
                                <Landmark className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">{b.label}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                    {[b.bankName, b.accountNumber && `Acct ${b.accountNumber}`, b.currency].filter(Boolean).join(" · ")}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}