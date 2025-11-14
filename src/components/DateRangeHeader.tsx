import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

type DateRangeHeaderProps = {
  date: Date;
  setDate: Dispatch<SetStateAction<Date>>;
};

export default function DateRangeHeader({ date, setDate }: DateRangeHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-gray-200">
      {/* Prev Month */}
      <button
        aria-label="Previous Month"
        onClick={() => setDate(subMonths(date, 1))}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Two month labels */}
      <div className="flex gap-16">
        <div className="text-lg font-semibold">{format(date, "MMMM yyyy")}</div>
        <div className="text-lg font-semibold">{format(addMonths(date, 1), "MMMM yyyy")}</div>
      </div>

      {/* Next Month */}
      <button
        aria-label="Next Month"
        onClick={() => setDate(addMonths(date, 1))}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
