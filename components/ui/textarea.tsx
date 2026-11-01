import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-base text-slate-900 transition-all outline-none placeholder:text-slate-400 focus-visible:border-[#5A378F]/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#5A378F]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }