import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import * as React from "react"

import { badgeVariants, cn } from "@/lib/utils"

function Badge({
  asChild = false,
  className,
  variant,
  ...props
}: { asChild?: boolean } &
  React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      className={cn(badgeVariants({ variant }), className)}
      data-slot="badge"
      {...props}
    />
  )
}

export { Badge }