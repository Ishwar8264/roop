"use client"

import * as React from "react"
import { MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" className={cn("flex items-center justify-center", className)} {...props}>
      <MinusIcon />
    </div>
  )
}

export { InputOTPSeparator }
