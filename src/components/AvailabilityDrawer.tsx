// src/components/AvailabilityDrawer.tsx
import { useEffect, useState } from "react"
import { DatePickerInput } from "@mantine/dates"
import "@mantine/dates/styles.css"

import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"

import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { AvailabilityEntry } from "@/utils/useAvailabilityCalculator"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

type AvailabilityDrawerRow = AvailabilityEntry

    type AvailabilityDrawerProps = {
    row: {
        employee_id?: string
        first_name: string
        last_name: string
        unit_fte: number
        availability?: AvailabilityEntry[]
    }
    initialWeek?: string | null
    onClose: () => void
    onSave: (entries: AvailabilityEntry[]) => void
    }

    const AVAILABILITY_TYPES = [
    "Orientation",
    "FMLA",
    "PTO",
    "Increased Availability",
    ]

    const formatDate = (d: Date | null): string => {
    return d ? dayjs(d).format("YYYY-MM-DD") : ""
    }

    const toDateValue = (value: string | null | undefined): Date | null => {
    if (!value || value.trim() === "") return null
    return dayjs(value, "YYYY-MM-DD").toDate()
    }

    export default function AvailabilityDrawer({
    row,
    initialWeek,
    onClose,
    onSave,
    }: AvailabilityDrawerProps) {
    const [entries, setEntries] = useState<AvailabilityDrawerRow[]>([])

    // Initialize entries from row or create a default one
    useEffect(() => {
        if (row.availability && row.availability.length > 0) {
        setEntries(row.availability)
        } else {
        const defaultStart = initialWeek || ""
        setEntries([
            {
            id: String(Date.now()),
            type: AVAILABILITY_TYPES[0],
            start: defaultStart,
            end: null,
            fte: row.unit_fte,
            },
        ])
        }
    }, [row, initialWeek])

    const updateEntry = (id: string, patch: Partial<AvailabilityDrawerRow>) => {
        setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
        )
    }

    const addEntry = () => {
        const now = String(Date.now())
        setEntries((prev) => [
        ...prev,
        {
            id: now,
            type: AVAILABILITY_TYPES[0],
            start: initialWeek || "",
            end: null,
            fte: row.unit_fte,
        },
        ])
    }

    const handleDeleteAll = () => {
        // "Delete" availability means saving an empty list
        onSave([])
    }

    const handleSave = () => {
        // Normalize: trim empty start -> ignore that entry
        const cleaned = entries
        .filter((e) => e.start && e.start.trim() !== "")
        .map((e) => ({
            ...e,
            end: e.end && e.end.trim() !== "" ? e.end : null,
        }))
        onSave(cleaned)
    }

    const fullName =
        `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Employee"

    return (
        <>
        {/* Backdrop */}
        <div
            className="fixed inset-0 z-40 bg-black bg-opacity-40"
            onClick={onClose}
        />

        {/* RIGHT SIDE DRAWER */}
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
            {/* Left: trash deletes all availability */}
            <Button
                variant="ghost"
                className="text-red-600 text-xl"
                onClick={handleDeleteAll}
            >
                🗑
            </Button>

            <div className="flex flex-col items-center flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                Edit Availability
                </h3>
                <p className="text-xs text-gray-500">{fullName}</p>
            </div>

            <div className="flex items-center gap-2">
                {/* + button to add new availability adjustment */}
                <Button
                variant="ghost"
                className="text-xl"
                onClick={addEntry}
                title="Add availability adjustment"
                >
                +
                </Button>

                {/* Close button */}
                <Button
                variant="ghost"
                className="text-gray-600 text-xl"
                onClick={onClose}
                >
                ✕
                </Button>
            </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-gray-700">
            {/* Label row */}
            <div className="grid grid-cols-[1.3fr_2.2fr_0.8fr] gap-4 text-xs font-semibold text-gray-500">
                <div>Type</div>
                <div>Select Date Range</div>
                <div>FTE</div>
            </div>

            {entries.map((entry) => {
                const startDateValue = toDateValue(entry.start)
                const endDateValue = toDateValue(entry.end || "")

                return (
                <div
                    key={entry.id}
                    className="grid grid-cols-[1.3fr_2.2fr_0.8fr] gap-4 items-start"
                >
                    {/* Type dropdown */}
                    <div>
                    <Select
                        value={entry.type}
                        onChange={(e) =>
                        updateEntry(entry.id, { type: e.target.value })
                        }
                        className="w-full"
                    >
                        {AVAILABILITY_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                        ))}
                    </Select>
                    </div>

                    {/* Mantine date range (start + end/ongoing) */}
                    <div className="min-w-[260px]">
                    <DatePickerInput
                        type="range"
                        value={[startDateValue, endDateValue]}
                        allowSingleDateInRange
                        valueFormat="MMM D, YYYY"
                        placeholder="Select date range"
                        onChange={(value) => {
                        const [start, end] = (value ?? [
                            null,
                            null,
                        ]) as [Date | null, Date | null]
                        const startStr = formatDate(start)
                        const endStr = formatDate(end)
                        updateEntry(entry.id, {
                            start: startStr,
                            end: endStr || null,
                        })
                        }}
                    />
                    {/* Ongoing hint */}
                    {entry.start && !entry.end && (
                        <p className="mt-1 text-xs text-gray-500">Ongoing</p>
                    )}
                    </div>

                    {/* FTE number */}
                    <div>
                    <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={entry.fte}
                        id=""
                        onChange={(e) =>
                        updateEntry(entry.id, {
                            fte: Number(e.target.value || 0),
                        })
                        }
                        className="w-full text-right"
                    />
                    </div>
                </div>
                )
            })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex justify-between items-center">
            <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-700"
            >
                Cancel
            </Button>
            <Button
                variant="primary"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
            >
                Save
            </Button>
            </div>
        </div>
        </>
    )
}
