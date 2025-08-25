import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-white text-gray-900 shadow hover:bg-gray-100",
        secondary: "border-transparent bg-gray-800 text-white hover:bg-gray-700",
        destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
        outline: "border-gray-700 text-white",
        success: "border-transparent bg-green-600 text-white shadow hover:bg-green-700",
        warning: "border-transparent bg-yellow-600 text-white shadow hover:bg-yellow-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }