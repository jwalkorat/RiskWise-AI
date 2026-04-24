"use client";
import { type RiskLevel } from "@/data/mock";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
}

const riskConfig: Record<
  RiskLevel,
  { label: string; classes: string; dot: string }
> = {
  High: {
    label: "High Risk",
    classes: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  Medium: {
    label: "Medium Risk",
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  Low: {
    label: "Low Risk",
    classes: "bg-teal-50 text-teal-700 border border-teal-200",
    dot: "bg-teal-500",
  },
};

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  const config = riskConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        config.classes,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
      {score !== undefined && (
        <span className="ml-0.5 opacity-70">({score})</span>
      )}
    </span>
  );
}
