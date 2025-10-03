import { ButtonHTMLAttributes } from "react"
import clsx from "clsx"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost"
}

export default function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2",
        variant === "primary" &&
          "px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus:ring-brand-500",
        variant === "ghost" &&
          "px-3 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 focus:ring-gray-400",
        className
      )}
    />
  )
}
