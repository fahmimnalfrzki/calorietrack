"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import EntryEditModal, { EditableEntry } from "./EntryEditModal";

interface FoodEntry {
  id: string;
  foodName: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  proteinSource: string | null;
  carbsSource: string | null;
  fatSource: string | null;
  portionGrams: string | null;
  ingredientsNote: string | null;
  wasEdited: boolean;
  createdAt: string;
}

type Metric = "calories" | "protein" | "carbs" | "fat";

const METRICS: Record<
  Metric,
  { label: string; unit: string; color: string; dot: string }
> = {
  calories: { label: "Kalori", unit: "kkal", color: "#111827", dot: "bg-gray-900" },
  protein: { label: "Protein", unit: "g", color: "#fb7185", dot: "bg-rose-400" },
  carbs: { label: "Karbo", unit: "g", color: "#fbbf24", dot: "bg-amber-400" },
  fat: { label: "Lemak", unit: "g", color: "#38bdf8", dot: "bg-sky-400" },
};

interface DayGroup {
  dateKey: string;
  label: string;
  totals: Record<Metric, number>;
  entries: FoodEntry[];
  isToday: boolean;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function groupByDay(entries: FoodEntry[], tz: string): DayGroup[] {
  const map = new Map<string, FoodEntry[]>();

  for (const entry of entries) {
    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(entry.createdAt));

    if (!map.has(localDate)) map.set(localDate, []);
    map.get(localDate)!.push(entry);
  }

  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => {
      const date = new Date(dateKey + "T00:00:00");
      const label = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }).format(date);
      return {
        dateKey,
        label,
        totals: {
          calories: items.reduce((s, e) => s + e.calories, 0),
          protein: round1(items.reduce((s, e) => s + parseFloat(e.protein), 0)),
          carbs: round1(items.reduce((s, e) => s + parseFloat(e.carbs), 0)),
          fat: round1(items.reduce((s, e) => s + parseFloat(e.fat), 0)),
        },
        entries: items.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
        isToday: dateKey === todayKey,
      };
    });
}

function buildChartData(days: DayGroup[], range: 7 | 30, metric: Metric, tz: string) {
  const result: { label: string; value: number; isToday: boolean; dateKey: string }[] = [];

  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
    const day = days.find((x) => x.dateKey === dateKey);
    const shortLabel = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(d);
    result.push({
      dateKey,
      label:
        range === 7
          ? new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d)
          : shortLabel,
      value: day?.totals[metric] ?? 0,
      isToday: i === 0,
    });
  }
  return result;
}

function toEditable(e: FoodEntry): EditableEntry {
  return {
    id: e.id,
    foodName: e.foodName,
    calories: e.calories,
    protein: parseFloat(e.protein),
    carbs: parseFloat(e.carbs),
    fat: parseFloat(e.fat),
    proteinSource: e.proteinSource ?? "",
    carbsSource: e.carbsSource ?? "",
    fatSource: e.fatSource ?? "",
    portionGrams: e.portionGrams != null ? parseFloat(e.portionGrams) : null,
    ingredientsNote: e.ingredientsNote,
    createdAt: e.createdAt,
    wasEdited: e.wasEdited,
  };
}

export default function DashboardClient() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30>(7);
  const [metric, setMetric] = useState<Metric>("calories");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditableEntry | null>(null);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const loadEntries = useCallback(() => {
    return fetch("/api/entries")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadEntries().finally(() => setLoading(false));
  }, [loadEntries]);

  const days = groupByDay(entries, tz);
  const chartData = buildChartData(days, range, metric, tz);
  const today = days.find((d) => d.isToday);
  const m = METRICS[metric];

  function toggleDay(dateKey: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  }

  async function handleModalSaved() {
    await loadEntries();
    setEditing(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>

      {/* Today summary — kalori besar + 3 makro */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 mb-5">
        <p className="text-sm text-gray-400 mb-1">Hari ini</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-bold">{today?.totals.calories ?? 0}</span>
          <span className="text-gray-400 text-base">kkal</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["protein", "carbs", "fat"] as const).map((mk) => (
            <div key={mk} className="bg-white/10 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${METRICS[mk].dot}`} />
                <span className="text-[11px] text-gray-300">{METRICS[mk].label}</span>
              </div>
              <span className="text-base font-semibold">
                {today?.totals[mk] ?? 0}
                <span className="text-xs text-gray-400 font-normal">g</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart dengan pemilih metrik + rentang */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        {/* Metric selector */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto">
          {(Object.keys(METRICS) as Metric[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                metric === key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${METRICS[key].dot}`} />
              {METRICS[key].label}
            </button>
          ))}
        </div>

        {/* Range toggle */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Tren {m.label}
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {r === 7 ? "7 hari" : "30 hari"}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              interval={range === 30 ? 4 : 0}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [`${value} ${m.unit}`, m.label]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.dateKey}
                  fill={entry.isToday ? m.color : "#E5E7EB"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* History list */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Riwayat</h2>
      {days.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p>Belum ada data. Mulai scan makananmu!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <div
              key={day.dateKey}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => toggleDay(day.dateKey)}
                className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {day.isToday ? "Hari ini" : day.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{day.entries.length} entri</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    {day.totals.calories}{" "}
                    <span className="text-xs font-normal text-gray-400">kkal</span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    className={`transition-transform ${expandedDays.has(day.dateKey) ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {expandedDays.has(day.dateKey) && (
                <div className="border-t border-gray-50">
                  {day.entries.map((entry) => {
                    const time = new Intl.DateTimeFormat("id-ID", {
                      timeZone: tz,
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(entry.createdAt));
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setEditing(toEditable(entry))}
                        className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 font-medium truncate">
                              {entry.foodName}
                            </p>
                            <p className="text-xs text-gray-400">{time}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 shrink-0">
                            {entry.calories} kkal
                          </span>
                        </div>
                        {/* Makro ringkas — satu baris chip, rapi & minim scroll */}
                        <div className="flex gap-2 mt-1.5">
                          {([
                            { v: entry.protein, dot: "bg-rose-400" },
                            { v: entry.carbs, dot: "bg-amber-400" },
                            { v: entry.fat, dot: "bg-sky-400" },
                          ]).map((s, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {parseFloat(s.v)}g
                            </span>
                          ))}
                          <span className="ml-auto text-xs text-gray-300">ketuk untuk detail</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EntryEditModal
          entry={editing}
          onSaved={handleModalSaved}
          onDeleted={handleModalSaved}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
