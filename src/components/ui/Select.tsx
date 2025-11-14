import { SelectHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string        // Optional visible label
  id?: string           // Optional, but recommended when label is used
  children: ReactNode
  ariaLabel?: string    // Custom accessible label
  hideLabel?: boolean   // Allows invisible label for accessibility
};

export default function Select({
  label,
  id,
  ariaLabel,
  hideLabel = false,
  children,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      {/* Only render <label> if a visible label was provided */}
      {label && !hideLabel && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* If label is hidden but needed for accessibility */}
      {label && hideLabel && (
        <label
          htmlFor={id}
          className="sr-only"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        aria-label={ariaLabel || (hideLabel ? label : undefined)}
        title={ariaLabel || label || props.title}
        {...props}
        className={clsx(
          "w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          className
        )}
      >
        {children}
      </select>
    </div>
  );
}
