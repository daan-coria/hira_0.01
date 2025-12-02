import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useApp, DefaultJobConfiguration } from "@/store/AppContext";

type Category = "Nursing" | "Support" | "Other" | "";

type JobConfigRow = {
  id: number;
  resourceType: string;
  directCarePct: string;
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

const DEFAULT_CAMPUSES = ["Lansing", "Bay", "Flint"];

const DEFAULT_WEEKEND_ROTATIONS = [
  "Every Other",
  "Every Third",
  "Weekend Only",
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

export default function JobConfigurationCard(props: JobConfigurationAdminProps) {
  const {
    defaultJobConfigurations,
    setDefaultJobConfigurations,
  } = useApp();

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

  const [rows, setRows] = useState<JobConfigRow[]>([]);

  // Initialize from defaults coming from Health System Setup
  useEffect(() => {
    if (defaultJobConfigurations && defaultJobConfigurations.length) {
      const mapped: JobConfigRow[] = defaultJobConfigurations.map(
        (r: DefaultJobConfiguration) => ({
          id: r.id,
          resourceType: r.resourceType,
          directCarePct: r.directCarePct,
          category: (r.category as Category) || "",
          weekendRotations: Array.isArray(r.weekendRotations)
            ? r.weekendRotations
            : [],
          campuses: Array.isArray(r.campuses) ? r.campuses : [],
          openReqJob: r.openReqJob || "",
          rosterJob: r.rosterJob || "",
          scheduleJob: r.scheduleJob || "",
          isCharge: !!r.isCharge,
          isOriented: !!r.isOriented,
          isPreceptor: !!r.isPreceptor,
        })
      );
      setRows(mapped);
    } else {
      const initial = createInitialRows(allCampuses);
      setRows(initial);
      setDefaultJobConfigurations(initial as any);
    }
  }, [defaultJobConfigurations, allCampuses, setDefaultJobConfigurations]);

  const nextId = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1),
    [rows]
  );

  const syncToDefaults = (rowsToSync: JobConfigRow[]) => {
    const mapped: DefaultJobConfiguration[] = rowsToSync.map((r) => ({
      id: r.id,
      resourceType: r.resourceType,
      directCarePct: r.directCarePct,
      category: r.category,
      weekendRotations: [...r.weekendRotations],              
      campuses: [...r.campuses],
      openReqJob: r.openReqJob,
      rosterJob: r.rosterJob,
      scheduleJob: r.scheduleJob,
      isCharge: r.isCharge,
      isOriented: r.isOriented,
      isPreceptor: r.isPreceptor,
    }));
    setDefaultJobConfigurations(mapped);
  };

  const addRow = () => {
    setRows((prev) => {
      const updated = [
        ...prev,
        {
          id: nextId,
          resourceType: "",
          directCarePct: "",
          category: "" as Category,                            
          weekendRotations: [] as string[],                    
          campuses: [] as string[], 
          openReqJob: "",
          rosterJob: "",
          scheduleJob: "",
          isCharge: false,
          isOriented: false,
          isPreceptor: false,
        },
      ];
      syncToDefaults(updated);
      return updated;
    });
  };

  const removeRow = (id: number) => {
    setRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      syncToDefaults(updated);
      return updated;
    });
  };

  const updateRowField = <K extends keyof JobConfigRow>(
    id: number,
    field: K,
    value: JobConfigRow[K]
  ) => {
    setRows((prev) => {
      const updated = prev.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      );
      syncToDefaults(updated);
      return updated;
    });
  };

  const toggleCampus = (id: number, campus: string) => {
    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.id !== id) return row;
        const selected = new Set(row.campuses);
        if (selected.has(campus)) {
          selected.delete(campus);
        } else {
          selected.add(campus);
        }
        return { ...row, campuses: Array.from(selected) };
      });
      syncToDefaults(updated);
      return updated;
    });
  };

  const toggleAllCampuses = (id: number) => {
    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.id !== id) return row;
        const allSelected =
          allCampuses.length > 0 &&
          allCampuses.every((c) => row.campuses.includes(c));
        return {
          ...row,
          campuses: allSelected ? [] : [...allCampuses],
        };
      });
      syncToDefaults(updated);
      return updated;
    });
  };

  const toggleWeekendRotation = (id: number, rotation: string) => {
    setRows((prev) => {
      const updated = prev.map((row) => {
        if (row.id !== id) return row;
        const selected = new Set(row.weekendRotations);
        if (selected.has(rotation)) {
          selected.delete(rotation);
        } else {
          selected.add(rotation);
        }
        return { ...row, weekendRotations: Array.from(selected) };
      });
      syncToDefaults(updated);
      return updated;
    });
  };

  const allWeekendRotations = DEFAULT_WEEKEND_ROTATIONS;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Job Configuration</h1>

      <Card className="space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-6 text-xs font-semibold text-gray-600 pb-2">
          <div>Resource Type</div>
          <div>Direct Care</div>
          <div>Weekend Rotation</div>
          <div>Campus</div>
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
                className="grid grid-cols-7 gap-6 items-start rounded-xl border border-gray-200 bg-white p-4"
              >
                {/* Resource Type */}
                <div>
                  <Input
                    id=""
                    value={row.resourceType}
                    onChange={(e) =>
                      updateRowField(row.id, "resourceType", e.target.value)
                    }
                    className="w-full"
                  />
                  <div className="text-[11px] text-gray-400">{campusLabel}</div>
                </div>

                {/* Direct Care */}
                <div>
                  <Input
                    id=""
                    value={row.directCarePct}
                    onChange={(e) =>
                      updateRowField(row.id, "directCarePct", e.target.value)
                    }
                    className="w-full"
                  />
                </div>

                {/* Weekend Rotation */}
                <div>
                  <Select
                    value={row.weekendRotations[0] ?? ""}
                    onChange={(e) =>
                      updateRowField(row.id, "weekendRotations", [
                        (e.target as HTMLSelectElement).value,
                      ])
                    }
                    className="w-full"
                  >
                    <option value="">Select...</option>
                    {allWeekendRotations.map((rot) => (
                      <option key={rot} value={rot}>
                        {rot}
                      </option>
                    ))}
                  </Select>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {weekendLabel}
                  </div>
                </div>

                {/* Campus */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer bg-gray-50 border-gray-300 text-gray-600">
                      <input
                        type="checkbox"
                        className="mr-1 h-3 w-3"
                        checked={allCampusesSelected}
                        onChange={() => toggleAllCampuses(row.id)}
                      />
                      Default
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

                {/* Open Req Job */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {openReqOptions.map((o) => {
                      const selected = row.openReqJob
                        .split(",")
                        .filter(Boolean)
                        .includes(o);
                      return (
                        <label
                          key={o}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer ${
                            selected
                              ? "bg-brand-50 border-brand-500 text-brand-700"
                              : "bg-gray-50 border-gray-300 text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-1 h-3 w-3"
                            checked={selected}
                            onChange={() => {
                              const current = row.openReqJob
                                ? row.openReqJob.split(",").filter(Boolean)
                                : [];
                              const set = new Set(current);
                              selected ? set.delete(o) : set.add(o);
                              updateRowField(
                                row.id,
                                "openReqJob",
                                Array.from(set).join(",")
                              );
                            }}
                          />
                          {o}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Roster Job */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {rosterOptions.map((o) => {
                      const selected = row.rosterJob
                        .split(",")
                        .filter(Boolean)
                        .includes(o);
                      return (
                        <label
                          key={o}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer ${
                            selected
                              ? "bg-brand-50 border-brand-500 text-brand-700"
                              : "bg-gray-50 border-gray-300 text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-1 h-3 w-3"
                            checked={selected}
                            onChange={() => {
                              const current = row.rosterJob
                                ? row.rosterJob.split(",").filter(Boolean)
                                : [];
                              const set = new Set(current);
                              selected ? set.delete(o) : set.add(o);
                              updateRowField(
                                row.id,
                                "rosterJob",
                                Array.from(set).join(",")
                              );
                            }}
                          />
                          {o}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule Job + Delete */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {scheduleOptions.map((o) => {
                      const selected = row.scheduleJob
                        .split(",")
                        .filter(Boolean)
                        .includes(o);
                      return (
                        <label
                          key={o}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] cursor-pointer ${
                            selected
                              ? "bg-brand-50 border-brand-500 text-brand-700"
                              : "bg-gray-50 border-gray-300 text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-1 h-3 w-3"
                            checked={selected}
                            onChange={() => {
                              const current = row.scheduleJob
                                ? row.scheduleJob.split(",").filter(Boolean)
                                : [];
                              const set = new Set(current);
                              selected ? set.delete(o) : set.add(o);
                              updateRowField(
                                row.id,
                                "scheduleJob",
                                Array.from(set).join(",")
                              );
                            }}
                          />
                          {o}
                        </label>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑
                  </button>
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
