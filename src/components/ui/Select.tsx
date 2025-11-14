import { SelectHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string        // Optional visible label
  id?: string           // Recommended when label is used
  children: ReactNode
  ariaLabel?: string    // Accessible label
  hideLabel?: boolean   // For screen-reader-only labels
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

  // -------------------------------
  // 🔒 Accessibility Name Logic
  // -------------------------------
  // Priority:
  // 1. ariaLabel prop (best)
  // 2. label (visible or hidden)
  // 3. fallback string "Select an option"
  const accessibleName =
    ariaLabel ||
    label ||
    "Select an option";

  return (
    <div className="space-y-1">
      {/* Visible label */}
      {label && !hideLabel && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* Hidden but accessible label */}
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
        aria-label={accessibleName}
        // Title helps assistive tech AND tooltips
        title={accessibleName}
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
