import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Category = "Nursing" | "Support" | "Other" | "";

type JobConfigRow = {
  id: number;
  resourceType: string;
  directCarePct: string; // e.g. "100%"
  category: Category;
  weekendRotations: string[];
  campuses: string[];
  openReqJob: string;
  rosterJob: string;
  scheduleJob: string;
  isCharge: boolean;
  isOriented: boolean;
  isPreceptor: boolean;
};

type JobConfigurationAdminProps = {
  campusesFromConfig?: string[];
  openReqJobOptions?: string[];
  rosterJobOptions?: string[];
  scheduleJobOptions?: string[];
};

const STORAGE_KEY = "hira_jobConfiguration_admin";

const DEFAULT_CAMPUSES = ["Lansing", "Bay", "Flint"];

const DEFAULT_WEEKEND_ROTATIONS = [
  "Every Other",
  "Every Third",
  "Weekend Only",
  "Weekend Every Other",
];

const DEFAULT_OPEN_REQ = ["NA", "UC", "MGR", "Nurse", "RN", "RN I", "RN II"];
const DEFAULT_ROSTER = ["NA", "UC", "Manager", "Nurse", "RN", "RN I", "RN II"];
const DEFAULT_SCHEDULE = [
  "Nurse Assistant",
  "Unit Coordinator",
  "Unit Manager",
  "RN",
  "RN I",
  "RN II",
];

function createInitialRows(campuses: string[]): JobConfigRow[] {
  return [
    {
      id: 1,
      resourceType: "NA/UC",
      directCarePct: "100%",
      category: "Support",
      weekendRotations: ["Every Other"],
      campuses: ["Lansing", "Bay"],
      openReqJob: "NA",
      rosterJob: "NA",
      scheduleJob: "Nurse Assistant",
      isCharge: false,
      isOriented: false,
      isPreceptor: false,
    },
    {
      id: 2,
      resourceType: "Manager",
      directCarePct: "0%",
      category: "Other",
      weekendRotations: [],
      campuses: ["Flint"],
      openReqJob: "MGR",
      rosterJob: "Manager",
      scheduleJob: "Unit Manager",
      isCharge: true,
      isOriented: false,
      isPreceptor: false,
    },
    {
      id: 3,
      resourceType: "Nurse",
      directCarePct: "100%",
      category: "Nursing",
      weekendRotations: ["Every Third", "Weekend Only"],
      campuses: [...campuses],
      openReqJob: "Nurse",
      rosterJob: "RN",
      scheduleJob: "RN",
      isCharge: false,
      isOriented: false,
      isPreceptor: true,
    },
  ];
}

