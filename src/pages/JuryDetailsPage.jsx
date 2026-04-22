import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import profileImg from "../assets/logop.png";
import { useNavigate } from "react-router-dom";

export default function JuryDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // BACKEND LATER:
  // ces infos viendront du login/session/token
  const [teacherInfo] = useState({
    fullName: "Pr. Mimoun Malki",
    profileImage: profileImg,
  });

  // CADRE 1 : données venant du backend
  const [defenseData, setDefenseData] = useState(null);

  // CADRE 2 : notes saisies par le jury
  const [gradingForm, setGradingForm] = useState({
    contenuScientifique: "",
    implementation: "",
    presentationOrale: "",
    reponsesQuestions: "",
  });

  // CADRE 3 : réservé pour plus tard
  const [secondPvText, setSecondPvText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchDefenseDetails() {
    try {
      setIsLoading(true);
      setError("");

      // BACKEND LATER:
      // GET /api/jury/defense/:id
      // exemple:
      // const res = await fetch(`http://localhost:5000/api/jury/defense/${id}`);
      // const data = await res.json();
      // setDefenseData(data);

      // MOCK TEMPORAIRE POUR VOIR L'UI
      setDefenseData({
        id,
        groupCode: "G01",
        students: [
          "BOUALI Sirine",
          "Fatima Zahra",
          "Omar Belkaci",
          "Omar Belaid",
        ],
        subjectTitle: "Système de détection de Malware",
        subjectArabic: "عنوان المذكرة: نظام كشف البرمجيات الخبيثة",
        specialty: "SIW",
        juryMembers: [
          { name: "Pr. Mimoun Malki", role: "Président", isMe: true },
          { name: "Dr. S. Benali", role: "Examinateur", isMe: false },
          { name: "Pr. A. Mansouri", role: "Encadreur", isMe: false },
        ],
      });

      // MOCK NOTES TEMPORAIRE
      setGradingForm({
        contenuScientifique: "16",
        implementation: "18",
        presentationOrale: "17.5",
        reponsesQuestions: "15",
      });
    } catch (err) {
      setError("Impossible de charger les détails de la soutenance.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDefenseDetails();
  }, [id]);

  function handleGradeChange(e) {
    const { name, value } = e.target;
    setGradingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const juryAverage = useMemo(() => {
    const values = Object.values(gradingForm)
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value));

    if (!values.length) return "0.00";

    const total = values.reduce((sum, value) => sum + value, 0);
    return (total / values.length).toFixed(2);
  }, [gradingForm]);

  function handleSaveGrades() {
    // BACKEND LATER:
    // POST /api/jury/grades/save
    // envoyer gradingForm + id soutenance
    console.log("Enregistrer les notes :", { id, gradingForm });
  }

  function handleGeneratePv() {
    // DOCX LATER:
    // ici on utilisera:
    // - les données backend (defenseData)
    // - les notes saisies (gradingForm)
    // pour injecter dans un fichier Word template
    console.log("Générer le PV Word :", {
      defenseData,
      gradingForm,
      juryAverage,
    });
  }

  function handleSaveSecondPv() {
    // BACKEND / DOCX LATER:
    // ce bloc est réservé pour le 2eme PV
    console.log("Deuxième PV :", secondPvText);
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1 p-4 sm:p-6">
          <div className="rounded-[24px] bg-white p-4 shadow-sm sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
               <span
               onClick={() => navigate("/jury-space")}
               className="cursor-pointer hover:underline hover:text-[#1A365D]"
                >
                Espace Jury
               </span>{" "}
               &gt;{" "}
                <span className="font-semibold text-[#1A365D]">
                  Saisie des Notes et PV
               </span>
             </p>
              </div>

              <div className="flex items-center gap-3">
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

            <div className="mt-8">
              <h2 className="text-3xl font-bold text-[#1A365D]">
                Saisie des Notes et PV
              </h2>
            </div>

            {isLoading ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                Chargement des détails de la soutenance...
              </div>
            ) : error ? (
              <div className="mt-8 rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-12 text-center text-sm text-red-500">
                {error}
              </div>
            ) : !defenseData ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                Aucune donnée disponible.
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-6 xl:grid-cols-3">
                  {/* CADRE 1 */}
                  <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <div className="rounded-xl bg-slate-100 px-4 py-3">
                      <h3 className="text-lg font-bold text-slate-700">
                        Contexte de la Soutenance
                      </h3>
                    </div>

                    <div className="mt-5">
                      <h4 className="text-xl font-bold text-[#1A365D]">
                        Étudiantes
                      </h4>

                      <div className="mt-4 flex items-start gap-4">
                        <div className="flex -space-x-2">
                          {defenseData.students.slice(0, 4).map((student) => (
                            <div
                              key={student}
                              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-700"
                            >
                              {student.slice(0, 2).toUpperCase()}
                            </div>
                          ))}
                        </div>

                        <div className="flex-1">
                          {defenseData.students.map((student) => (
                            <p
                              key={student}
                              className="text-sm leading-6 text-slate-600"
                            >
                              {student}
                            </p>
                          ))}
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Groupe {defenseData.groupCode}
                        </span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="text-xl font-bold text-[#1A365D]">
                        Sujet PFE
                      </h4>
                      <p className="mt-4 text-base font-semibold text-slate-800">
                        {defenseData.subjectTitle}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {defenseData.subjectArabic}
                      </p>
                    </div>

                    <div className="mt-8">
                      <h4 className="text-xl font-bold text-[#1A365D]">
                        Jury
                      </h4>

                      <div className="mt-4 space-y-4">
                        {defenseData.juryMembers.map((member) => (
                          <div
                            key={`${member.name}-${member.role}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                                {member.name.slice(0, 2).toUpperCase()}
                              </div>

                              <div>
                                <p className="text-xs text-slate-400">
                                  {member.role}
                                </p>
                                <p className="font-semibold text-slate-700">
                                  {member.name}
                                </p>
                              </div>
                            </div>

                            {member.isMe && (
                              <span className="rounded-lg bg-[#1A365D] px-3 py-1 text-xs font-semibold text-white">
                                MON RÔLE
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CADRE 2 */}
                  <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <div className="rounded-xl bg-slate-100 px-4 py-3">
                      <h3 className="text-lg font-bold text-slate-700">
                        GRILLE DE NOTATION (sur 20)
                      </h3>
                    </div>

                    <div className="mt-6 space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          Contenu Scientifique (Coeff 2)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          name="contenuScientifique"
                          value={gradingForm.contenuScientifique}
                          onChange={handleGradeChange}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1A365D]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          Implémentation (Coeff 2)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          name="implementation"
                          value={gradingForm.implementation}
                          onChange={handleGradeChange}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1A365D]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          Exposé Oral (Coeff 1)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          name="presentationOrale"
                          value={gradingForm.presentationOrale}
                          onChange={handleGradeChange}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1A365D]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          Réponses aux questions (Coeff 1)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          name="reponsesQuestions"
                          value={gradingForm.reponsesQuestions}
                          onChange={handleGradeChange}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1A365D]"
                        />
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="text-xl font-bold text-[#1A365D]">
                        Moyenne du Jury
                      </h4>
                      <input
                        type="text"
                        value={`${juryAverage}/20`}
                        readOnly
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                      />
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveGrades}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Enregistrer les notes
                      </button>

                      <button
                        type="button"
                        onClick={handleGeneratePv}
                        className="rounded-xl bg-[#1A365D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#16315a]"
                      >
                        Générer le PV
                      </button>
                    </div>
                  </div>

                  {/* CADRE 3 */}
                  <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <div className="rounded-xl bg-slate-100 px-4 py-3">
                      <h3 className="text-lg font-bold text-slate-700">
                        APPRÉCIATIONS & RAPPORT
                      </h3>
                    </div>

                    <div className="mt-6">
                      <label className="mb-3 block text-xl font-bold text-[#1A365D]">
                        OBSERVATIONS & SYNTHÈSE
                      </label>
                      <textarea
                        value={secondPvText}
                        onChange={(e) => setSecondPvText(e.target.value)}
                        rows="10"
                        placeholder="Rédigez ici le rapport final sur la qualité du travail, la méthodologie et les résultats obtenus..."
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1A365D]"
                      />
                    </div>

                    <div className="mt-8">
                      <label className="mb-2 block text-xl font-bold text-[#1A365D]">
                        MENTION
                      </label>
                      <select className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1A365D]">
                        <option>Excellent</option>
                        <option>Très bien</option>
                        <option>Bien</option>
                        <option>Passable</option>
                      </select>
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleSaveSecondPv}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Enregistrer ce rapport
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}