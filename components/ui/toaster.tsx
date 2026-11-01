"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            icons={{
                success: (
                    <CircleCheckIcon className="size-4" />
                ),
                info: (
                    <InfoIcon className="size-4" />
                ),
                warning: (
                    <TriangleAlertIcon className="size-4" />
                ),
                error: (
                    <OctagonXIcon className="size-4" />
                ),
                loading: (
                    <Loader2Icon className="size-4 animate-spin" />
                ),
            }}
            toastOptions={{
                classNames: {
                    toast: "cn-toast",
                    success: "!bg-[#E1F5EE] !text-[#085041] !border-[#51B9A9]/20",
                    error: "!bg-[#FBEAF0] !text-[#72243E] !border-[#EA2B7B]/20",
                    warning: "!bg-[#FFF8E1] !text-[#7A5C00] !border-[#E0B400]/20",
                    info: "!bg-[#EEEDFE] !text-[#3C3489] !border-[#5A378F]/20",
                },
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            {...props}
        />
    )
}

export { Toaster }