export default function JobConfigurationCard(
  props: JobConfigurationAdminProps
) {
  const allCampuses = props.campusesFromConfig?.length
    ? props.campusesFromConfig
    : DEFAULT_CAMPUSES;

  const openReqOptions =
    props.openReqJobOptions && props.openReqJobOptions.length
      ? props.openReqJobOptions
      : DEFAULT_OPEN_REQ;

  const rosterOptions =
    props.rosterJobOptions && props.rosterJobOptions.length
      ? props.rosterJobOptions
      : DEFAULT_ROSTER;

  const scheduleOptions =
    props.scheduleJobOptions && props.scheduleJobOptions.length
      ? props.scheduleJobOptions
      : DEFAULT_SCHEDULE;

  const [rows, setRows] = useState<JobConfigRow[]>(() => {
    if (typeof window === "undefined") return createInitialRows(allCampuses);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialRows(allCampuses);
      const parsed = JSON.parse(raw) as JobConfigRow[];
      if (!Array.isArray(parsed) || !parsed.length) {
        return createInitialRows(allCampuses);
      }
      return parsed;
    } catch {
      return createInitialRows(allCampuses);
    }
  });

  // Persist to localStorage whenever rows change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // ignore
    }
  }, [rows]);

  const nextId = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1),
    [rows]
  );

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: nextId,
        resourceType: "",
        directCarePct: "",
        category: "",
        weekendRotations: [],
        campuses: [],
        openReqJob: "",
        rosterJob: "",
        scheduleJob: "",
        isCharge: false,
        isOriented: false,
        isPreceptor: false,
      },
    ]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRowField = <K extends keyof JobConfigRow>(
    id: number,
    field: K,
    value: JobConfigRow[K]
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const toggleCampus = (id: number, campus: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const selected = new Set(row.campuses);
        if (selected.has(campus)) {
          selected.delete(campus);
        } else {
          selected.add(campus);
        }
        return { ...row, campuses: Array.from(selected) };
      })
    );
  };

  const toggleAllCampuses = (id: number) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const allSelected =
          allCampuses.length > 0 &&
          allCampuses.every((c) => row.campuses.includes(c));
        return {
          ...row,
          campuses: allSelected ? [] : [...allCampuses],
        };
      })
    );
  };

  const toggleWeekendRotation = (id: number, rotation: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const selected = new Set(row.weekendRotations);
        if (selected.has(rotation)) {
          selected.delete(rotation);
        } else {
          selected.add(rotation);
        }
        return { ...row, weekendRotations: Array.from(selected) };
      })
    );
  };

  const allWeekendRotations = DEFAULT_WEEKEND_ROTATIONS;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">
        Job Configuration
      </h1>

      <Card className="space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500">
          <div className="col-span-2">Resource Type</div>
          <div>Direct Care</div>
          <div className="col-span-2">Weekend Rotation</div>
          <div className="col-span-2">Campus</div>
          <div>Category</div>
          <div>Open Req Job</div>
          <div>Roster Job</div>
          <div>Schedule Job</div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const allCampusesSelected =
              allCampuses.length > 0 &&
              allCampuses.every((c) => row.campuses.includes(c));

            const campusLabel =
              row.campuses.length > 0 ? row.campuses.join(", ") : "No campus";

            const weekendLabel =
              row.weekendRotations.length > 0
                ? row.weekendRotations.join(" • ")
                : "None";

            return (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-3 items-start rounded-xl border border-gray-200 bg-white p-3"
              >
                {/* Resource Type */}
                <div className="col-span-2 space-y-1">
                  <Input
                    value={row.resourceType}
                    id=""
                    placeholder="e.g. Nurse"
                    onChange={(e) =>
                      updateRowField(row.id, "resourceType", e.target.value)
                    }
                  />
                  <div className="text-[11px] text-gray-400">
                    {campusLabel}
                  </div>
                </div>

                {/* Direct Care */}
                <div>
                  <Input
                    value={row.directCarePct}
                    id=""
                    placeholder="100%"
                    onChange={(e) =>
                      updateRowField(row.id, "directCarePct", e.target.value)
                    }
                  />
                </div>

                {/* Weekend Rotation (multi) */}
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {allWeekendRotations.map((rot) => {
                      const checked = row.weekendRotations.includes(rot);
                      return (
                        <label
                          key={rot}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer ${
                            checked
                              ? "bg-brand-50 border-brand-500 text-brand-700"
                              : "bg-gray-50 border-gray-300 text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-1 h-3 w-3"
                            checked={checked}
                            onChange={() =>
                              toggleWeekendRotation(row.id, rot)
                            }
                          />
                          {rot}
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    Selected: {weekendLabel}
                  </div>
                </div>

                {/* Campus (multi + select all) */}
                <div className="col-span-2 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    <label className="inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer bg-gray-50 border-gray-300 text-gray-600">
                      <input
                        type="checkbox"
                        className="mr-1 h-3 w-3"
                        checked={allCampusesSelected}
                        onChange={() => toggleAllCampuses(row.id)}
                      />
                      Select All
                    </label>
                    {allCampuses.map((campus) => {
                      const checked = row.campuses.includes(campus);
                      return (
                        <label
                          key={campus}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer ${
                            checked
                              ? "bg-brand-50 border-brand-500 text-brand-700"
                              : "bg-gray-50 border-gray-300 text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-1 h-3 w-3"
                            checked={checked}
                            onChange={() => toggleCampus(row.id, campus)}
                          />
                          {campus}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Select
                    value={row.category}
                    onChange={(e) =>
                      updateRowField(
                        row.id,
                        "category",
                        e.target.value as Category
                      )
                    }
                  >
                    <option value="">Select…</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Support">Support</option>
                    <option value="Other">Other</option>
                  </Select>

                  {/* Flags */}
                  <div className="mt-2 flex flex-col gap-1 text-[11px] text-gray-600">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={row.isCharge}
                        onChange={(e) =>
                          updateRowField(row.id, "isCharge", e.target.checked)
                        }
                        className="h-3 w-3"
                      />
                      Charge
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={row.isOriented}
                        onChange={(e) =>
                          updateRowField(
                            row.id,
                            "isOriented",
                            e.target.checked
                          )
                        }
                        className="h-3 w-3"
                      />
                      Orientee
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={row.isPreceptor}
                        onChange={(e) =>
                          updateRowField(
                            row.id,
                            "isPreceptor",
                            e.target.checked
                          )
                        }
                        className="h-3 w-3"
                      />
                      Preceptor
                    </label>
                  </div>
                </div>

                {/* Open Req Job */}
                <div>
                  <Select
                    value={row.openReqJob}
                    onChange={(e) =>
                      updateRowField(row.id, "openReqJob", e.target.value)
                    }
                  >
                    <option value="">Select…</option>
                    {openReqOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Roster Job */}
                <div>
                  <Select
                    value={row.rosterJob}
                    onChange={(e) =>
                      updateRowField(row.id, "rosterJob", e.target.value)
                    }
                  >
                    <option value="">Select…</option>
                    {rosterOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Schedule Job + delete button */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Select
                      value={row.scheduleJob}
                      onChange={(e) =>
                        updateRowField(row.id, "scheduleJob", e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      {scheduleOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1 text-red-600"
                    onClick={() => removeRow(row.id)}
                  >
                    🗑
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            You can reuse the same Resource Type name with different weekend
            rotations and campuses. Weekend rotation and campus selections drive
            how the job is applied.
          </div>
          <Button type="button" onClick={addRow}>
            + Add Job
          </Button>
        </div>
      </Card>
    </div>
  );
}
