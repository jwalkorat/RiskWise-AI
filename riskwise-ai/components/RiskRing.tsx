"use client";
import { type RiskLevel } from "@/data/mock";
import { cn } from "@/lib/utils";

interface RiskRingProps {
  score: number;
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const levelColor: Record<
  RiskLevel,
  { stroke: string; text: string; bg: string }
> = {
  High: { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50" },
  Medium: { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" },
  Low: { stroke: "#14b8a6", text: "text-teal-600", bg: "bg-teal-50" },
};

const sizeConfig = {
  sm: {
    size: 80,
    cx: 40,
    cy: 40,
    r: 32,
    strokeWidth: 6,
    textSize: "text-lg",
    labelSize: "text-[9px]",
  },
  md: {
    size: 120,
    cx: 60,
    cy: 60,
    r: 48,
    strokeWidth: 8,
    textSize: "text-2xl",
    labelSize: "text-[10px]",
  },
  lg: {
    size: 160,
    cx: 80,
    cy: 80,
    r: 64,
    strokeWidth: 10,
    textSize: "text-4xl",
    labelSize: "text-xs",
  },
};

export function RiskRing({
  score,
  level,
  size = "md",
  showLabel = true,
}: RiskRingProps) {
  const colors = levelColor[level];
  const cfg = sizeConfig[size];
  const circumference = 2 * Math.PI * cfg.r;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          width={cfg.size}
          height={cfg.size}
          viewBox={`0 0 ${cfg.size} ${cfg.size}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={cfg.cx}
            cy={cfg.cy}
            r={cfg.r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={cfg.strokeWidth}
          />
          {/* Risk arc */}
          <circle
            cx={cfg.cx}
            cy={cfg.cy}
            r={cfg.r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={cfg.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn("font-bold leading-none", cfg.textSize, colors.text)}
          >
            {score}
          </span>
          {showLabel && (
            <span
              className={cn("font-medium text-gray-400 mt-0.5", cfg.labelSize)}
            >
              / 100
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
