import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  MessageCircle,
  Search,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import profileImg from "../assets/logop.png";

const specialtyOptions = ["Tous", "IASD", "CYS", "SIW", "ISI"];

const specialtyBadgeColors = {
  IASD: "bg-purple-100 text-purple-700",
  CYS: "bg-red-100 text-red-700",
  SIW: "bg-blue-100 text-blue-700",
  ISI: "bg-green-100 text-green-700",
};

const livrableStatusColors = {
  Déposé: "text-blue-600",
  Validé: "text-green-600",
  "Non déposé": "text-red-500",
};

const mockSupervisions = [
  {
    id: 1,
    groupCode: "G01",
    members: ["Ahmed", "Sara", "Yacine"],
    subjectTitle: "Système de détection de Malware",
    specialty: "IASD",
    lastDeliverable: {
      title: "Rapport_1.pdf",
      status: "Déposé",
    },
    coSupervisor: "Pr. Bensaber Djamel",
    chatId: "chat-group-g01",
  },
  {
    id: 2,
    groupCode: "G02",
    members: ["Lina", "Ikram", "Nabil"],
    subjectTitle: "Audit de Sécurité Cloud",
    specialty: "SIW",
    lastDeliverable: {
      title: "Rapport_2.pdf",
      status: "Validé",
    },
    coSupervisor: "Pr. Bensaber Djamel",
    chatId: "chat-group-g02",
  },
  {
    id: 3,
    groupCode: "G03",
    members: ["Meriem", "Amine", "Sofiane"],
    subjectTitle: "Optimisation du Réseau IoT",
    specialty: "CYS",
    lastDeliverable: {
      title: "Rapport_3.pdf",
      status: "Validé",
    },
    coSupervisor: "Pr. Bensaber Djamel",
    chatId: "chat-group-g03",
  },
  {
    id: 4,
    groupCode: "G04",
    members: ["Aya", "Rayane", "Nour"],
    subjectTitle: "Gestion intelligente des livrables",
    specialty: "ISI",
    lastDeliverable: {
      title: "Aucun livrable",
      status: "Non déposé",
    },
    coSupervisor: "Pr. Bensaber Djamel",
    chatId: "chat-group-g04",
  },
];

