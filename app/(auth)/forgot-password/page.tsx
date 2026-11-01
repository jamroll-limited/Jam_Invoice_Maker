"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, Plus, CheckCircle2, ArrowLeft, Clock } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    /* ---------- Submit (unchanged logic — simulated) ---------- */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setSubmitted(true);
            toast.success("If an account exists, a reset link has been requested.");
        } catch {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-100/70 p-4">
            <div className="flex min-h-120 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)]">
                {/* Left brand panel */}
                <div className="relative hidden w-80 shrink-0 flex-col justify-between overflow-hidden bg-[#15152b] p-8 md:flex">
                    {/* Decorative gradient blobs */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5A378F]/30 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#51B9A9]/15 blur-3xl"
                    />

                    {/* Brand mark */}
                    <div className="relative flex items-center gap-3">
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6A45BF] to-[#4A2D7A] shadow-[0_4px_12px_-2px_rgba(90,55,143,0.5)]">
                            <Plus className="h-4 w-4 rotate-45 text-white" aria-hidden="true" />
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#15152b] bg-[#51B9A9]" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight text-white">
                            Jamroll
                        </span>
                    </div>

                    {/* Tagline */}
                    <div className="relative">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7F77DD]">
                            Reset password
                        </p>
                        <h2 className="mb-3 text-2xl font-semibold leading-snug tracking-tight text-[#EEEDFE]">
                            Forgot your password? We&apos;ll help you get back in.
                        </h2>
                        <p className="text-sm leading-relaxed text-white/40">
                            Enter your account email and we&apos;ll send a reset link, or ask your Super Admin to reset it for you.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="relative flex items-center gap-2 text-xs text-white/40">
                        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                        Secure password recovery
                    </div>
                </div>

                {/* Right form panel */}
                <div className="flex flex-1 flex-col justify-center bg-white px-8 py-10 sm:px-12">
                    {/* Mobile brand mark */}
                    <div className="mb-6 flex items-center gap-3 md:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6A45BF] to-[#4A2D7A]">
                            <Plus className="h-4 w-4 rotate-45 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight text-slate-900">
                            Jamroll
                        </span>
                    </div>

                    {!submitted ? (
                        <>
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Forgot password
                            </h1>
                            <p className="mb-7 mt-1 text-sm text-slate-500">
                                Enter the email associated with your account
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="email"
                                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
                                    >
                                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-slate-50/60 focus:bg-white"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full gap-2 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] transition-all hover:bg-[#4a2d7a] disabled:opacity-50"
                                >
                                    {loading ? "Sending…" : "Send reset link"}
                                    {!loading && <ArrowRight className="h-4 w-4" />}
                                </Button>
                            </form>

                            <p className="mt-6 text-center text-sm text-slate-500">
                                Remembered your password?{" "}
                                <Link
                                    href="/login"
                                    className="font-semibold text-[#5A378F] transition-colors hover:text-[#4a2d7a] hover:underline"
                                >
                                    Back to sign in
                                </Link>
                            </p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            {/* Success icon */}
                            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E1F5EE] text-[#0E8A7C] ring-1 ring-inset ring-[#51B9A9]/20">
                                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                                Check your inbox
                            </h1>
                            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                                If an account exists for{" "}
                                <span className="font-semibold text-slate-700">{email}</span>, a reset link
                                has been requested.
                            </p>

                            {/* Helper info card */}
                            <div className="mt-6 w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF8E1] text-[#7A5C00]">
                                        <Clock className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">
                                            Didn&apos;t get an email?
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                            If you don&apos;t receive an email within 10 minutes, please contact your
                                            Super Admin to have your password reset manually from the Users admin panel.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                className="mt-6 gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                                <Link href="/login">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back to sign in
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}