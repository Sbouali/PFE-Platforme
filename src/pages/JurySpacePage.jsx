import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import profileImg from "../assets/logop.png";


const specialtyOptions = ["Tous", "IASD", "CYS", "SIW", "ISI"];

const mockAssignedDefenses = [
  {
    id: 1,
    date: "2026-06-15",
    time: "09:00",
    room: "Salle 04",
    groupCode: "G01",
    groupMembers: ["Ahmed", "Sara", "Yacine"],
    subjectTitle: "Système de détection de Malware",
    specialty: "SIW",
    supervisors: ["Pr. Mimoun Malki", "Pr. Bensaber Djamel"],
    juryRole: "Président",
    chatId: "chat-group-g01",
  },
  {
    id: 2,
    date: "2026-06-15",
    time: "09:00",
    room: "Salle 04",
    groupCode: "G02",
    groupMembers: ["Lina", "Ikram", "Nabil"],
    subjectTitle: "Audit de Sécurité Cloud",
    specialty: "IASD",
    supervisors: ["Pr. Mimoun Malki", "Pr. Bensaber Djamel"],
    juryRole: "Examinateur",
    chatId: "chat-group-g02",
  },
  {
    id: 3,
    date: "2026-06-15",
    time: "09:00",
    room: "Salle 04",
    groupCode: "G03",
    groupMembers: ["Meriem", "Amine", "Sofiane"],
    subjectTitle: "Optimisation du Réseau IoT",
    specialty: "ISI",
    supervisors: ["Pr. Mimoun Malki", "Pr. Bensaber Djamel"],
    juryRole: "Président",
    chatId: "chat-group-g03",
  },
];

const specialtyBadgeColors = {
  IASD: "bg-purple-100 text-purple-700",
  CYS: "bg-red-100 text-red-700",
  SIW: "bg-blue-100 text-blue-700",
  ISI: "bg-green-100 text-green-700",
};

const roleBadgeColors = {
  Président: "bg-blue-100 text-blue-700",
  Examinateur: "bg-purple-100 text-purple-700",
  Rapporteur: "bg-amber-100 text-amber-700",
};

