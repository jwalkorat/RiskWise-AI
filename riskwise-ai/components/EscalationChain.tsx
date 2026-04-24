"use client";

import { CheckCircle2, Clock, AlertTriangle, Mail } from "lucide-react";

interface EscalationChainProps {
  riskScore: number;
  riskCategory: string;
  hasMentor: boolean;
  hasIntervention: boolean;
  emailSent?: boolean;
}

const stages = [
  {
    id: 1,
    label: "Data Recorded",
    description: "Teacher has submitted subject data",
    icon: CheckCircle2,
    threshold: 0,
  },
  {
    id: 2,
    label: "Risk Flagged",
    description: "AI model computed risk score",
    icon: AlertTriangle,
    threshold: 1,
  },
  {
    id: 3,
    label: "Mentor Assigned",
    description: "Student linked to a faculty mentor",
    icon: Clock,
    threshold: 30,
    needsMentor: true,
  },
  {
    id: 4,
    label: "Intervention Logged",
    description: "Mentor has conducted a session",
    icon: CheckCircle2,
    threshold: 60,
    needsIntervention: true,
  },
  {
    id: 5,
    label: "Parent Notified",
    description: "Email alert sent to parent",
    icon: Mail,
    threshold: 75,
    needsEmail: true,
  },
];

export function EscalationChain({
  riskScore,
  riskCategory,
  hasMentor,
  hasIntervention,
  emailSent,
}: EscalationChainProps) {
  const getStageStatus = (stage: (typeof stages)[0]) => {
    if (stage.id === 1) return "done";
    if (stage.id === 2 && riskScore > 0) return "done";
    if (stage.id === 3)
      return hasMentor
        ? "done"
        : riskScore >= stage.threshold
          ? "pending"
          : "idle";
    if (stage.id === 4)
      return hasIntervention
        ? "done"
        : riskScore >= stage.threshold
          ? "pending"
          : "idle";
    if (stage.id === 5)
      return emailSent
        ? "done"
        : riskScore >= stage.threshold
          ? "pending"
          : "idle";
    return "idle";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-5 text-sm uppercase tracking-wide">
        🚨 Escalation Pipeline
      </h3>
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 z-0" />

        <div className="relative z-10 flex items-start justify-between gap-2">
          {stages.map((stage, idx) => {
            const status = getStageStatus(stage);
            const Icon = stage.icon;

            const dotClass =
              status === "done"
                ? "bg-teal-500 border-teal-500 text-white"
                : status === "pending"
                  ? "bg-amber-400 border-amber-400 text-white animate-pulse"
                  : "bg-white border-slate-300 text-slate-400";

            const labelClass =
              status === "done"
                ? "text-teal-700 font-semibold"
                : status === "pending"
                  ? "text-amber-600 font-semibold"
                  : "text-slate-400";

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center gap-2 flex-1 min-w-0"
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${dotClass}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className={`text-xs leading-tight ${labelClass}`}>
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight hidden sm:block">
                    {stage.description}
                  </p>
                  {status === "pending" && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block">
                      Action Needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk context */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${
            riskCategory === "High"
              ? "bg-red-500"
              : riskCategory === "Medium"
                ? "bg-amber-500"
                : "bg-teal-500"
          }`}
        />
        <p className="text-xs text-slate-500">
          Current Risk Score:{" "}
          <span
            className={`font-bold ${
              riskCategory === "High"
                ? "text-red-600"
                : riskCategory === "Medium"
                  ? "text-amber-600"
                  : "text-teal-600"
            }`}
          >
            {riskScore}/100
          </span>{" "}
          &bull; Category: <span className="font-semibold">{riskCategory}</span>
        </p>
      </div>
    </div>
  );
}
