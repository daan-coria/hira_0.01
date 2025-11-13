import { useApp } from "@/store/AppContext"

export default function MasterFilters() {
  const { reloadData } = useApp()

  return (
    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-4 mb-6 shadow-sm">

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex justify-end gap-6 text-sm text-blue-600 items-center mb-4">
        <button onClick={reloadData} className="hover:underline">
          ↻ Refresh
        </button>
        <button className="hover:underline">
          📤 Export
        </button>
        <button className="hover:underline">
          🧹 Reset Filters
        </button>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-4">
        <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">
          Campus
        </button>
        <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">
          Unit
        </button>
        <button className="px-4 py-2 bg-white border rounded-lg shadow-sm text-gray-700">
          Date Picker: Start – End
        </button>
      </div>
    </div>
  )
}
