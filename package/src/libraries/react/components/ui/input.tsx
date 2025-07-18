import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "au-flex au-h-9 au-w-full au-rounded-md au-border au-border-input au-bg-transparent au-px-3 au-py-1 au-text-base au-shadow-sm au-transition-colors file:au-border-0 file:au-bg-transparent file:au-text-sm file:au-font-medium file:au-text-foreground placeholder:au-text-muted-foreground focus-visible:au-outline-none focus-visible:au-ring-1 focus-visible:au-ring-ring disabled:au-cursor-not-allowed disabled:au-opacity-50 md:au-text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
