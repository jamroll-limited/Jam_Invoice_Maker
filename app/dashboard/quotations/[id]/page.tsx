"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft, FileCheck, AlertCircle } from "lucide-react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardTitle } from "../../layout";

export default function ViewQuotationPage() {
  const { id } = useParams();
  const router = useRouter();
  const setPageTitle = useDashboardTitle();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  /* ---------- Data fetching ---------- */
  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setData(data);
        if (data?.invoiceNumber) {
          setPageTitle(`Quotations / ${data.invoiceNumber}`);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Quotation not found");
        setLoading(false);
      });
  }, [id, setPageTitle]);

  /* ---------- PDF download (unchanged logic) ---------- */
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.invoiceNumber || "quotation"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  /* ---------- Print (unchanged) ---------- */
  const handlePrint = () => window.print();

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>

        <div className="flex justify-center rounded-2xl border border-slate-200/70 bg-slate-100/70 p-8">
          <div className="w-[612px] space-y-6 rounded-xl bg-white p-8">
            <div className="flex justify-between">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="w-40 space-y-2">
                <Skeleton className="ml-auto h-3 w-16" />
                <Skeleton className="ml-auto h-3 w-28" />
                <Skeleton className="ml-auto h-3 w-24" />
                <Skeleton className="ml-auto mt-3 h-3 w-20" />
                <Skeleton className="ml-auto h-3 w-28" />
                <Skeleton className="ml-auto h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2 border-t pt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 border-b border-slate-100 py-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="ml-auto h-4 w-12" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <div className="w-48 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Not found ---------- */
  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAF0] text-[#EA2B7B]">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Document not found</p>
          <p className="mt-1 text-xs text-slate-400">
            This quotation may have been deleted, or you don&apos;t have access to view it.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-2 gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back
        </Button>
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span>Billing</span>
              <span aria-hidden="true">/</span>
              <span>Quotations</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-600">{data.invoiceNumber || data.name}</span>
            </nav>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EA2B7B]/10 text-[#EA2B7B]">
                <FileCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {data.invoiceNumber || data.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="gap-1.5 rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] hover:bg-[#4a2d7a]"
          >
            {downloading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/70 p-8 print:border-none print:bg-white print:p-0 print:overflow-visible">
        <div className="origin-top scale-75 transition-transform md:scale-100 print:scale-100">
          <InvoicePreview data={data} />
        </div>
      </div>
    </div>
  );
}