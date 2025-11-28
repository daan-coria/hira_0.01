import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Settings,
  X,
} from "lucide-react"

type Campus = {
  key: string
  name: string
  region: string
  hoursPerWeekFTE: number
}

type SortMode = "alphabetical" | "region" | "custom"

const STORAGE_KEY_CAMPUSES = "hira_campuses"
const STORAGE_KEY_SORTMODE = "hira_campuses_sortMode"
const STORAGE_KEY_REGIONS = "hira_regions"

function sortAlphabetical(campuses: Campus[]): Campus[] {
  return [...campuses].sort((a, b) => a.name.localeCompare(b.name))
}

function sortByRegion(campuses: Campus[], regionsOrder: string[]): Campus[] {
  const regionIndex = (r: string) => {
    const idx = regionsOrder.indexOf(r)
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
  }
  return [...campuses].sort((a, b) => {
    if (a.region === b.region) return a.name.localeCompare(b.name)
    return regionIndex(a.region) - regionIndex(b.region)
  })
}

function reorderByKey(
  campuses: Campus[],
  fromKey: string,
  toKey: string
): Campus[] {
  if (fromKey === toKey) return campuses

  const list = [...campuses]
  const fromIndex = list.findIndex((c) => c.key === fromKey)
  const toIndex = list.findIndex((c) => c.key === toKey)

  if (fromIndex === -1 || toIndex === -1) return campuses

  const [moved] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, moved)

  return list
}

