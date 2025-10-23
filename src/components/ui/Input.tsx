import React from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label?: string
  className?: string
}

export default function Input({ id, label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-600 select-none"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        {...props}
        className={`border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
      />
    </div>
  )
}
