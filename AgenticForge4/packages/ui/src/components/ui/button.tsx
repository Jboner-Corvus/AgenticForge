import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import * as React from "react"

import { buttonVariants, cn } from "@/lib/utils"

function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: {
    asChild?: boolean
  } &
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }), "transition-all duration-200 ease-in-out")}
      data-slot="button"
      {...props}
    />
  )
}

export { Button }