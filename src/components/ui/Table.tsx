import { ReactNode } from "react"

type TableProps = {
  headers: string[]
  rows: ReactNode[][]
  emptyMessage?: string
}

export default function Table({ headers, rows, emptyMessage = "No data available" }: TableProps) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left font-medium text-gray-700 tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr key={ri} className="odd:bg-gray-50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 text-gray-800">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
