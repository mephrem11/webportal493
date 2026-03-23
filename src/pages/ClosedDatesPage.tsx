import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarX2 } from "lucide-react";
import { useSimpleAuth } from "../contexts/SimpleAuthContext";

type ClosedDate = {
  name: string;
  date: string;
  note?: string;
};

function defaultClosedDates(year: number): ClosedDate[] {
  return [
    { name: "New Year's Day", date: `${year}-01-01` },
    { name: "Memorial Day", date: `${year}-05-27` },
    { name: "Independence Day", date: `${year}-07-04` },
    { name: "Labor Day", date: `${year}-09-02` },
    { name: "Thanksgiving Day", date: `${year}-11-28` },
    { name: "Christmas Day", date: `${year}-12-25` },
  ];
}

function readClosedDates(): ClosedDate[] {
  const year = new Date().getFullYear();
  try {
    const saved = JSON.parse(localStorage.getItem("delivery_closed_dates") || "[]") as ClosedDate[];
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {
    // ignore parse errors and use defaults
  }
  return defaultClosedDates(year);
}

export function ClosedDatesPage() {
  const { isAdmin } = useSimpleAuth();
  const navigate = useNavigate();
  const closedDates = useMemo(() => readClosedDates(), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate(isAdmin ? "/staff/dashboard" : "/portal")}
          className="mb-6 flex items-center gap-2 text-sm text-[#00C853] transition-colors hover:text-[#00B248]"
        >
          <ArrowLeft size={18} />
          {isAdmin ? "Back to Staff Portal" : "Back to Portal"}
        </button>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Calendar and Closed Dates</h1>
          <p className="mt-2 text-sm text-gray-600">
            Dates listed below are non-delivery days for planning schedules and request timing.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {closedDates.map((entry) => (
            <div key={`${entry.name}-${entry.date}`} className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                {entry.note && <p className="mt-1 text-xs text-gray-500">{entry.note}</p>}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                <CalendarX2 size={13} />
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
