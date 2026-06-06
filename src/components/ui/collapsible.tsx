"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

export { Collapsible }
export { CollapsibleTrigger } from "./collapsible/collapsible-trigger"
export { CollapsibleContent } from "./collapsible/collapsible-content"
