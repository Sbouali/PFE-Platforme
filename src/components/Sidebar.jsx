import {
  LayoutGrid,
  FolderOpen,
  PlusCircle,
  BookOpen,
  ClipboardList,
  MessageCircle,
  User,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";
import { NavLink,useNavigate } from "react-router-dom";

import pLogo from "../assets/logop.png";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="hidden min-h-screen w-[220px] shrink-0 flex-col border-r border-white/10 bg-[#163b73] text-white lg:flex">
      {/* Logo */}
      <div className="flex shrink-0 justify-center px-4 py-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl">
          <img
            src={pLogo}
            alt="PFE Logo"
            className="h-full w-full max-h-20 object-contain"
          />
        </div>
      </div>

      {/* Menu : pas de scroll interne — si beaucoup d’items, c’est la page qui défile (molette normale) */}
      <nav className="flex min-h-0 flex-1 flex-col justify-between px-3 pb-4 pt-2">
        <div className="space-y-1.5">
          <SidebarItem icon={<LayoutGrid size={18} />} label="Accueil" active />
          <SidebarItem icon={<FolderOpen size={18} />} label="Sujets" />
          <SidebarItem icon={<PlusCircle size={18} />} label="Créer équipe" />
          <SidebarItem icon={<BookOpen size={18} />} label="Livrables" />
          <SidebarItem icon={<ClipboardList size={18} />} label="Évaluations" />
          <SidebarItem icon={<MessageCircle size={18} />} label="Messages" dot />
          <SidebarItem icon={<User size={18} />} label="Profil" />
        </div>

        <div className="space-y-1.5 border-t border-white/15 pt-4">
          <SidebarItem icon={<Settings size={18} />} label="Paramètres" />
          <SidebarItem icon={<CircleHelp size={18} />} label="Support" />
          <SidebarItem
            icon={<LogOut size={18} />}
            label="Déconnexion"
            onClick={() => navigate("/", { replace: true })}
          />
        </div>
      </nav>
    </aside>
  );
}

function SidebarItem({ icon, label, active = false, dot = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active
          ? "bg-white font-semibold text-[#163b73] shadow-sm"
          : "text-white/90 hover:bg-white/10"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {dot && <span className="h-2 w-2 shrink-0 rounded-full bg-white" />}
    </button>
  );
}
