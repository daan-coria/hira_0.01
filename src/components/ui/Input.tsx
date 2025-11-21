import React from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label?: string
  className?: string
}

export default function Input({
  id,
  label,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || React.useId() // generates an automatic id if none is provided

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`
          w-full px-3 py-2 border rounded-md 
          bg-white dark:bg-gray-900 
          border-gray-300 dark:border-gray-700 
          text-gray-800 dark:text-gray-100 
          focus:ring-2 focus:ring-green-500 focus:border-green-500 
          outline-none transition

          whitespace-normal
          break-words
          overflow-visible
          text-clip

          ${className}
        `}
        style={{
          whiteSpace: "normal",
          overflow: "visible",
          textOverflow: "clip",
        }}
      />
    </div>
  )
}
