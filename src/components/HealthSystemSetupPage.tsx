import { useEffect, useState } from "react"
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
  const [regions, setRegions] = useState<string[]>([])
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical")
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  // Campus drawer
  const [campusDrawerOpen, setCampusDrawerOpen] = useState(false)
  const [editingCampusKey, setEditingCampusKey] = useState<string | null>(null)
  const [campusForm, setCampusForm] = useState<Campus>({
    key: "",
    name: "",
    region: "",
  })

  // Region drawer
  const [regionDrawerOpen, setRegionDrawerOpen] = useState(false)
  const [newRegionName, setNewRegionName] = useState("")

  // ---------- INITIAL LOAD (JSON + localStorage) ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        const [campusRes, regionRes] = await Promise.all([
          fetch("/mockdata/campuses.json"),
          fetch("/mockdata/regions.json"),
        ])

        let baseCampuses: Campus[] = []
        if (campusRes.ok) {
          baseCampuses = await campusRes.json()
        }

        let baseRegions: string[] = []
        if (regionRes.ok) {
          baseRegions = await regionRes.json()
        }

        // Derive regions from campuses as well
        const regionsFromCampuses = baseCampuses
          .map((c) => c.region)
          .filter(Boolean)

        let mergedRegions = Array.from(
          new Set([...baseRegions, ...regionsFromCampuses])
        ).sort((a, b) => a.localeCompare(b))

        // Override regions from localStorage if present
        const storedRegions = window.localStorage.getItem(STORAGE_KEY_REGIONS)
        if (storedRegions) {
          mergedRegions = JSON.parse(storedRegions) as string[]
        }

        setRegions(mergedRegions)

        // Load campuses from localStorage if present
        const storedCampuses = window.localStorage.getItem(STORAGE_KEY_CAMPUSES)
        const storedMode = window.localStorage.getItem(
          STORAGE_KEY_SORTMODE
        ) as SortMode | null

        if (storedCampuses) {
          const parsed = JSON.parse(storedCampuses) as Campus[]
          setCampuses(parsed)
          setSortMode(storedMode || "custom")
        } else {
          const alpha = sortAlphabetical(baseCampuses)
          setCampuses(alpha)
          setSortMode("alphabetical")
        }
      } catch (err) {
        console.error("Failed to load mockdata:", err)
      }
    }

    loadData()
  }, [])

  // ---------- PERSIST CHANGES ----------
  useEffect(() => {
    if (!campuses.length) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY_CAMPUSES,
        JSON.stringify(campuses)
      )
      window.localStorage.setItem(STORAGE_KEY_SORTMODE, sortMode)
    } catch (err) {
      console.error("Failed to save campuses:", err)
    }
  }, [campuses, sortMode])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY_REGIONS,
        JSON.stringify(regions)
      )
    } catch (err) {
      console.error("Failed to save regions:", err)
    }
  }, [regions])

  // ---------- SORT HANDLERS ----------
  const handleSortAlphabetical = () => {
    setCampuses((prev) => sortAlphabetical(prev))
    setSortMode("alphabetical")
  }

  const handleSortByRegion = () => {
    setCampuses((prev) => sortByRegion(prev, regions))
    setSortMode("region")
  }

  // ---------- DRAG & DROP ----------
  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", key)
    setDraggingKey(key)
  }

  const handleDragOverRow = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    const sourceKey = draggingKey || e.dataTransfer.getData("text/plain")
    if (!sourceKey || sourceKey === targetKey) return
    setCampuses((prev) => reorderByKey(prev, sourceKey, targetKey))
    setSortMode("custom")
  }

  const handleDragEnd = () => {
    setDraggingKey(null)
  }

  // ---------- CAMPUS CRUD ----------
  const openNewCampusDrawer = () => {
    setEditingCampusKey(null)
    setCampusForm({
      key: "",
      name: "",
      region: regions[0] || "",
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

  const handleCampusFormChange = (field: keyof Campus, value: string) => {
    setCampusForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveCampus = () => {
    const trimmedKey = campusForm.key.trim()
    const trimmedName = campusForm.name.trim()
    const trimmedRegion = campusForm.region.trim()

    if (!trimmedKey || !trimmedName) {
      alert("Campus Key and Campus Name are required.")
      return
    }

    // ensure region in list
    if (trimmedRegion && !regions.includes(trimmedRegion)) {
      setRegions((prev) =>
        [...prev, trimmedRegion].sort((a, b) => a.localeCompare(b))
      )
    }

    if (editingCampusKey) {
      // update existing
      setCampuses((prev) =>
        prev.map((c) =>
          c.key === editingCampusKey
            ? { key: trimmedKey, name: trimmedName, region: trimmedRegion }
            : c
        )
      )
    } else {
      // add new
      const newCampus: Campus = {
        key: trimmedKey,
        name: trimmedName,
        region: trimmedRegion,
      }
      setCampuses((prev) => [...prev, newCampus])
    }

    setSortMode("custom")
    closeCampusDrawer()
  }

  const handleDeleteCampus = (key: string) => {
    const campus = campuses.find((c) => c.key === key)
    const label = campus ? `${campus.key} — ${campus.name}` : key
    if (!window.confirm(`Delete campus "${label}"? This cannot be undone.`)) {
      return
    }
    setCampuses((prev) => prev.filter((c) => c.key !== key))
    if (editingCampusKey === key) {
      closeCampusDrawer()
    }
    setSortMode("custom")
  }

  // ---------- REGION MANAGEMENT ----------
  const openRegionDrawer = () => {
    setRegionDrawerOpen(true)
  }

  const closeRegionDrawer = () => {
    setRegionDrawerOpen(false)
    setNewRegionName("")
  }

  const handleAddRegion = () => {
    const trimmed = newRegionName.trim()
    if (!trimmed) return
    if (regions.includes(trimmed)) {
      alert("That region already exists.")
      return
    }
    setRegions((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)))
    setNewRegionName("")
  }

  const handleDeleteRegion = (name: string) => {
    const inUse = campuses.some((c) => c.region === name)
    if (inUse) {
      alert(
        `Region "${name}" is currently assigned to one or more campuses and cannot be deleted.`
      )
      return
    }
    if (!window.confirm(`Delete region "${name}"?`)) return
    setRegions((prev) => prev.filter((r) => r !== name))
  }

  // ---------- INLINE REGION ADD IN CAMPUS DRAWER ----------
  const handleAddInlineRegion = () => {
    const trimmed = campusForm.region.trim()
    if (!trimmed) return
    if (!regions.includes(trimmed)) {
      setRegions((prev) =>
        [...prev, trimmed].sort((a, b) => a.localeCompare(b))
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Health System Set-Up &mdash; Campuses
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Define individual campuses, assign regions, and control the
              display order used across tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openRegionDrawer}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Manage Regions
            </button>
            <button
              type="button"
              onClick={openNewCampusDrawer}
              className="inline-flex items-center gap-1 rounded-xl border border-transparent bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add Campus
            </button>
          </div>
        </div>

        {/* Sort controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSortAlphabetical}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              sortMode === "alphabetical"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sort A &rarr; Z
          </button>
          <button
            type="button"
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
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 w-32">Campus Key</th>
                <th className="px-4 py-3">Campus Name</th>
                <th className="px-4 py-3 w-40">Region</th>
                <th className="px-4 py-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campuses.map((campus) => (
                <tr
                  key={campus.key}
                  onDragOver={(e) => handleDragOverRow(e, campus.key)}
                  onDragEnd={handleDragEnd}
                  className="border-t border-gray-100 text-sm hover:bg-gray-50"
                >
                  <td className="px-4 py-2 align-middle font-mono text-xs text-gray-800">
                    {campus.key}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <span className="text-sm text-gray-900">{campus.name}</span>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {campus.region ? (
                      <span className="text-xs text-gray-800">
                        {campus.region}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400">
                        No region
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 pr-3 text-right align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditCampusDrawer(campus)}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-100"
                        aria-label="Edit campus"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampus(campus.key)}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 text-red-500 hover:bg-red-50"
                        aria-label="Delete campus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => handleDragStart(e, campus.key)}
                        className="inline-flex cursor-move items-center justify-center rounded-full border border-gray-200 bg-gray-50 p-1.5 text-gray-500 hover:bg-gray-100"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {campuses.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-sm text-gray-500"
                    colSpan={4}
                  >
                    No campuses defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] text-gray-500">
          Drag the{" "}
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
            <GripVertical className="mr-1 h-3 w-3" />
            handle
          </span>{" "}
          on the right to control the display order. The order is saved and
          will not reset automatically.
        </p>
      </div>

      {/* CAMPUS DRAWER */}
      {campusDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={closeCampusDrawer}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingCampusKey ? "Edit Campus" : "Add Campus"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Configure campus identifiers and region assignment.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCampusDrawer}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-full flex-col justify-between">
              <div className="space-y-4 px-4 py-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Campus Key
                  </label>
                  <input
                    type="text"
                    value={campusForm.key}
                    onChange={(e) =>
                      handleCampusFormChange("key", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g., LAN"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Unique identifier used internally (e.g., LAN, BAY).
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Campus Name
                  </label>
                  <input
                    type="text"
                    value={campusForm.name}
                    onChange={(e) =>
                      handleCampusFormChange("name", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g., Lansing"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Region
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={campusForm.region}
                      onChange={(e) =>
                        handleCampusFormChange("region", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Select region…</option>
                      {regions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={campusForm.region}
                      onChange={(e) =>
                        handleCampusFormChange("region", e.target.value)
                      }
                      className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      placeholder="Type a new region name…"
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineRegion}
                      className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Pick an existing region or type a new one and click Add.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  {editingCampusKey && (
                    <button
                      type="button"
                      onClick={() =>
                        campusForm.key &&
                        handleDeleteCampus(editingCampusKey)
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={closeCampusDrawer}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCampus}
                      className="rounded-xl border border-transparent bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Save Campus
                    </button>
                  </div>
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
            className="fixed inset-0 z-40 bg-black/30"
            onClick={closeRegionDrawer}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Manage Regions
                </h2>
                <p className="text-[11px] text-gray-500">
                  Add or remove regions used to group campuses.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRegionDrawer}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-full flex-col justify-between">
              <div className="px-4 py-4">
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Add Region
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      placeholder="e.g., Central MI"
                    />
                    <button
                      type="button"
                      onClick={handleAddRegion}
                      className="shrink-0 rounded-lg border border-transparent bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-1 text-xs font-semibold text-gray-700">
                    Existing Regions
                  </p>
                  <div className="space-y-1.5">
                    {regions.map((r) => (
                      <div
                        key={r}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5"
                      >
                        <span className="text-xs text-gray-800">{r}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRegion(r)}
                          className="rounded-full p-1 text-red-500 hover:bg-red-50"
                          aria-label={`Delete region ${r}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {regions.length === 0 && (
                      <p className="py-2 text-[11px] text-gray-400">
                        No regions defined yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={closeRegionDrawer}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
