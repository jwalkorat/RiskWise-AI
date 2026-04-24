"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SubjectRadarChartProps {
  data: {
    label: string;
    marks: number;
    attendance: number;
  }[];
  riskLevel?: "Low" | "Medium" | "High";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SubjectRadarChart({
  data,
  riskLevel = "Low",
}: SubjectRadarChartProps) {
  if (!data || data.length === 0) return null;

  const strokeColor =
    riskLevel === "High"
      ? "#ef4444"
      : riskLevel === "Medium"
        ? "#f59e0b"
        : "#14b8a6";
  const fillColor =
    riskLevel === "High"
      ? "#fef2f2"
      : riskLevel === "Medium"
        ? "#fffbeb"
        : "#f0fdf4";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart
        data={data}
        margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
      >
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 9, fill: "#94a3b8" }}
          tickCount={5}
        />
        <Radar
          name="Marks"
          dataKey="marks"
          stroke={strokeColor}
          fill={fillColor}
          fillOpacity={0.6}
          strokeWidth={2}
          dot={{ r: 3, fill: strokeColor }}
        />
        <Radar
          name="Attendance"
          dataKey="attendance"
          stroke="#6366f1"
          fill="#eef2ff"
          fillOpacity={0.4}
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 3, fill: "#6366f1" }}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
