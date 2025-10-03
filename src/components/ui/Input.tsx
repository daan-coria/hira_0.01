import { InputHTMLAttributes } from "react"
import clsx from "clsx"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  id: string
}

export default function Input({ label, id, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={clsx(
          "w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          className
        )}
      />
    </div>
  )
}
