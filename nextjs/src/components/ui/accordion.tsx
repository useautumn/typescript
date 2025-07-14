"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("au:border-b au:last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="au:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "au:focus-visible:border-ring au:focus-visible:ring-ring/50 au:flex au:flex-1 au:items-start au:justify-between au:gap-4 au:rounded-md au:py-4 au:text-left au:text-sm au:font-medium au:transition-all au:outline-none au:hover:underline au:focus-visible:ring-[3px] au:disabled:pointer-events-none au:disabled:opacity-50 au:[&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="au:text-muted-foreground au:pointer-events-none au:size-4 au:shrink-0 au:translate-y-0.5 au:transition-transform au:duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="au:data-[state=closed]:animate-accordion-up au:data-[state=open]:animate-accordion-down au:overflow-hidden au:text-sm"
      {...props}
    >
      <div className={cn("au:pt-0 au:pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
