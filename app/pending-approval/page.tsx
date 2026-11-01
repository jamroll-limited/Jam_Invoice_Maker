"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Clock, ShieldCheck } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100/70 p-4">
      <Card className="w-full max-w-md overflow-hidden text-center">
        {/* Brand band */}
        <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-[#5A378F] via-[#7F77DD] to-[#51B9A9]" />

        <CardHeader className="pb-2">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF8E1] text-[#7A5C00] ring-1 ring-inset ring-[#E0B400]/20">
              <Clock className="h-8 w-8" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
            Account Pending
          </CardTitle>
          <CardDescription className="text-slate-500">
            Your account is waiting for administrator approval.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          <p className="text-sm leading-relaxed text-slate-600">
            You have successfully registered, but a Super Admin needs to approve your account before you can access the Jamroll Invoicemaker system.
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#FFF8E1]/60 px-3 py-2 text-xs text-[#7A5C00]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>You&apos;ll be able to sign in once approved.</span>
          </div>
        </CardContent>

        <CardFooter className="justify-center border-t border-slate-100 bg-slate-50/50 py-4">
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Log out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}