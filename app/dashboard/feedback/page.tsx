"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Send, MessageSquare, Inbox, Quote } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Star rating — interactive, keyboard accessible                     */
/* ------------------------------------------------------------------ */
function StarRating({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "lg" | "sm";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const sizeClass = size === "lg" ? "h-8 w-8" : "h-3.5 w-3.5";

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(null)}
          className={cn(
            "rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A378F]/30",
          )}
          aria-checked={value === star}
          role="radio"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              star <= display
                ? "fill-[#F9C551] text-[#F9C551]"
                : "fill-transparent text-slate-200 hover:text-slate-300",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback avatar — initials in a tinted circle                      */
/* ------------------------------------------------------------------ */
function FeedbackAvatar({ name }: { name: string }) {
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
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        tint,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function FeedbackPage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  /* ---------- Admin fetch (unchanged logic) ---------- */
  useEffect(() => {
    if (session?.user?.role === "Super Admin") {
      setLoadingAdmin(true);
      fetch("/api/feedback")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFeedbacks(data);
        })
        .catch(() => { })
        .finally(() => setLoadingAdmin(false));
    }
  }, [session?.user?.role]);

  /* ---------- Submit (unchanged logic) ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, rating }),
      });

      if (res.ok) {
        toast.success("Feedback submitted successfully!");
        setMessage("");
        setRating(5);

        // If admin, refresh list to show the new entry
        if (session?.user?.role === "Super Admin") {
          fetch("/api/feedback")
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data)) setFeedbacks(data);
            })
            .catch(() => { });
        }
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = session?.user?.role === "Super Admin";

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <nav className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>Manage</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-600">Feedback</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Feedback
        </h1>
        <p className="mt-1 text-sm text-slate-500 md:text-base">
          Send your thoughts, suggestions, or report issues to the admin team.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submit form */}
        <Card className="overflow-hidden rounded-2xl border-slate-200/70 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
          {/* Gradient header band */}
          <div aria-hidden="true" className="h-1.5 w-full bg-gradient-to-r from-[#5A378F] via-[#7F77DD] to-[#51B9A9]" />
          <CardHeader className="pb-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5A378F]/10 text-[#5A378F]">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
                Submit Feedback
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-500">
              We&apos;d love to hear your thoughts and suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Rating
                </Label>
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                  <span className="text-sm font-medium text-slate-500">
                    {rating === 5 && "Excellent"}
                    {rating === 4 && "Good"}
                    {rating === 3 && "Average"}
                    {rating === 2 && "Poor"}
                    {rating === 1 && "Very poor"}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Message <span className="text-[#EA2B7B]">*</span>
                </Label>
                <Textarea
                  placeholder="Tell us what you think…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="resize-none bg-slate-50/60 text-sm focus:bg-white"
                />
                <p className="text-xs text-slate-400">
                  {message.length} characters
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting || !message.trim()}
                className="gap-2 self-start rounded-lg bg-[#5A378F] text-white shadow-[0_2px_8px_-2px_rgba(90,55,143,0.5)] transition-all hover:bg-[#4a2d7a] disabled:opacity-50"
              >
                {submitting ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {submitting ? "Submitting…" : "Send Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin view */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">User Feedback</h2>
              {!loadingAdmin && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {feedbacks.length} {feedbacks.length === 1 ? "entry" : "entries"}
                </span>
              )}
            </div>

            {loadingAdmin ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="rounded-2xl border-slate-200/70 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-2.5 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Inbox className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">No feedback yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    User feedback will appear here once submitted.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => (
                  <Card
                    key={fb._id}
                    className="overflow-hidden rounded-2xl border-slate-200/70 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.06)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.1)]"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FeedbackAvatar name={fb.userId?.name || "Unknown"} />
                          <div>
                            <CardTitle className="text-sm font-semibold text-slate-900">
                              {fb.userId?.name || "Unknown"}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                              {new Date(fb.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <StarRating
                          value={fb.rating}
                          onChange={() => { }}
                          size="sm"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-2">
                      <Quote
                        className="absolute -top-1 left-0 h-6 w-6 text-slate-100"
                        aria-hidden="true"
                      />
                      <p className="relative pl-7 text-sm leading-relaxed text-slate-600">
                        {fb.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Non-admin encouragement */}
        {!isAdmin && (
          <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <MessageSquare className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Your voice matters</p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Share your experience, report bugs, or suggest features. Every submission helps us improve.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}