export default function SupervisionPage() {
  const navigate = useNavigate();

  // BACKEND LATER:
  // ces infos viendront du login/session/token
  const [teacherInfo] = useState({
    fullName: "Pr. Mimoun Malki",
    profileImage: profileImg,
  });

  // données principales
  const [supervisions, setSupervisions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);

  // états backend-ready
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // filtres avancés
  const [advancedFilters, setAdvancedFilters] = useState({
    groupCode: "",
    memberName: "",
    subject: "",
    specialty: "",
    coSupervisor: "",
    livrableStatus: "",
  });

  async function fetchSupervisions() {
    try {
      setIsLoading(true);
      setError("");

      // BACKEND LATER:
      // GET /api/teacher/supervisions
      // exemple:
      // const res = await fetch("http://localhost:5000/api/teacher/supervisions");
      // const data = await res.json();
      // setSupervisions(data);

      // ÉTAT VIDE MÉTIER:
      // au début, si l'admin n'a encore affecté aucun encadrement:
      // setSupervisions([]);

      // EXEMPLE STATIQUE TEMPORAIRE:
      setSupervisions(mockSupervisions);
    } catch (err) {
      setError("Impossible de charger les encadrements.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSupervisions();
  }, []);

  const filteredSupervisions = useMemo(() => {
    return supervisions.filter((item) => {
      const globalSearch = searchQuery.toLowerCase().trim();

      const matchesGlobalSearch =
        !globalSearch ||
        item.groupCode.toLowerCase().includes(globalSearch) ||
        item.subjectTitle.toLowerCase().includes(globalSearch) ||
        item.specialty.toLowerCase().includes(globalSearch) ||
        item.coSupervisor.toLowerCase().includes(globalSearch) ||
        item.members.some((member) =>
          member.toLowerCase().includes(globalSearch),
        ) ||
        item.lastDeliverable.title.toLowerCase().includes(globalSearch) ||
        item.lastDeliverable.status.toLowerCase().includes(globalSearch);

      const matchesSpecialty =
        selectedSpecialty === "Tous" || item.specialty === selectedSpecialty;

      const matchesGroup =
        !advancedFilters.groupCode ||
        item.groupCode
          .toLowerCase()
          .includes(advancedFilters.groupCode.toLowerCase());

      const matchesMember =
        !advancedFilters.memberName ||
        item.members.some((member) =>
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

      const matchesCoSupervisor =
        !advancedFilters.coSupervisor ||
        item.coSupervisor
          .toLowerCase()
          .includes(advancedFilters.coSupervisor.toLowerCase());

      const matchesLivrableStatus =
        !advancedFilters.livrableStatus ||
        item.lastDeliverable.status
          .toLowerCase()
          .includes(advancedFilters.livrableStatus.toLowerCase());

      return (
        matchesGlobalSearch &&
        matchesSpecialty &&
        matchesGroup &&
        matchesMember &&
        matchesSubject &&
        matchesAdvancedSpecialty &&
        matchesCoSupervisor &&
        matchesLivrableStatus
      );
    });
  }, [supervisions, searchQuery, selectedSpecialty, advancedFilters]);

  function handleAdvancedFilterChange(e) {
    const { name, value } = e.target;
    setAdvancedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetAdvancedFilters() {
    setAdvancedFilters({
      groupCode: "",
      memberName: "",
      subject: "",
      specialty: "",
      coSupervisor: "",
      livrableStatus: "",
    });
  }

  function handleOpenGroupChat(item) {
    // CHAT LATER:
    // plus tard:
    // navigate(`/messages/${item.chatId}`);
    navigate("/messages");
  }

  function handleFollowGroup(item) {
    // BACKEND LATER:
    // page détails groupe / avancement / livrables / validations
    // navigate(`/supervision/${item.id}`);
    console.log("Suivre groupe:", item.id);
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
                Encadrement
              </h1>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative text-slate-500 transition hover:text-slate-700"
                >
                  <MessageCircle size={18} />
                  {/* CHAT LATER:
                      messages non lus des groupes encadrés */}
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                <button
                  type="button"
                  className="relative text-slate-500 transition hover:text-slate-700"
                >
                  <Bell size={18} />
                  {/* NOTIFICATION LATER:
                      nouveaux livrables / validation admin / affectation */}
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
                  placeholder="Rechercher un projet, sujet..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="text-slate-400 transition hover:text-slate-600"
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>

              {showFilters ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                    name="coSupervisor"
                    value={advancedFilters.coSupervisor}
                    onChange={handleAdvancedFilterChange}
                    placeholder="Co-encadreur"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                  />

                  <input
                    type="text"
                    name="livrableStatus"
                    value={advancedFilters.livrableStatus}
                    onChange={handleAdvancedFilterChange}
                    placeholder="Statut livrable"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1A365D]"
                  />
                </div>
              ) : null}

              {showFilters ? (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={resetAdvancedFilters}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : null}
            </div>

            {/* Title + specialty filters */}
            <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h2 className="text-2xl font-bold text-[#1A365D]">
                Mes Encadrements
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
                  Chargement des encadrements...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-12 text-center text-sm text-red-500">
                  {error}
                </div>
              ) : filteredSupervisions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <h3 className="text-lg font-semibold text-slate-700">
                    Aucun encadrement affecté pour le moment
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Quand l’admin affectera vos groupes d’encadrement, ils
                    apparaîtront ici.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Les livrables, le chat groupe et le suivi seront reliés au
                    backend plus tard.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                        <th className="rounded-l-xl px-4 py-3">Groupe</th>
                        <th className="px-4 py-3">Membres</th>
                        <th className="px-4 py-3">Sujet PFE</th>
                        <th className="px-4 py-3">Spécialité</th>
                        <th className="px-4 py-3">Dernier Livrable</th>
                        <th className="px-4 py-3">Co-Encadreur</th>
                        <th className="rounded-r-xl px-4 py-3">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSupervisions.map((item) => (
                        <tr
                          key={item.id}
                          className="border border-slate-200 bg-white shadow-sm"
                        >
                          <td className="rounded-l-xl px-4 py-4 align-top text-sm font-semibold text-slate-800">
                            {item.groupCode}
                          </td>

                          <td className="px-4 py-4 align-top text-sm text-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {item.members.slice(0, 3).map((member) => (
                                  <div
                                    key={member}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-700"
                                  >
                                    {member.slice(0, 2).toUpperCase()}
                                  </div>
                                ))}
                              </div>

                              <p className="text-xs text-slate-500">
                                {item.members.join(", ")}
                              </p>
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
                            <div className="flex items-start gap-2">
                              <FileText size={16} className="mt-0.5 text-slate-400" />
                              <div>
                                <p className="font-medium">
                                  {item.lastDeliverable.title}
                                </p>
                                <p
                                  className={`text-xs font-semibold ${
                                    livrableStatusColors[item.lastDeliverable.status] ||
                                    "text-slate-500"
                                  }`}
                                >
                                  {item.lastDeliverable.status}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top text-sm text-slate-600">
                            {item.coSupervisor}
                          </td>

                          <td className="rounded-r-xl px-4 py-4 align-top">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => handleFollowGroup(item)}
                                className="rounded-lg bg-[#1A365D] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#16315a]"
                              >
                                Suivre
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