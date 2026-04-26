import {
  Bell,
  BookOpen,
  CircleHelp,
  ClipboardList,
  FolderOpen,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Pencil,
  PlusCircle,
  Settings,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

/** Grille calendrier (lun–dim), cases vides = null */
function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const daysInMonth = last.getDate();
  const startPad = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateInput(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date locale du jour (minuit), pour calendrier / sélection cohérente */
function todayLocal() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Style type « carte stat » : bandeau gauche + fond teinté (rotation sur la liste) */
const PLANNING_CARD_ACCENTS = [
  {
    bar: "border-l-blue-600",
    bg: "bg-blue-50",
    dayCircle: "bg-white text-blue-700 shadow-sm",
    title: "text-blue-950",
  },
  {
    bar: "border-l-emerald-600",
    bg: "bg-emerald-50",
    dayCircle: "bg-white text-emerald-700 shadow-sm",
    title: "text-emerald-950",
  },
  {
    bar: "border-l-orange-500",
    bg: "bg-orange-50",
    dayCircle: "bg-white text-orange-700 shadow-sm",
    title: "text-orange-950",
  },
  {
    bar: "border-l-red-600",
    bg: "bg-red-50",
    dayCircle: "bg-white text-red-700 shadow-sm",
    title: "text-red-950",
  },
];
function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export default function TeacherDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const teacherName = user.fullName || user.email || "Enseignant";
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDate, setViewDate] = useState(() => {
  const t = todayLocal();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => todayLocal());

  const analyticsMock = {
    totalTeams: 12,
    projectStages: {
      cadrage: 100,
      conception: 85,
      realisation: 45,
      redaction: 15,
    },
    teamPerformance: [
      { id: 1, name: "Groupe 1", completedTasks: 1, totalTasks: 30 },
      { id: 2, name: "Groupe 2", completedTasks: 4, totalTasks: 31 },
      { id: 3, name: "Groupe 3", completedTasks: 5, totalTasks: 33 },
      { id: 4, name: "Groupe 4", completedTasks: 8, totalTasks: 32 },
    ],
    activity: {
      daily: [20, 35, 30, 50, 40, 55, 48],
      weekly: [35, 48, 42, 60, 55, 70, 65, 58],
      annually: [48, 62, 40, 55, 78, 60, 75, 68, 52, 50, 42, 72],
    },
  };

  const [analytics, setAnalytics] = useState(analyticsMock);
  const [activityRange, setActivityRange] = useState("annually");

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthCells = useMemo(
    () => buildMonthCells(year, monthIndex),
    [year, monthIndex],
  );

  const monthLabel = viewDate.toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });

  const stats = [
    {
      title: "Encadrements",
      value: "05",
      icon: <Users size={18} />,
      bg: "bg-blue-50",
      text: "text-blue-700",
      bar: "border-l-blue-600",
    },
    {
      title: "Projets (Jury)",
      value: "07",
      icon: <User size={18} />,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      bar: "border-l-emerald-600",
    },
    {
      title: "Sujets déposés",
      value: "03",
      icon: <FolderOpen size={18} />,
      bg: "bg-orange-50",
      text: "text-orange-700",
      bar: "border-l-orange-600",
    },
    {
      title: "Actions requises",
      value: "09",
      icon: <Bell size={18} />,
      bg: "bg-red-50",
      text: "text-red-700",
      bar: "border-l-red-600",
    },
  ];

  /** Planning dynamique (ajouté par l’encadreur) */
  const [planningItems, setPlanningItems] = useState([]);
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(() => toDateInputValue(todayLocal()));
  const [formTime, setFormTime] = useState("09:00");
  /** null = création, sinon id de l’entrée en cours d’édition */
  const [editingId, setEditingId] = useState(null);

  const sortedPlanning = useMemo(() => {
    return [...planningItems].sort(
      (a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time),
    );
  }, [planningItems]);
 const globalProgress = useMemo(() => {
  const values = Object.values(analytics.projectStages || {});
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}, [analytics]);

const teamPerformanceData = useMemo(() => {
  return (analytics.teamPerformance || []).map((team) => ({
    ...team,
    percent: team.totalTasks
      ? Math.round((team.completedTasks / team.totalTasks) * 100)
      : 0,
  }));
}, [analytics]);

