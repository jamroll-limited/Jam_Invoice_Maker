"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Phone, User, UserPlus, Plus, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------- Register (unchanged logic) ---------- */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Registration successful! You can now log in.");
        router.push("/login");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100/70 p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)]">
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
              Get started
            </p>
            <h2 className="mb-3 text-2xl font-semibold leading-snug tracking-tight text-[#EEEDFE]">
              Start managing invoices and quotations with ease
            </h2>
            <p className="text-sm leading-relaxed text-white/40">
              Generate professional invoices, send quotations, and streamline your billing workflow.
            </p>

            {/* Feature list */}
            <ul className="mt-6 space-y-2.5">
              {[
                "Professional invoice & quotation templates",
                "Client management with preset autofill",
                "PDF export and print-ready documents",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-white/60">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#51B9A9]" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="relative flex items-center gap-2 text-xs text-white/40">
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Free to get started — no card required
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

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
          <p className="mb-7 mt-1 text-sm text-slate-500">
            Fill in your details to get started
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name + Phone */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
                >
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  Full name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-50/60 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-50/60 focus:bg-white"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-slate-50/60 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400">
                Must be at least 6 characters
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] transition-all hover:bg-[#4a2d7a] disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#5A378F] transition-colors hover:text-[#4a2d7a] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}