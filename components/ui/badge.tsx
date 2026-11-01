import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A378F]/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#E1F5EE] text-[#085041] ring-1 ring-inset ring-[#51B9A9]/20",
        secondary:
          "bg-[#EEEDFE] text-[#3C3489] ring-1 ring-inset ring-[#5A378F]/20",
        destructive:
          "bg-[#FBEAF0] text-[#72243E] ring-1 ring-inset ring-[#EA2B7B]/20",
        warning:
          "bg-[#FFF8E1] text-[#7A5C00] ring-1 ring-inset ring-[#E0B400]/20",
        outline:
          "border border-slate-200 text-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }