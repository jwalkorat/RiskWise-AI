import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Bell,
  Users,
  BookOpen,
  ArrowRight,
  BarChart3,
  Brain,
  HeartHandshake,
  CheckCircle2,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-200">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg leading-none block">
                RiskWise
              </span>
              <span className="text-indigo-600 text-xs font-semibold tracking-wide">
                AI
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#roles"
              className="hover:text-indigo-600 transition-colors"
            >
              For Every Role
            </a>
            <a
              href="#stats"
              className="hover:text-indigo-600 transition-colors"
            >
              Impact
            </a>
          </div>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Brain className="w-3.5 h-3.5" />
            AI-Powered Academic Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Identify Risk.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              Intervene Early.
            </span>{" "}
            Transform Outcomes.
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-10">
            RiskWise AI unifies attendance, assignment, and exam data to deliver
            a real-time Academic Risk Index for every student — empowering
            mentors, teachers, and coordinators to act before it&apos;s too
            late.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              id="hero-cta-btn"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 flex items-center gap-2 text-base"
            >
              Get Started — It&apos;s Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="text-slate-600 hover:text-indigo-600 font-medium px-6 py-4 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white transition-all text-base flex items-center gap-2"
            >
              <BookOpen className="w-4.5 h-4.5 w-4" />
              See How It Works
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 blur-3xl rounded-3xl" />
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-200/80 overflow-hidden p-6">
            {/* Fake dashboard preview */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 bg-slate-100 rounded-full h-5 ml-2 max-w-xs" />
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Total Students",
                  value: "60",
                  color: "bg-indigo-50 border-indigo-100",
                  icon: "👥",
                },
                {
                  label: "High Risk",
                  value: "14",
                  color: "bg-red-50 border-red-100",
                  icon: "⚠️",
                },
                {
                  label: "Interventions",
                  value: "38",
                  color: "bg-amber-50 border-amber-100",
                  icon: "🤝",
                },
                {
                  label: "Avg Attendance",
                  value: "74%",
                  color: "bg-teal-50 border-teal-100",
                  icon: "📊",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`${stat.color} border rounded-xl p-4`}
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-slate-800">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                Students at Risk — Sorted by Risk Score
              </div>
              {[
                {
                  name: "Arjun Verma",
                  score: 88,
                  risk: "High",
                  attendance: "52%",
                },
                {
                  name: "Neha Singh",
                  score: 82,
                  risk: "High",
                  attendance: "58%",
                },
                {
                  name: "Rahul Khanna",
                  score: 75,
                  risk: "High",
                  attendance: "63%",
                },
                {
                  name: "Priya Nair",
                  score: 58,
                  risk: "Medium",
                  attendance: "71%",
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between py-2.5 border-b border-slate-200/60 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-300 flex items-center justify-center text-white text-xs font-bold">
                      {s.name[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {s.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      Att: {s.attendance}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.risk === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {s.risk}
                    </span>
                    <span
                      className={`text-sm font-bold ${s.risk === "High" ? "text-red-600" : "text-amber-600"}`}
                    >
                      {s.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section
        id="stats"
        className="bg-white border-y border-slate-200/80 py-12"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              {
                value: "60+",
                label: "Students Monitored",
                color: "text-indigo-600",
              },
              { value: "6", label: "Subject Domains", color: "text-blue-600" },
              {
                value: "4",
                label: "Role-Based Dashboards",
                color: "text-teal-600",
              },
              {
                value: "Real-time",
                label: "Risk Detection",
                color: "text-amber-600",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className={`text-3xl font-extrabold mb-1 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              proactive intervention
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Every feature is designed to reduce the gap between a student
            struggling in silence and an educator who can help.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
              title: "Academic Risk Index",
              desc: "A single composite score (0–100) derived from attendance, assignment completion, and exam performance — calculated automatically.",
              color: "bg-indigo-50 border-indigo-100",
            },
            {
              icon: <Bell className="w-6 h-6 text-amber-600" />,
              title: "Smart Notifications",
              desc: "Automated alerts for missed submissions, attendance violations, and risk score changes sent to the right stakeholder instantly.",
              color: "bg-amber-50 border-amber-100",
            },
            {
              icon: <HeartHandshake className="w-6 h-6 text-teal-600" />,
              title: "Intervention Logging",
              desc: "Mentors can log structured intervention notes with pre/post performance charts to track the effectiveness of each session.",
              color: "bg-teal-50 border-teal-100",
            },
            {
              icon: <Users className="w-6 h-6 text-blue-600" />,
              title: "Multi-Role Access",
              desc: "Purpose-built dashboards for Students, Faculty Mentors, Subject Teachers, and Academic Coordinators — each seeing what matters to them.",
              color: "bg-blue-50 border-blue-100",
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-green-600" />,
              title: "Performance Trend Charts",
              desc: "Interactive Recharts line graphs showing marks over time with visible before/after intervention markers.",
              color: "bg-green-50 border-green-100",
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
              title: "Department Overview",
              desc: "Coordinators get a bird's-eye view of the entire cohort — sortable, filterable, with intervention history at a glance.",
              color: "bg-purple-50 border-purple-100",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className={`${feat.color} border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-0.5`}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 border border-white">
                {feat.icon}
              </div>
              <h3 className="font-semibold text-slate-800 text-lg mb-2">
                {feat.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Role Cards ── */}
      <section id="roles" className="bg-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              One Platform. Four Perspectives.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every user sees a purpose-built experience tailored to their role
              in a student&apos;s academic journey.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Student",
                icon: "🎓",
                color: "from-indigo-500 to-blue-400",
                desc: "Personal risk score, pending assignments, progress charts, and mentor session notifications.",
                features: [
                  "Personal Risk Index ring",
                  "Pending assignment checklist",
                  "Mark trend graph",
                  "Mentor alert notifications",
                ],
              },
              {
                title: "Faculty Mentor",
                icon: "🤝",
                color: "from-teal-500 to-emerald-400",
                desc: "Student roster sorted by risk, detailed profiles, intervention logging, and pre/post performance graphs.",
                features: [
                  "Risk-sorted student table",
                  "Detailed student drill-down",
                  "Intervention log form",
                  "Performance trajectory chart",
                ],
              },
              {
                title: "Subject Teacher",
                icon: "📚",
                color: "from-amber-500 to-orange-400",
                desc: "Subject-specific student list with inline mark and attendance editing capabilities.",
                features: [
                  "Subject student roster",
                  "Inline marks update",
                  "Attendance editing",
                  "Risk-sorted view",
                ],
              },
              {
                title: "Academic Coordinator",
                icon: "🏛️",
                color: "from-purple-500 to-pink-400",
                desc: "Comprehensive department overview with 60-student table, risk KPIs, and intervention history.",
                features: [
                  "Department risk score",
                  "All-students table",
                  "Intervention snippets",
                  "Risk distribution chart",
                ],
              },
            ].map((role) => (
              <div
                key={role.title}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-500 transition-all"
              >
                <div
                  className={`inline-flex items-center gap-2 bg-gradient-to-r ${role.color} text-white text-sm font-bold px-4 py-2 rounded-xl mb-4`}
                >
                  <span>{role.icon}</span>
                  {role.title}
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  {role.desc}
                </p>
                <ul className="space-y-2">
                  {role.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl p-12 shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to protect your students?
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              Choose your role and explore the dashboard designed for you.
            </p>
            <Link
              href="/login"
              id="bottom-cta-btn"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              Sign In to Your Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-600">RiskWise AI</span>
        </div>
        <p>© 2024 RiskWise AI. Built for proactive academic excellence.</p>
      </footer>
    </div>
  );
}
