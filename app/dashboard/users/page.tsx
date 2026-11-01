"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Check, X, ShieldCheck, ShieldOff, Lock, Inbox, Users as UsersIcon, Mail,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  User avatar — initials in a tinted circle                          */
/* ------------------------------------------------------------------ */
function UserAvatar({ name }: { name: string }) {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tints = [
    "bg-[#5A378F]/10 text-[#5A378F]",
    "bg-[#51B9A9]/10 text-[#0E8A7C]",
    "bg-[#EA2B7B]/10 text-[#EA2B7B]",
    "bg-[#E0B400]/10 text-[#7A5C00]",
    "bg-[#3C3489]/10 text-[#3C3489]",
  ];
  const tint = tints[(name?.charCodeAt(0) || 0) % tints.length];

  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        tint
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Action button — consistent styling for all row actions             */
/* ------------------------------------------------------------------ */
function ActionButton({
  onClick,
  disabled,
  isLoading,
  icon: Icon,
  iconClass,
  children,
  hoverClass,
}: {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  children: React.ReactNode;
  hoverClass: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-all",
        "hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30",
        hoverClass
      )}
    >
      {isLoading ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : (
        <Icon className={cn("h-3.5 w-3.5", iconClass)} />
      )}
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---------- Update role (unchanged logic) ---------- */
  const handleUpdateRole = async (id: string, role: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast.success(`User role updated to ${role}`);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update role");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------- Update status (unchanged logic) ---------- */
  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`User marked as ${status}`);
        fetchUsers();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------- Access control (unchanged) ---------- */
  if (session?.user?.role !== "Super Admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Access denied</p>
          <p className="mt-1 text-xs text-slate-400">
            You don't have permission to view this page. Contact a Super Admin if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Stats ---------- */
  const stats = {
    total: users.length,
    approved: users.filter((u) => u.status === "approved").length,
    pending: users.filter((u) => u.status === "pending").length,
    admins: users.filter((u) => u.role === "Super Admin").length,
  };

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>Manage</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600">Users</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 md:text-base">
            Approve or reject employee accounts and manage access roles.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Users", value: stats.total, sub: "registered", icon: UsersIcon, iconClass: "bg-[#EEEDFE] text-[#5A378F]" },
          { label: "Approved", value: stats.approved, sub: "active access", icon: Check, iconClass: "bg-[#E1F5EE] text-[#085041]" },
          { label: "Pending", value: stats.pending, sub: "awaiting review", icon: Inbox, iconClass: "bg-[#FFF8E1] text-[#7A5C00]" },
          { label: "Admins", value: stats.admins, sub: "super admin", icon: ShieldCheck, iconClass: "bg-[#FBEAF0] text-[#72243E]" },
        ].map(({ label, value, sub, icon: Icon, iconClass }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {loading ? <Skeleton className="h-7 w-10" /> : value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{sub}</p>
              </div>
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
            System Users
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Manage access to Jamroll Invoicemaker.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="pl-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Name
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Email
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Role
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="pr-6 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [
                    ["w-28", "w-40", "w-20", "w-16", "w-24"],
                    ["w-24", "w-36", "w-24", "w-16", "w-24"],
                    ["w-32", "w-44", "w-20", "w-16", "w-24"],
                    ["w-24", "w-40", "w-24", "w-16", "w-24"],
                  ].map((widths, ri) => (
                    <TableRow key={ri} className="border-b border-slate-100">
                      {widths.map((w, ci) => (
                        <TableCell key={ci} className={cn(ci === 0 && "pl-6", ci === widths.length - 1 && "pr-6")}>
                          <Skeleton className={cn("h-4", w)} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow className="border-b border-slate-100">
                    <TableCell colSpan={5} className="py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Inbox className="h-7 w-7" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">No users found</p>
                          <p className="mt-1 text-xs text-slate-400">
                            New employee registrations will appear here for approval.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isCurrentUser = u._id === session?.user?.id;
                    const isSuperAdmin = u.role === "Super Admin";
                    const isUpdating = updatingId === u._id;

                    return (
                      <TableRow
                        key={u._id}
                        className={cn(
                          "border-b border-slate-100 transition-colors hover:bg-slate-50/70",
                          isUpdating && "opacity-60",
                          isCurrentUser && "bg-[#EEEDFE]/20"
                        )}
                      >
                        {/* Name + avatar */}
                        <TableCell className="pl-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.name} />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{u.name}</p>
                              {isCurrentUser && (
                                <span className="text-[11px] font-medium text-[#5A378F]">
                                  That's you
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="py-3.5">
                          <a
                            href={`mailto:${u.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-500 transition-colors hover:text-[#5A378F]"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            <span className="font-mono text-xs">{u.email}</span>
                          </a>
                        </TableCell>

                        {/* Role */}
                        <TableCell className="py-3.5">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEAF0] px-2.5 py-1 text-xs font-semibold text-[#72243E] ring-1 ring-inset ring-[#EA2B7B]/20">
                              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="text-sm text-slate-600">{u.role}</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3.5">
                          <Badge
                            className={cn(
                              "rounded-full border-0 px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
                              u.status === "approved" && "bg-[#E1F5EE] text-[#085041] ring-[#51B9A9]/20",
                              u.status === "rejected" && "bg-[#FBEAF0] text-[#72243E] ring-[#EA2B7B]/20",
                              u.status === "pending" && "bg-[#EEEDFE] text-[#3C3489] ring-[#5A378F]/20"
                            )}
                          >
                            {u.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="pr-6 py-3.5 text-right">
                          {isCurrentUser ? (
                            <span className="text-xs font-medium text-slate-400">—</span>
                          ) : (
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {!isSuperAdmin && (
                                <>
                                  {(u.status === "pending" || u.status === "rejected") && (
                                    <ActionButton
                                      onClick={() => handleUpdateStatus(u._id, "approved")}
                                      disabled={isUpdating}
                                      isLoading={isUpdating}
                                      icon={Check}
                                      iconClass="text-[#51B9A9]"
                                      hoverClass="hover:bg-[#E1F5EE] hover:text-[#085041] hover:border-[#51B9A9]/30"
                                    >
                                      Approve
                                    </ActionButton>
                                  )}
                                  {(u.status === "pending" || u.status === "approved") && (
                                    <ActionButton
                                      onClick={() => handleUpdateStatus(u._id, "rejected")}
                                      disabled={isUpdating}
                                      isLoading={isUpdating}
                                      icon={X}
                                      iconClass="text-[#EA2B7B]"
                                      hoverClass="hover:bg-[#FBEAF0] hover:text-[#72243E] hover:border-[#EA2B7B]/30"
                                    >
                                      Reject
                                    </ActionButton>
                                  )}
                                  <ActionButton
                                    onClick={() => handleUpdateRole(u._id, "Super Admin")}
                                    disabled={isUpdating}
                                    isLoading={isUpdating}
                                    icon={ShieldCheck}
                                    iconClass="text-[#5A378F]"
                                    hoverClass="hover:bg-[#EEEDFE] hover:text-[#3C3489] hover:border-[#5A378F]/30"
                                  >
                                    Make Admin
                                  </ActionButton>
                                </>
                              )}
                              {isSuperAdmin && (
                                <ActionButton
                                  onClick={() => handleUpdateRole(u._id, "Employee")}
                                  disabled={isUpdating}
                                  isLoading={isUpdating}
                                  icon={ShieldOff}
                                  iconClass="text-[#7A5C00]"
                                  hoverClass="hover:bg-[#FFF8E1] hover:text-[#7A5C00] hover:border-[#E0B400]/30"
                                >
                                  Remove Admin
                                </ActionButton>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-6 py-3 text-xs text-slate-500 md:text-sm">
              <span>
                <span className="font-semibold text-slate-700">{users.length}</span> user
                {users.length !== 1 ? "s" : ""} total
              </span>
              <span className="text-slate-400">
                <span className="font-semibold text-[#085041]">{stats.approved}</span> approved ·{" "}
                <span className="font-semibold text-[#7A5C00]">{stats.pending}</span> pending
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}