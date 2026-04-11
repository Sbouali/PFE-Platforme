import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Star, Pencil, X , Upload} from "lucide-react";
import Sidebar from "../components/Sidebar";



const specialtyOptions = ["Tous", "IASD", "CYS", "SIW", "ISI"];

const badgeColors = {
  IASD: "bg-purple-100 text-purple-700",
  CYS: "bg-red-100 text-red-700",
  SIW: "bg-blue-100 text-blue-700",
  ISI: "bg-green-100 text-green-700",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Tous");
  const [formData, setFormData] = useState({
  title: "",
  specialty: "ISI",
  description: "",
  pdfFile: null,
});

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch =
        subject.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty =
        selectedSpecialty === "Tous" ||
        subject.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [subjects, searchQuery, selectedSpecialty]);
        async function fetchSubjects() {
         try {
               setIsLoading(true);
              setError("");

             // BACKEND LATER:
             // const res = await fetch("http://localhost:5000/api/subjects");
             // const data = await res.json();
             // setSubjects(data);

             setSubjects([]);
            } catch (err) {
           setError("Impossible de charger les sujets.");
           } finally {
           setIsLoading(false);
           }
        }  
        useEffect(() => {
        fetchSubjects();
        }, []);
        
        function openCreateModal() {
         setEditingId(null);
          setFormData({
          title: "",
          specialty: "ISI",
          description: "",
          pdfFile: null,
         });
           setShowModal(true);
        }

        function openEditModal(subject) {
          setEditingId(subject.id);
          setFormData({
          title: subject.title,
          specialty: subject.specialty,
          description: subject.description,
          pdfFile: subject.pdfFile || null,
          });
         setShowModal(true);
        }

        function closeModal() {
            setShowModal(false);
            setEditingId(null);
        }

        function handleChange(e) {
            const { name, value } = e.target;
            setFormData((prev) => ({
             ...prev,
             [name]: value,
             }));
        }
        function handleFileChange(e) {
            const file = e.target.files?.[0] || null;
            setFormData((prev) => ({
              ...prev,
              pdfFile: file,
            }));
        }

       function handleSubmit(e) {
          e.preventDefault();

           const title = formData.title.trim();
           const description = formData.description.trim();

            if (!title || !description) return;

            if (editingId) {
                // BACKEND LATER:
                // envoyer la modification du sujet au backend avec PUT
              setSubjects((prev) =>
              prev.map((subject) =>
              subject.id === editingId
              ? {
              ...subject,
              title,
              specialty: formData.specialty,
              description,
              pdfFile: formData.pdfFile || subject.pdfFile || null,
               }
               : subject,
               ),
               );
            } else {
            const newSubject = {
            id: crypto.randomUUID(),
            title,
            specialty: formData.specialty,
            status: "En attente",
            description,
            validatedByAdmin: false,
            favorites: 0,
            pdfFile: formData.pdfFile,
            isPublishedToStudents: false,
            };
            // BACKEND LATER:
            // envoyer le nouveau sujet au backend avec POST
            setSubjects((prev) => [newSubject, ...prev]);
            }

           closeModal();
        }

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1 p-4 sm:p-6">
          <div className="rounded-[24px] bg-white p-4 shadow-sm sm:p-6">
            {/* Top */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-800">Sujets PFE</h1>

              <button
               type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
                >
                <Plus size={18} />
                Déposer un sujet
                </button>
            </div>

            {/* Search + filter */}
           <div className="mt-6 space-y-4">
           <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
           <input
             type="search"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Rechercher un sujet..."
             className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <Filter size={18} className="text-slate-400" />
            </div>

             <div className="flex flex-wrap justify-center gap-2">
              {specialtyOptions.map((option) => (
              <button
                 key={option}
                 type="button"
                 onClick={() => setSelectedSpecialty(option)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
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

            {/* Subjects list */}
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                
              {isLoading ? (
               <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Chargement des sujets...
              </div>
              ) : error ? (
              <div className="col-span-full rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-500">
                     {error}
              </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Aucun sujet pour le moment. Dépose ton premier sujet 👇
                </div>
              ) : (
                filteredSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          badgeColors[subject.specialty] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {subject.specialty}
                      </span>

                      <span
                        className={`text-xs font-medium ${
                        subject.validatedByAdmin ? "text-green-600" : "text-amber-500"
                        }`}
                        >
                        {subject.validatedByAdmin ? "Validé" : "En attente"}
                        </span>
                    </div>

                    <h3 className="mt-4 text-base font-bold text-slate-800">
                      {subject.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {subject.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>
                        {subject.validatedByAdmin
                          ? "Validé par l'admin"
                          : "En attente de validation"}
                      </span>

                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={15} fill="currentColor" />
                        <span className="text-xs font-medium text-slate-600">
                          {subject.favorites}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          type="button"
                           onClick={() => openEditModal(subject)}
                           className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                           >
                           <Pencil size={17} />
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
     {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          {editingId ? "Modifier le sujet" : "Déposer un sujet"}
        </h2>

        <button
          type="button"
          onClick={closeModal}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Titre du sujet
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Entrer le titre du sujet"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Spécialité
          </label>
          <select
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
          >
            <option value="IASD">IASD</option>
            <option value="CYS">CYS</option>
            <option value="SIW">SIW</option>
            <option value="ISI">ISI</option>
          </select>
        </div>

        
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            placeholder="Décrire le sujet..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
            required
          />
        </div>
        <div>
           <label className="mb-1 block text-sm font-medium text-slate-600">
             Déposer un fichier PDF
            </label>

           <div className="rounded-xl border border-slate-200 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-fuchsia-700">
              <Upload size={18} />
              <span>Choisir un fichier PDF</span>
              <input
               type="file"
               accept="application/pdf"
               onChange={handleFileChange}
               className="hidden"
                 />
            </label>

            {formData.pdfFile && (
             <p className="mt-2 text-sm text-slate-500">
              Fichier sélectionné : {formData.pdfFile.name || "PDF ajouté"}
             </p>
            )}
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            className="rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-700"
          >
            {editingId ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </main>
  );
}