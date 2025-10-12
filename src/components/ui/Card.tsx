import { ReactNode } from "react"
import clsx from "clsx"

type CardProps = {
  /** Optional title rendered as a header above children */
  title?: string
  /** Optional extra class names */
  className?: string
  /** Card content */
  children: ReactNode
}

export default function Card({ title, className, children }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border border-gray-200 p-4",
        className
      )}
    >
      {/* ✅ Render title if provided */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
