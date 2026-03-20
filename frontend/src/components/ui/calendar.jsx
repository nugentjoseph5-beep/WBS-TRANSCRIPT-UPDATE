import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "text-sm font-medium hidden",
        caption_dropdowns: "flex gap-2 items-center",
        dropdown_month: "relative",
        dropdown_year: "relative",
        dropdown: "absolute inset-0 w-full opacity-0 cursor-pointer z-10",
        vhidden: "sr-only",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-stone-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-maroon-50 [&:has([aria-selected].day-outside)]:bg-maroon-50/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-stone-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-maroon-500 text-white hover:bg-maroon-600 hover:text-white focus:bg-maroon-500 focus:text-white",
        day_today: "bg-stone-100 text-stone-900",
        day_outside:
          "day-outside text-stone-400 aria-selected:bg-maroon-50/50 aria-selected:text-stone-500",
        day_disabled: "text-stone-300 opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-maroon-50 aria-selected:text-stone-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
        Dropdown: ({ value, onChange, children, ...props }) => {
          const options = React.Children.toArray(children);
          
          const handleChange = (e) => {
            // Pass the native event directly to onChange
            onChange(e);
          };
          
          return (
            <div className="relative inline-block">
              <select
                value={value}
                onChange={handleChange}
                className="appearance-none bg-white border border-stone-300 rounded-md px-3 py-1.5 pr-8 text-sm font-medium text-stone-900 cursor-pointer hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                {...props}
              >
                {options.map((option) => (
                  <option key={option.props.value} value={option.props.value}>
                    {option.props.children}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 rotate-90 pointer-events-none" />
            </div>
          );
        },
      }}
      {...props} />
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