export default function JurySpacePage() {
  const navigate = useNavigate();

  // BACKEND LATER:
  // récupérer le prof connecté depuis auth/session/token
  const [teacherInfo] = useState({
    fullName: "Pr. Mimoun Malki",
    profileImage: profileImg,
  });

  // état principal
  const [assignedDefenses, setAssignedDefenses] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  // préparation backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // filtres avancés
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    date: "",
    groupCode: "",
    memberName: "",
    subject: "",
    specialty: "",
    supervisor: "",
  });

  async function fetchAssignedDefenses() {
    try {
      setIsLoading(true);
      setError("");

      // BACKEND LATER:
      // ici tu feras un GET vers l'API des soutenances affectées au jury
      // exemple:
      // const res = await fetch("http://localhost:5000/api/jury/assigned-defenses");
      // const data = await res.json();
      // setAssignedDefenses(data);

      // MOCK TEMPORAIRE:
      // au début de l’année, l’admin n’a encore rien affecté
      // laisse [] pour voir l’état vide
      // setAssignedDefenses([]);

      // EXEMPLE STATIQUE POUR TEST UI:
      setAssignedDefenses(mockAssignedDefenses);
    } catch (err) {
      setError("Impossible de charger les soutenances affectées.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignedDefenses();
  }, []);

  const filteredDefenses = useMemo(() => {
    return assignedDefenses.filter((item) => {
      const globalSearch = searchQuery.toLowerCase().trim();

      const matchesGlobalSearch =
        !globalSearch ||
        item.subjectTitle.toLowerCase().includes(globalSearch) ||
        item.groupCode.toLowerCase().includes(globalSearch) ||
        item.specialty.toLowerCase().includes(globalSearch) ||
        item.room.toLowerCase().includes(globalSearch) ||
        item.groupMembers.some((member) =>
          member.toLowerCase().includes(globalSearch),
        ) ||
        item.supervisors.some((sup) =>
          sup.toLowerCase().includes(globalSearch),
        );

      const matchesSpecialty =
        selectedSpecialty === "Tous" || item.specialty === selectedSpecialty;

      const matchesDate =
        !advancedFilters.date || item.date === advancedFilters.date;

      const matchesGroup =
        !advancedFilters.groupCode ||
        item.groupCode
          .toLowerCase()
          .includes(advancedFilters.groupCode.toLowerCase());

      const matchesMember =
        !advancedFilters.memberName ||
        item.groupMembers.some((member) =>
          member
            .toLowerCase()
            .includes(advancedFilters.memberName.toLowerCase()),
        );

      const matchesSubject =
        !advancedFilters.subject ||
        item.subjectTitle
          .toLowerCase()
          .includes(advancedFilters.subject.toLowerCase());

      const matchesAdvancedSpecialty =
        !advancedFilters.specialty ||
        item.specialty
          .toLowerCase()
          .includes(advancedFilters.specialty.toLowerCase());

      const matchesSupervisor =
        !advancedFilters.supervisor ||
        item.supervisors.some((sup) =>
          sup.toLowerCase().includes(advancedFilters.supervisor.toLowerCase()),
        );

      return (
        matchesGlobalSearch &&
        matchesSpecialty &&
        matchesDate &&
        matchesGroup &&
        matchesMember &&
        matchesSubject &&
        matchesAdvancedSpecialty &&
        matchesSupervisor
      );
    });
  }, [assignedDefenses, searchQuery, selectedSpecialty, advancedFilters]);

  function handleAdvancedFilterChange(e) {
    const { name, value } = e.target;
    setAdvancedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetAdvancedFilters() {
    setAdvancedFilters({
      date: "",
      groupCode: "",
      memberName: "",
      subject: "",
      specialty: "",
      supervisor: "",
    });
  }

  function handleOpenGroupChat(defense) {
    // CHAT LATER:
    // ici le backend devra donner soit:
    // - chatId
    // - ou route du chat du groupe
    // exemple:
    // navigate(`/messages/${defense.chatId}`);

    navigate("/messages");
  }

  function handleViewDetails(defense) {
    // BACKEND LATER:
    // page détails soutenance / groupe / notes / PV
    // navigate(`/jury-space/${defense.id}`);
    console.log("Voir détails soutenance:", defense.id);
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1 p-4 sm:p-6">
          <div className="rounded-[24px] bg-white p-4 shadow-sm sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#1A365D]">
                Espace Jury
              </h1>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative text-slate-500 transition hover:text-slate-700"
                >
                  <MessageCircle size={18} />
                  {/* NOTIFICATION LATER:
                      nombre de messages non lus */}
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                <button
                  type="button"
                  className="relative text-slate-500 transition hover:text-slate-700"
                >
                  <Bell size={18} />
                  {/* NOTIFICATION LATER:
                      notif admin : vous avez été affecté comme jury */}
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                <span className="text-xs font-semibold text-slate-700">
                  {teacherInfo.fullName}
                </span>

                <img
                  src={teacherInfo.profileImage}
                  alt="Profil"
                  className="h-8 w-8 rounded-full object-cover"
                />
              </div>
            </div>

            {/* Search advanced */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <Search size={18} className="text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un projet, sujet, groupe..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                 type="button"
                 onClick={() => setShowFilters((prev) => !prev)}
                >
                 <SlidersHorizontal size={18} className="text-slate-400" />
                </button>
              </div>
               {showFilters && (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input
                  type="date"
                  name="date"
                  value={advancedFilters.date}
                  onChange={handleAdvancedFilterChange}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                />

                <input
                  type="text"
                  name="groupCode"
                  value={advancedFilters.groupCode}
                  onChange={handleAdvancedFilterChange}
                  placeholder="Nom du groupe"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                />

                <input
                  type="text"
                  name="memberName"
                  value={advancedFilters.memberName}
                  onChange={handleAdvancedFilterChange}
                  placeholder="Nom d'un membre"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                />

                <input
                  type="text"
                  name="subject"
                  value={advancedFilters.subject}
                  onChange={handleAdvancedFilterChange}
                  placeholder="Sujet"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                />

                <input
                  type="text"
                  name="specialty"
                  value={advancedFilters.specialty}
                  onChange={handleAdvancedFilterChange}
                  placeholder="Spécialité"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                />

                <input
                  type="text"
                  name="supervisor"
                  value={advancedFilters.supervisor}
                  onChange={handleAdvancedFilterChange}
                  placeholder="Encadreur"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                />
              </div>
                )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetAdvancedFilters}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>

            {/* Title + specialty filters */}
            <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h2 className="text-2xl font-bold text-[#1A365D]">
                Planning des Soutenances
              </h2>

              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedSpecialty(option)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                      selectedSpecialty === option
                        ? "bg-[#1A365D] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content */}
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                  Chargement des soutenances affectées...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-12 text-center text-sm text-red-500">
                  {error}
                </div>
              ) : filteredDefenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <h3 className="text-lg font-semibold text-slate-700">
                    Aucune soutenance affectée pour le moment
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Quand l’admin vous affectera comme jury avec une date et une
                    salle, vos groupes apparaîtront ici.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Une notification vous sera envoyée plus tard via le backend.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                        <th className="rounded-l-xl px-4 py-3">Date & Salle</th>
                        <th className="px-4 py-3">Équipe</th>
                        <th className="px-4 py-3">Sujet PFE</th>
                        <th className="px-4 py-3">Spécialité</th>
                        <th className="px-4 py-3">Encadreur(s)</th>
                        <th className="px-4 py-3">Mon rôle</th>
                        <th className="rounded-r-xl px-4 py-3">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDefenses.map((item) => (
                        <tr
                          key={item.id}
                          className="border border-slate-200 bg-white shadow-sm"
                        >
                          <td className="rounded-l-xl px-4 py-4 align-top text-sm text-slate-700">
                            <p className="font-semibold">
                              {new Date(item.date).toLocaleDateString("fr-FR")}{" "}
                              - {item.time}
                            </p>
                            <p className="text-xs text-slate-500">{item.room}</p>
                          </td>

                          <td className="px-4 py-4 align-top text-sm text-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {item.groupMembers.slice(0, 3).map((member) => (
                                  <div
                                    key={member}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-700"
                                  >
                                    {member.slice(0, 2).toUpperCase()}
                                  </div>
                                ))}
                              </div>

                              <div>
                                <p className="font-semibold">{item.groupCode}</p>
                                <p className="text-xs text-slate-500">
                                  {item.groupMembers.join(", ")}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top text-sm font-medium text-slate-800">
                            {item.subjectTitle}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                specialtyBadgeColors[item.specialty] ||
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.specialty}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top text-sm text-slate-600">
                            {item.supervisors.map((sup) => (
                              <p key={sup}>{sup}</p>
                            ))}
                          </td>

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                roleBadgeColors[item.juryRole] ||
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.juryRole}
                            </span>
                          </td>

                          <td className="rounded-r-xl px-4 py-4 align-top">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(item)}
                                className="rounded-lg bg-[#1A365D] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#16315a]"
                              >
                                Détails
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenGroupChat(item)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Message
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}