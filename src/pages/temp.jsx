import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import heroImage from "../assets/esisba.jpg";
import pLogo from "../assets/logop.png";
import esiLogo from "../assets/esilogo.png";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

 const navigate = useNavigate();

const isValidEmail = (email) => {
  const standardEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const esiEmail = /^[a-zA-Z]\.[a-zA-Z]+@esi-sba\.dz$/;

  return standardEmail.test(email) || esiEmail.test(email);
};
const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 const handleLogin = async () => {
  if (!formData.email.trim() || !formData.password.trim()) {
    setError("Veuillez remplir l'email et le mot de passe.");
    return;
  }

  if (!isValidEmail(formData.email)) {
    setError("Email invalide.");
    return;
  }

  try {
    setError("");

    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur de connexion.");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("roles", JSON.stringify(data.roles));
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem(
      "must_change_password",
      JSON.stringify(data.must_change_password)
    );

    if (data.must_change_password) {
      navigate("/change-password");
      return;
    }

    if (data.roles.includes("teacher")) {
      navigate("/dashboard-teacher");
      return;
    }

    setError("Rôle non autorisé pour cette interface.");
  } catch (err) {
    console.error(err);
    setError("Erreur serveur. Vérifiez que le backend est lancé.");
  }
};

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="grid md:grid-cols-2">
          {/* Left Side */}
          <section className="relative hidden md:block">
            <img
              src={heroImage}
              alt="ESI SBA"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-[#1A2F4F] opacity-60" />

            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={pLogo}
                alt="PFE Logo"
                className="w-64 object-contain"
              />
            </div>
          </section>

          {/* Right Side */}
          <section className="flex items-center justify-center bg-white px-6 py-8 sm:px-10">
            <div className="w-full max-w-sm">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                  <img
                    src={esiLogo}
                    alt="ESI Logo"
                    className="h-20 w-20 object-contain mx-auto"
                  />
                </div>

                <h1 className="text-2xl font-bold text-[#1A365D]">PFEHub</h1>
                <p className="mt-2 text-sm text-[#1A365D]">
                  Login to your account
                </p>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Email
                  </label>
                 <input
                   type="email"
                   name="email"
                   value={formData.email}
                   onChange={handleChange}
                   placeholder="Enter your email"
                   className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none transition focus:border-slate-400"
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="font-medium text-slate-500 hover:text-slate-700"
                  >
                    Forgot Password?
                  </button>
                </div>
                {error && (
                 <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                 </p>
                  )}

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full rounded-xl bg-[#1A365D] py-3 text-sm font-semibold text-white transition hover:bg-[#1A2F4F]"
                >
                  Login
                </button>

                
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}