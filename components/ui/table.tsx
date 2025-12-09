"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// This div now controls the scrolling of the table content.
// It will take the full height from its parent in DataTable.tsx
// and provide scrollbars as needed for the table within.
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full h-full overflow-auto"> {/* Key changes: h-full and overflow-auto */}
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
        // Optional: for very wide tables, fixed layout can improve performance with sticky elements
        // style={{ tableLayout: 'fixed', ...props.style }}
      />
    </div>
  )
}

// TableHeader will render the <thead>. The `sticky top-0 z-10 bg-...` classes
// will be passed via `className` from DataTable.tsx to make it sticky.
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)} // className prop will include sticky styles
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0 sticky bottom-0 z-10", // Made footer sticky too as an example
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Original: "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        // DataTable.tsx now handles more specific hover/selected styles for rows
        "border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

// TableHead cells will be part of the sticky TableHeader.
// Ensure they have a background if the TableRow or TableHeader doesn't provide a fully opaque one.
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-muted-foreground h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className // className prop will include background if needed
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}