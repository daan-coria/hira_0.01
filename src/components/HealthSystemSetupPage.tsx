console.log("REGION STORAGE ON MOUNT:", localStorage.getItem("hira_regions"))


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
    if (a.region === b.region) {
      return a.name.localeCompare(b.name)
    }
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

  // Campus drawer
  const [campusDrawerOpen, setCampusDrawerOpen] = useState(false)
  const [editingCampusKey, setEditingCampusKey] = useState<string | null>(null)
  const [campusForm, setCampusForm] = useState<Campus>({
    key: "",
    name: "",
    region: "",
  })

  const [regionChanged, setRegionChanged] = useState(false)

  // Region drawer
  const [regionDrawerOpen, setRegionDrawerOpen] = useState(false)
  const [newRegionName, setNewRegionName] = useState("")

  // ---------- LOAD DATA (JSON + localStorage) ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        const [campusRes, regionRes] = await Promise.all([
          fetch("/mockdata/campuses.json"),
          fetch("/mockdata/regions.json"),
        ])

        // Base from JSON
        const baseCampuses: Campus[] = campusRes.ok
          ? await campusRes.json()
          : []

        const baseRegions: string[] = regionRes.ok
          ? await regionRes.json()
          : []

        // Saved in localStorage
        const storedCampusesRaw =
          window.localStorage.getItem(STORAGE_KEY_CAMPUSES)
        const storedModeRaw = window.localStorage.getItem(
          STORAGE_KEY_SORTMODE
        ) as SortMode | null
        const storedRegionsRaw =
          window.localStorage.getItem(STORAGE_KEY_REGIONS)

        // ----- Campuses initial value -----
        let initialCampuses: Campus[]
        if (storedCampusesRaw) {
          initialCampuses = JSON.parse(storedCampusesRaw) as Campus[]
        } else {
          initialCampuses = sortAlphabetical(baseCampuses)
        }

        // ----- Regions initial value -----
        let initialRegions: string[]
        if (storedRegionsRaw) {
          // Use exactly what user had last time
          initialRegions = JSON.parse(storedRegionsRaw) as string[]
        } else {
          // First ever load → merge regions.json + campus regions
          const derivedFromCampuses = baseCampuses
            .map((c) => c.region)
            .filter((r) => r && r.trim() !== "")

          initialRegions = Array.from(
            new Set([...baseRegions, ...derivedFromCampuses])
          ).sort((a, b) => a.localeCompare(b))
        }

        setCampuses(initialCampuses)
        setRegions(initialRegions)
        setSortMode(
          storedModeRaw || (storedCampusesRaw ? "custom" : "alphabetical")
        )
        setInitialized(true)
      } catch (err) {
        console.error("Failed to load mockdata:", err)
      }
    }

    loadData()
  }, [])

  // ---------- PERSIST (only after initialized) ----------
  useEffect(() => {
    if (!initialized) return
    window.localStorage.setItem(STORAGE_KEY_CAMPUSES, JSON.stringify(campuses))
    window.localStorage.setItem(STORAGE_KEY_SORTMODE, sortMode)
  }, [campuses, sortMode, initialized])

  useEffect(() => {
    if (!initialized) return
    window.localStorage.setItem(STORAGE_KEY_REGIONS, JSON.stringify(regions))
  }, [regions, initialized])

  // SORT HANDLERS
  const handleSortAlphabetical = () => {
    setCampuses(sortAlphabetical(campuses))
    setSortMode("alphabetical")
  }

  const handleSortByRegion = () => {
    setCampuses(sortByRegion(campuses, regions))
    setSortMode("region")
  }

  // DRAG
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

  const handleDragEnd = () => {
    setDraggingKey(null)
  }

  // DRAWERS
  const openNewCampusDrawer = () => {
    setEditingCampusKey(null)
    setRegionChanged(false)
    setCampusForm({
      key: "",
      name: "",
      region: regions[0] || "",
    })
    setCampusDrawerOpen(true)
  }

  const openEditCampusDrawer = (campus: Campus) => {
    setEditingCampusKey(campus.key)
    setRegionChanged(false)
    setCampusForm({ ...campus })
    setCampusDrawerOpen(true)
  }

  const closeCampusDrawer = () => {
    setCampusDrawerOpen(false)
    setEditingCampusKey(null)
  }

  const handleCampusFormChange = (field: keyof Campus, value: string) => {
    setCampusForm((prev) => ({ ...prev, [field]: value }))
    if (field === "region") setRegionChanged(true)
  }

  const handleSaveCampus = () => {
    const key = campusForm.key.trim()
    const name = campusForm.name.trim()
    const region = campusForm.region.trim()

    if (!key || !name) {
      toast.error("Campus Key and Campus Name are required.")
      return
    }

    if (!region) {
      toast.error("Region cannot be empty.")
      return
    }

    // ensure region exists in master list
    if (!regions.includes(region)) {
      setRegions((prev) =>
        [...prev, region].sort((a, b) => a.localeCompare(b))
      )
    }

    if (editingCampusKey) {
      setCampuses((prev) =>
        prev.map((c) =>
          c.key === editingCampusKey ? { key, name, region } : c
        )
      )
    } else {
      setCampuses([...campuses, { key, name, region }])
    }

    setSortMode("custom")
    setRegionChanged(false)

    toast.success("Campus saved!")
    closeCampusDrawer()
  }

  const handleDeleteCampus = (key: string) => {
    if (!window.confirm("Delete this campus?")) return
    setCampuses(campuses.filter((c) => c.key !== key))
    closeCampusDrawer()
  }

  const handleAddInlineRegion = () => {
    const region = campusForm.region.trim()
    if (!region) return
    if (!regions.includes(region)) {
      setRegions((prev) =>
        [...prev, region].sort((a, b) => a.localeCompare(b))
      )
      setRegionChanged(true)
    }
  }

  const handleAddRegion = () => {
    const trimmed = newRegionName.trim()
    if (!trimmed) return
    if (regions.includes(trimmed)) {
      toast.error("Region already exists.")
      return
    }
    setRegions([...regions, trimmed].sort((a, b) => a.localeCompare(b)))
    setNewRegionName("")
    toast.success("Region added!")
  }

  const handleDeleteRegion = (name: string) => {
    const inUse = campuses.some((c) => c.region === name)
    if (inUse) {
      toast.error("Region is assigned to campuses and cannot be deleted.")
      return
    }
    setRegions(regions.filter((r) => r !== name))
    toast.success("Region deleted!")
  }

  const closeRegionDrawer = () => {
    setRegionDrawerOpen(false)
    setNewRegionName("")
  }

  // ===========================
  // UI
  // ===========================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Health System Set-Up — Campuses
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Define campuses, manage regions, and control order.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRegionDrawerOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Manage Regions
            </button>

            <button
              onClick={openNewCampusDrawer}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add Campus
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleSortAlphabetical}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              sortMode === "alphabetical"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sort A → Z
          </button>

          <button
            onClick={handleSortByRegion}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              sortMode === "region"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sort by Region
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full border-collapse bg-white">
            <thead className="bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Region</th>
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

                  <td className="px-3 py-2 pr-3 text-right">
                    <div className="flex justify-end gap-1.5 group">
                      <button
                        aria-label="Edit campus"
                        onClick={() => openEditCampusDrawer(c)}
                        className="rounded-full p-1.5 border bg-white text-gray-500 hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        aria-label="Delete campus"
                        onClick={() => handleDeleteCampus(c.key)}
                        className="rounded-full p-1.5 border bg-white text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* HIDDEN drag handle */}
                      <button
                        aria-label="Reorder campus"
                        draggable
                        onDragStart={(e) => handleDragStart(e, c.key)}
                        className="
                          opacity-0 group-hover:opacity-100
                          transition-opacity duration-200
                          cursor-move rounded-full p-1.5 border
                          bg-gray-50 text-gray-500 hover:bg-gray-100
                        "
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

          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-xl">
            <div className="flex justify-between items-center border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">
                  {editingCampusKey ? "Edit Campus" : "Add Campus"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Modify campus info and region assignment.
                </p>
              </div>

              <button
                aria-label="Close drawer"
                className="rounded-full p-1.5 hover:bg-gray-100"
                onClick={closeCampusDrawer}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col h-full justify-between">
              <div className="px-4 py-4 space-y-4">
                {/* Campus Key */}
                <div>
                  <label
                    htmlFor="campus-key"
                    className="text-xs font-semibold"
                  >
                    Campus Key
                  </label>
                  <input
                    id="campus-key"
                    value={campusForm.key}
                    onChange={(e) =>
                      handleCampusFormChange("key", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>

                {/* Campus Name */}
                <div>
                  <label
                    htmlFor="campus-name"
                    className="text-xs font-semibold"
                  >
                    Campus Name
                  </label>
                  <input
                    id="campus-name"
                    value={campusForm.name}
                    onChange={(e) =>
                      handleCampusFormChange("name", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>

                {/* Region */}
                <div>
                  <label
                    htmlFor="campus-region"
                    className="text-xs font-semibold"
                  >
                    Region
                  </label>

                  <select
                    aria-label="Select region"
                    value={campusForm.region}
                    onChange={(e) =>
                      handleCampusFormChange("region", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="">Select region…</option>
                    {regions.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>

                  {/* Inline add new region */}
                  <div className="flex gap-2 mt-2">
                    <input
                      aria-label="Add new region"
                      type="text"
                      value={campusForm.region}
                      onChange={(e) =>
                        handleCampusFormChange("region", e.target.value)
                      }
                      className="w-full border border-dashed rounded-lg px-3 py-1.5 text-xs"
                      placeholder="Type a new region…"
                    />
                    <button
                      onClick={handleAddInlineRegion}
                      className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-1">
                    Pick or create a region.
                  </p>

                  {/* Save Region Button */}
                  {regionChanged && (
                    <div className="mt-3 text-right">
                      <button
                        onClick={handleSaveCampus}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs hover:bg-brand-700"
                      >
                        Save Region
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="border-t px-4 py-3 flex justify-between">
                {editingCampusKey && (
                  <button
                    aria-label="Delete campus"
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
          </div>
        </>
      )}

      {/* REGION DRAWER */}
      {regionDrawerOpen && (
        <>
          <div
            onClick={closeRegionDrawer}
            className="fixed inset-0 bg-black/30 z-40"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 shadow-xl">
            <div className="flex justify-between items-center border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Manage Regions</h2>
              <button
                aria-label="Close region drawer"
                onClick={closeRegionDrawer}
                className="p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col h-full justify-between">
              <div className="px-4 py-4 space-y-3">
                {/* Add Region */}
                <div>
                  <label className="text-xs font-semibold">New Region</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-1.5 text-sm"
                      placeholder="e.g., North MI"
                    />
                    <button
                      onClick={handleAddRegion}
                      className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Existing */}
                <div>
                  <label className="text-xs font-semibold">
                    Existing Regions
                  </label>
                  <div className="space-y-1.5 mt-1">
                    {regions.map((r) => (
                      <div
                        key={r}
                        className="flex justify-between items-center border rounded-lg bg-gray-50 px-3 py-1.5"
                      >
                        <span className="text-xs">{r}</span>
                        <button
                          aria-label="Delete region"
                          onClick={() => handleDeleteRegion(r)}
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
                  onClick={closeRegionDrawer}
                  className="px-3 py-1.5 text-xs border rounded-xl hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
