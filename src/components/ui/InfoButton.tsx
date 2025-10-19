import { useState, useId } from "react"
import { Info } from "lucide-react"
import { useTooltip } from "@/store/TooltipContext"

type Props = {
  text: string
}

export default function InfoButton({ text }: Props) {
  const [hovering, setHovering] = useState(false)
  const { activeId, setActiveId } = useTooltip()
  const id = useId()

  const isActive = activeId === id

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation() // prevent this click from closing itself
    setActiveId(isActive ? null : id)
  }

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="inline-flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full w-5 h-5 text-xs focus:outline-none"
      >
        <Info size={12} />
      </button>

      {(hovering || isActive) && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-52 text-xs text-white bg-gray-900 rounded-md shadow-lg p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </div>
      )}
    </div>
  )
}
