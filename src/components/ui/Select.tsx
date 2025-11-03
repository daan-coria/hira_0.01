import { SelectHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string        // 👈 Make optional
  id?: string           // 👈 Also make optional (for flexibility)
  children: ReactNode
}

export default function Select({ label, id, children, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className={clsx(
          "w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          className
        )}
      >
        {children}
      </select>
    </div>
  )
}
