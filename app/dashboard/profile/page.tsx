"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  ShieldCheck,
  UserCircle2,
  Clock,
  Pencil,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Small presentational helpers — kept local to avoid new files       */
/* ------------------------------------------------------------------ */

function StatTile({
  icon: Icon,
  label,
  children,
  accent = "violet",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  accent?: "violet" | "teal" | "pink";
}) {
  const accentMap = {
    violet: "bg-[#5A378F]/10 text-[#5A378F]",
    teal: "bg-[#51B9A9]/10 text-[#0E8A7C]",
    pink: "bg-[#EA2B7B]/10 text-[#EA2B7B]",
  } as const;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {children}
          </div>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            accentMap[accent]
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <div
          className={cn(
            "mt-0.5 truncate text-sm font-medium text-slate-900",
            mono && "font-mono tracking-tight"
          )}
        >
          {value || <span className="text-slate-400">—</span>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge resolver                                              */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status?: string }) {
  const normalized = (status || "pending").toLowerCase();

  const config: Record<
    string,
    { className: string; icon: React.ComponentType<{ className?: string }>; label: string }
  > = {
    approved: {
      className: "border-[#51B9A9]/30 bg-[#E1F5EE] text-[#085041] hover:bg-[#E1F5EE]",
      icon: CheckCircle2,
      label: status || "Approved",
    },
    pending: {
      className: "border-[#AFA9EC]/40 bg-[#EEEDFE] text-[#3C3489] hover:bg-[#EEEDFE]",
      icon: Hourglass,
      label: status || "Pending",
    },
  };

  const c = config[normalized] ?? config.pending;
  const Icon = c.icon;

  return (
    <Badge className={cn("gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", c.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="capitalize">{c.label}</span>
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const name = session?.user?.name;
  const email = session?.user?.email;
  const role = session?.user?.role;
  const userStatus = session?.user?.status;
  const image = session?.user?.image;

  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const loading = status === "loading";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>Account</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600">Profile</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            Your personal account information and access settings.
          </p>
        </div>
      </div>

      {/* Hero identity card */}
      <Card className="relative overflow-hidden border-slate-200/70 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        {/* Decorative header band */}
        <div
          aria-hidden="true"
          className="h-24 w-full bg-gradient-to-r from-[#5A378F] via-[#6A45BF] to-[#7F77DD]"
        />
        <CardContent className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Avatar with ring */}
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-[0_4px_16px_-4px_rgba(15,23,42,0.2)]">
                  {image ? <AvatarImage src={image} alt={name || "User avatar"} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#6A45BF] to-[#4A2D7A] text-2xl font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white bg-[#51B9A9]"
                  aria-label="Active"
                />
              </div>

              {/* Name + email */}
              <div className="pb-1">
                {loading ? (
                  <>
                    <div className="h-7 w-44 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                        {name || "User"}
                      </h2>
                      <StatusBadge status={userStatus} />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="truncate">{email || "No email on file"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Edit action (non-functional placeholder — wire to your own route/handler) */}
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-all",
                "hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/40"
              )}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit profile
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={ShieldCheck} label="Role" accent="violet">
          <span className="capitalize">{role || "—"}</span>
        </StatTile>
        <StatTile icon={UserCircle2} label="Account status" accent="teal">
          <span className="capitalize">{userStatus || "—"}</span>
        </StatTile>
        <StatTile icon={Clock} label="Session" accent="pink">
          Active now
        </StatTile>
      </div>

      {/* Detailed account information */}
      <Card className="max-w-3xl border-slate-200/70 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
            Account details
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            View your account settings, identity, and access permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <InfoRow icon={UserCircle2} label="Full name" value={name} />
          <InfoRow icon={Mail} label="Email address" value={email} mono />
          <InfoRow icon={ShieldCheck} label="Assigned role" value={<span className="capitalize">{role}</span>} />
          <InfoRow
            icon={CheckCircle2}
            label="Account status"
            value={<StatusBadge status={userStatus} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}