export default function HealthSystemSetupPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [regions, setRegions] = useState<string[]>(() => {
    const stored = localStorage.getItem("hira_regions")
    return stored ? JSON.parse(stored) : []
  })
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical")
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  const [initialized, setInitialized] = useState(false)

  const [campusDrawerOpen, setCampusDrawerOpen] = useState(false)
  const [editingCampusKey, setEditingCampusKey] = useState<string | null>(null)

  const [campusForm, setCampusForm] = useState<Campus>({
    key: "",
    name: "",
    region: regions[0] || "",
    hoursPerWeekFTE: 40,
  })

  const [regionDrawerOpen, setRegionDrawerOpen] = useState(false)
  const [newRegionName, setNewRegionName] = useState("")

  // ---------- LOAD ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        const [campusRes, regionRes] = await Promise.all([
          fetch("/mockdata/campuses.json"),
          fetch("/mockdata/regions.json"),
        ])

        const baseCampusesRaw = campusRes.ok ? await campusRes.json() : []
        const baseRegions: string[] = regionRes.ok ? await regionRes.json() : []

        const baseCampuses: Campus[] = baseCampusesRaw.map((c: any) => ({
          key: c.key,
          name: c.name,
          region: c.region,
          hoursPerWeekFTE: c.hoursPerWeekFTE ?? 40,
        }))

        const storedCampusesRaw = localStorage.getItem(STORAGE_KEY_CAMPUSES)
        const storedModeRaw = localStorage.getItem(
          STORAGE_KEY_SORTMODE
        ) as SortMode | null

        const storedRegionsRaw = localStorage.getItem(STORAGE_KEY_REGIONS)

        let initialCampuses: Campus[]

        if (storedCampusesRaw) {
          const parsed = JSON.parse(storedCampusesRaw)
          initialCampuses = parsed.map((c: any) => ({
            ...c,
            hoursPerWeekFTE: c.hoursPerWeekFTE ?? 40,
          }))
        } else {
          initialCampuses = sortAlphabetical(baseCampuses)
        }

        const presetRegions = baseRegions
        const savedRegions = storedRegionsRaw ? JSON.parse(storedRegionsRaw) : []
        const derivedRegions = baseCampuses
          .map((c) => c.region)
          .filter(Boolean)

        const initialRegions = Array.from(
          new Set([...presetRegions, ...derivedRegions, ...savedRegions])
        ).sort((a, b) => a.localeCompare(b))

        setCampuses(initialCampuses)
        setRegions(initialRegions)
        setSortMode(storedModeRaw || (storedCampusesRaw ? "custom" : "alphabetical"))
        setInitialized(true)
      } catch (err) {
        console.error("Failed to load data:", err)
      }
    }

    loadData()
  }, [])

  // ---------- SAVE TO LOCALSTORAGE ----------
  useEffect(() => {
    if (!initialized) return
    localStorage.setItem(STORAGE_KEY_CAMPUSES, JSON.stringify(campuses))
    localStorage.setItem(STORAGE_KEY_SORTMODE, sortMode)
  }, [campuses, sortMode, initialized])

  useEffect(() => {
    if (!initialized) return
    localStorage.setItem(STORAGE_KEY_REGIONS, JSON.stringify(regions))
  }, [regions, initialized])

  // ---------- SORT ----------
  const handleSortAlphabetical = () => {
    setCampuses(sortAlphabetical(campuses))
    setSortMode("alphabetical")
  }

  const handleSortByRegion = () => {
    setCampuses(sortByRegion(campuses, regions))
    setSortMode("region")
  }

  // ---------- DRAG ----------
  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", key)
    setDraggingKey(key)
  }

  const handleDragOverRow = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    const sourceKey = draggingKey || e.dataTransfer.getData("text/plain")
    if (!sourceKey || sourceKey === targetKey) return
    setCampuses(reorderByKey(campuses, sourceKey, targetKey))
    setSortMode("custom")
  }

  const handleDragEnd = () => setDraggingKey(null)

  // ---------- DRAWERS ----------
  const openNewCampusDrawer = () => {
    setEditingCampusKey(null)
    setCampusForm({
      key: "",
      name: "",
      region: regions[0] || "",
      hoursPerWeekFTE: 40,
    })
    setCampusDrawerOpen(true)
  }

  const openEditCampusDrawer = (campus: Campus) => {
    setEditingCampusKey(campus.key)
    setCampusForm({ ...campus })
    setCampusDrawerOpen(true)
  }

  const closeCampusDrawer = () => {
    setCampusDrawerOpen(false)
    setEditingCampusKey(null)
  }

  const handleCampusFormChange = (
    field: keyof Campus,
    value: string | number
  ) => {
    setCampusForm((prev) => ({ ...prev, [field]: value }))
  }

  // ---------- SAVE ----------
  const handleSaveCampus = () => {
    const { key, name, region, hoursPerWeekFTE } = campusForm

    if (!key.trim() || !name.trim()) return toast.error("Key and Name required.")
    if (!region.trim()) return toast.error("Region required.")
    if (!hoursPerWeekFTE || Number(hoursPerWeekFTE) <= 40)
      return toast.error("Hours/Week for FTE required.")

    const numericHours = Number(hoursPerWeekFTE)

    if (!regions.includes(region)) {
      setRegions((prev) => [...prev, region].sort((a, b) => a.localeCompare(b)))
    }

    if (editingCampusKey) {
      setCampuses((prev) =>
        prev.map((c) =>
          c.key === editingCampusKey
            ? { ...campusForm, hoursPerWeekFTE: numericHours }
            : c
        )
      )
    } else {
      setCampuses((prev) => [
        ...prev,
        { ...campusForm, hoursPerWeekFTE: numericHours },
      ])
    }

    toast.success("Campus saved!")
    closeCampusDrawer()
  }

  const handleDeleteCampus = (key: string) => {
    if (!window.confirm("Delete this campus?")) return
    setCampuses((prev) => prev.filter((c) => c.key !== key))
    closeCampusDrawer()
  }

  // ============================
  // UI
  // ============================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm border">

        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Health System Set-Up — Campuses
            </h1>
            <p className="text-xs text-gray-500">
              Define campuses, regions, and Hours/Week for FTE.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRegionDrawerOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs"
            >
              <Settings className="h-4 w-4" /> Manage Regions
            </button>

            <button
              onClick={openNewCampusDrawer}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-600 text-white px-3 py-1.5 text-xs"
            >
              <Plus className="h-4 w-4" /> Add Campus
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleSortAlphabetical}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              sortMode === "alphabetical"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : ""
            }`}
          >
            Sort A → Z
          </button>

          <button
            onClick={handleSortByRegion}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              sortMode === "region"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : ""
            }`}
          >
            Sort by Region
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 text-[11px] text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Hours/Week for FTE</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {campuses.map((c) => (
                <tr
                  key={c.key}
                  onDragOver={(e) => handleDragOverRow(e, c.key)}
                  onDragEnd={handleDragEnd}
                  className="border-t text-sm hover:bg-gray-50 group"
                >
                  <td className="px-4 py-2">{c.key}</td>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.region}</td>
                  <td className="px-4 py-2">{c.hoursPerWeekFTE}</td>

                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEditCampusDrawer(c)}
                        className="p-1.5 rounded border bg-white hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCampus(c.key)}
                        className="p-1.5 rounded border bg-white text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        draggable
                        onDragStart={(e) => handleDragStart(e, c.key)}
                        className="p-1.5 rounded border bg-gray-50 opacity-0 group-hover:opacity-100 transition"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* CAMPUS DRAWER */}
      {campusDrawerOpen && (
        <>
          <div
            onClick={closeCampusDrawer}
            className="fixed inset-0 bg-black/30 z-40"
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white z-50 shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
                {editingCampusKey ? "Edit Campus" : "Add Campus"}
              </h2>

              <button
                onClick={closeCampusDrawer}
                className="p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">

              {/* Key */}
              <div>
                <label className="text-xs font-semibold">Campus Key</label>
                <input
                  value={campusForm.key}
                  onChange={(e) =>
                    handleCampusFormChange("key", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold">Campus Name</label>
                <input
                  value={campusForm.name}
                  onChange={(e) =>
                    handleCampusFormChange("name", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>

              {/* Region */}
              <div>
                <label className="text-xs font-semibold">Region</label>

                <select
                  value={campusForm.region}
                  onChange={(e) =>
                    handleCampusFormChange("region", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="">Select region…</option>
                  {regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>

                <p className="text-[11px] text-gray-500 mt-1">
                  To add new regions, use “Manage Regions”.
                </p>
              </div>

              {/* Hours */}
              <div>
                <label className="text-xs font-semibold">Hours/Week for FTE</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={campusForm.hoursPerWeekFTE}
                  onChange={(e) =>
                    handleCampusFormChange(
                      "hoursPerWeekFTE",
                      Number(e.target.value)
                    )
                  }
                  className="w-full border rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 flex justify-between">
              {editingCampusKey && (
                <button
                  onClick={() => handleDeleteCampus(editingCampusKey)}
                  className="px-3 py-1.5 text-xs border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                >
                  Delete
                </button>
              )}

              <div className="ml-auto flex gap-2">
                <button
                  onClick={closeCampusDrawer}
                  className="px-3 py-1.5 text-xs border rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveCampus}
                  className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                >
                  Save Campus
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* REGION DRAWER */}
      {regionDrawerOpen && (
        <>
          <div
            onClick={() => setRegionDrawerOpen(false)}
            className="fixed inset-0 bg-black/30 z-40"
          />

          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white z-50 shadow-xl overflow-y-auto">

            <div className="flex justify-between items-center border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Manage Regions</h2>
              <button
                onClick={() => setRegionDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {/* Add */}
              <div>
                <label className="text-xs font-semibold">New Region</label>

                <div className="flex mt-1 gap-2">
                  <input
                    value={newRegionName}
                    onChange={(e) => setNewRegionName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                    placeholder="e.g., North MI"
                  />
                  <button
                    onClick={() => {
                      const trimmed = newRegionName.trim()
                      if (!trimmed) return
                      if (regions.includes(trimmed))
                        return toast.error("Region already exists.")
                      setRegions((prev) =>
                        [...prev, trimmed].sort((a, b) => a.localeCompare(b))
                      )
                      setNewRegionName("")
                      toast.success("Region added!")
                    }}
                    className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing */}
              <div>
                <label className="text-xs font-semibold">Existing Regions</label>

                <div className="space-y-1.5 mt-1">
                  {regions.map((r) => (
                    <div
                      key={r}
                      className="flex justify-between items-center border rounded-lg bg-gray-50 px-3 py-1.5"
                    >
                      <span className="text-xs">{r}</span>

                      <button
                        onClick={() => {
                          const inUse = campuses.some((c) => c.region === r)
                          if (inUse)
                            return toast.error(
                              "Region is assigned to campuses."
                            )
                          setRegions((prev) => prev.filter((x) => x !== r))
                          toast.success("Region deleted!")
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t px-4 py-3 text-right">
              <button
                onClick={() => setRegionDrawerOpen(false)}
                className="px-3 py-1.5 text-xs border rounded-xl hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