const progressArc = useMemo(() => {
  const endAngle = 180 + (globalProgress / 100) * 180;
  return describeArc(120, 120, 86, 180, endAngle);
}, [globalProgress]);

  function openPlanningForm() {
    setEditingId(null);
    setFormDate(toDateInputValue(selectedDate));
    setFormTitle("");
    setFormTime("09:00");
    setShowPlanningForm(true);
  }

  function openEditPlanning(item) {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDate(toDateInputValue(item.date));
    setFormTime(item.time);
    setSelectedDate(item.date);
    setViewDate(new Date(item.date.getFullYear(), item.date.getMonth(), 1));
    setShowPlanningForm(true);
  }

  function handleDeletePlanning(id) {
    setPlanningItems((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) {
      setShowPlanningForm(false);
      setEditingId(null);
    }
  }

  function handleValidatePlanning(e) {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title || !formDate || !formTime) return;
    const date = parseDateInput(formDate);
    const sortFn = (a, b) =>
      a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time);

    if (editingId) {
      setPlanningItems((prev) =>
        prev
          .map((p) =>
            p.id === editingId
              ? { ...p, title, date, time: formTime }
              : p,
          )
          .sort(sortFn),
      );
    } else {
      setPlanningItems((prev) =>
        [
          ...prev,
          {
            id: crypto.randomUUID(),
            title,
            date,
            time: formTime,
          },
        ].sort(sortFn),
      );
    }
    setEditingId(null);
    setShowPlanningForm(false);
    setSelectedDate(date);
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function closePlanningForm() {
    setShowPlanningForm(false);
    setEditingId(null);
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="flex min-h-screen items-stretch">
        <Sidebar />
        
        {/* Content */}
        <section className="flex-1 p-4 sm:p-6">
          <div className="rounded-[24px] bg-white p-4 shadow-sm sm:p-6">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-700">Accueil</h2>

              <div className="flex items-center gap-3">
                <button className="relative text-slate-500 hover:text-slate-700">
                  <Bell size={18} />
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                <div className="flex items-center gap-2">
                  <img
                    src="/src/assets/esi-logo.png"
                    alt="ESI"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    {teacherName}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="mt-5">
              <h1 className="text-3xl font-bold text-[#2563eb]">
                Bonjour, {teacherName} 
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Gestion de vos projets de fin d'études. Gardez un œil sur
                l'avancement de vos équipes.
              </p>
            </div>

            {/* Search — vrai champ pour pouvoir cliquer et taper */}
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-200/80">
              <span className="text-slate-400 select-none" aria-hidden>
                ⌕
              </span>
              <input
                type="search"
                name="dashboard-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Stat cards */}
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border border-slate-100 border-l-[6px] p-4 shadow-sm transition duration-200 ease-out will-change-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-300/60 ${item.bg} ${item.bar}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.title}
                      </p>
                      <h3 className={`mt-2 text-3xl font-bold ${item.text}`}>
                        {item.value}
                      </h3>
                    </div>
                    <div
                      className={`rounded-full p-2 bg-white shadow-sm ${item.text}`}
                    >
                      {item.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Planning */}
            <div className="mt-8 rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-semibold text-[#1A365D]">
                Mon Planning
              </h3>

              <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
                {/* Calendrier interactif */}
                <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-600">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 hover:bg-slate-100"
                      aria-label="Mois précédent"
                      onClick={() =>
                        setViewDate(new Date(year, monthIndex - 1, 1))
                      }
                    >
                      {"<"}
                    </button>
                    <span className="capitalize">{monthLabel}</span>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 hover:bg-slate-100"
                      aria-label="Mois suivant"
                      onClick={() =>
                        setViewDate(new Date(year, monthIndex + 1, 1))
                      }
                    >
                      {">"}
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm text-slate-600">
                    {monthCells.map((day, index) => {
                      if (day === null) {
                        return <div key={`e-${index}`} className="h-8" />;
                      }
                      const cellDate = new Date(year, monthIndex, day);
                      const isSelected = sameDay(cellDate, selectedDate);
                      return (
                        <button
                          key={`${year}-${monthIndex}-${day}`}
                          type="button"
                          onClick={() => {
                            setSelectedDate(cellDate);
                            if (showPlanningForm) {
                              setFormDate(toDateInputValue(cellDate));
                            }
                          }}
                          className={`flex h-8 w-full items-center justify-center rounded-full transition-colors ${
                            isSelected
                              ? "bg-blue-600 font-semibold text-white"
                              : "hover:bg-slate-100"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Liste dynamique + ajout */}
                <div className="flex min-h-0 flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      Planifiez des rappels pour vos groupes (réunions, livrables,
                      etc.).
                    </p>
                    <button
                      type="button"
                      onClick={openPlanningForm}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1677ff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0958d9]"
                    >
                      <PlusCircle size={18} />
                      Ajouter planning
                    </button>
                  </div>

                  {showPlanningForm && (
                    <form
                      onSubmit={handleValidatePlanning}
                      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
                    >
                      <p className="mb-3 text-sm font-medium text-[#1A365D]">
                        {editingId ? "Modifier le créneau" : "Nouveau créneau"}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Intitulé
                          </label>
                          <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Ex. Réunion groupe — sujet X"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1677ff]"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Date (calendrier à gauche ou saisie)
                          </label>
                          <input
                            type="date"
                            value={formDate}
                            onChange={(e) => {
                              setFormDate(e.target.value);
                              const d = parseDateInput(e.target.value);
                              setSelectedDate(d);
                              setViewDate(
                                new Date(d.getFullYear(), d.getMonth(), 1),
                              );
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1677ff]"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Heure
                          </label>
                          <input
                            type="time"
                            value={formTime}
                            onChange={(e) => setFormTime(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1677ff]"
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className="rounded-xl bg-[#1A365D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163b73]"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={closePlanningForm}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="max-h-[min(420px,60vh)] space-y-3 overflow-y-auto pr-1">
                    {sortedPlanning.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
                        Aucun planning pour l’instant. Cliquez sur « Ajouter
                        planning » pour en créer un.
                      </p>
                    ) : (
                      sortedPlanning.map((event, index) => {
                        const accent =
                          PLANNING_CARD_ACCENTS[index % PLANNING_CARD_ACCENTS.length];
                        return (
                          <div
                            key={event.id}
                            className={`flex items-center gap-3 rounded-2xl border border-slate-100 border-l-[6px] p-4 pl-3 shadow-sm transition duration-200 ease-out will-change-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/50 sm:gap-4 ${accent.bar} ${accent.bg}`}
                          >
                            <div
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${accent.dayCircle}`}
                            >
                              {event.date.getDate()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-sm font-semibold leading-snug sm:text-base ${accent.title}`}
                              >
                                {event.title}
                              </h4>
                              <p className="mt-0.5 text-sm text-slate-600">
                                {event.date.toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                · {event.time}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                aria-label="Modifier ce planning"
                                onClick={() => openEditPlanning(event)}
                                className="rounded-full p-2 text-slate-500 transition hover:bg-white/80 hover:text-[#1677ff]"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                type="button"
                                aria-label="Supprimer ce planning"
                                onClick={() => handleDeletePlanning(event.id)}
                                className="rounded-full p-2 text-slate-500 transition hover:bg-white/80 hover:text-red-600"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
               {/* Analytics Section */}
<div className="mt-8">
  <div className="grid gap-6 xl:grid-cols-2">

    {/* Statut des Projets */}
    <div className="rounded-[28px] bg-white p-6 shadow-sm h-full">
      <h3 className="text-[22px] font-semibold text-slate-800">
        Statut des Projets
      </h3>

      <div className="relative mt-6 flex justify-center">
        <div className="relative h-[210px] w-[240px]">
          <svg viewBox="0 0 240 160" className="h-full w-full">
            <path
              d={describeArc(120, 120, 86, 180, 360)}
              fill="none"
              stroke="#ece9ff"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              d={progressArc}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="22"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <p className="text-sm font-medium text-slate-400">
              Progression:
            </p>
            <p className="text-4xl font-bold text-slate-800">
              {globalProgress}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <p className="text-sm text-slate-500">Cadrage</p>
          <p className="text-lg font-semibold text-violet-500">
            {analytics.projectStages.cadrage}%
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Conception</p>
          <p className="text-lg font-semibold text-violet-500">
            {analytics.projectStages.conception}%
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Réalisation</p>
          <p className="text-lg font-semibold text-violet-500">
            {analytics.projectStages.realisation}%
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Rédaction</p>
          <p className="text-lg font-semibold text-violet-500">
            {analytics.projectStages.redaction}%
          </p>
        </div>
      </div>
    </div>

    {/* Performance des Équipes */}
    <div className="rounded-[28px] bg-white p-6 shadow-sm h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[22px] font-semibold text-slate-800">
            Performance des Équipes
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Tâches complétées par groupe
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Total:</p>
          <p className="text-2xl font-bold text-sky-500">
            {analytics.totalTeams} Équipes
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {teamPerformanceData.map((team) => (
          <div key={team.id} className="flex items-center gap-3">
            <span className="w-10 text-sm font-medium text-slate-500">
              {team.percent}%
            </span>

            <div className="h-10 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="flex h-full items-center rounded-full bg-gradient-to-r from-sky-400 to-blue-500 px-4 text-sm font-medium text-white transition-all"
                style={{ width: `${team.percent}%` }}
              >
                <span className="truncate">{team.name}</span>
              </div>
            </div>

            <span className="w-10 text-right text-sm font-medium text-slate-500">
              {team.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>

  </div>
</div>
          </div>
        </section>
      </div>
    </main>
  );
}