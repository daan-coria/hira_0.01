import { ReactNode } from "react"
import clsx from "clsx"

export default function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow-sm border border-gray-200 p-4",
        className
      )}
    >
      {children}
    </div>
  )
}
