import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ChevronRight } from "lucide-react";

export function DashboardSkeleton({
  roleName = "Dashboard",
}: {
  roleName?: string;
}) {
  const isStudent = roleName.includes("Student");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Fake Navbar - Matches Exact Real Navbar Layout */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
            <span className="font-bold text-slate-400">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-sm text-slate-400 font-medium">
              {roleName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-up w-full flex-grow">
        {/* Welcome / Header Area */}
        <div>
          <Skeleton className="h-8 w-[300px] mb-3" />
          <Skeleton className="h-4 w-[400px]" />
        </div>

        {isStudent ? (
          // ── STUDENT SPECIFIC SKELETON LAYOUT ──
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (Risk & Subjects) */}
            <div className="space-y-6">
              {/* Risk Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-5 w-[60px] rounded-full" />
                </div>
                <div className="flex items-center gap-5">
                  <Skeleton className="w-[80px] h-[80px] rounded-full shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                  </div>
                </div>
              </div>

              {/* Subject Records Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
                <Skeleton className="h-4 w-[120px] mb-2" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-[80px]" />
                      <Skeleton className="h-3 w-[40px]" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Charts) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Radar Chart Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-8 w-[100px] rounded-lg" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="w-[250px] h-[250px] rounded-full" />
                </div>
              </div>

              {/* Area Chart Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[140px]" />
                  <Skeleton className="h-3 w-[250px]" />
                </div>
                <Skeleton className="h-[200px] w-full rounded-xl" />
              </div>
            </div>
          </div>
        ) : (
          // ── STAFF (TEACHER/MENTOR/COORD) SPECIFIC SKELETON LAYOUT ──
          <>
            {/* 4 Top KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                  </div>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>

            {/* Chart & Interaction Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-[300px] w-full rounded-xl" />
              </div>
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                  <Skeleton className="h-5 w-[150px]" />
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
