import React, { useState } from "react";
import { api } from "../lib/api.js";
import { UserProfile, UserRole } from "../types.js";
import { UziLinkLogo } from "./UziLinkLogo.js";
import { 
  Mail, Lock, User as UserIcon, Building, MapPin, Eye, EyeOff, 
  X, ArrowRight, Check, Recycle, Factory, ShieldCheck, Shirt, Sparkles 
} from "lucide-react";

interface AuthCardProps {
  onSuccess: (user: UserProfile) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  initialMode?: "login" | "signup";
  initialRole?: UserRole;
  onClose?: () => void;
  isModal?: boolean;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onSuccess,
  showToast,
  initialMode = "login",
  initialRole = "SELLER",
  onClose,
  isModal = false
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [location, setLocation] = useState("Nairobi, Kenya");

  const [validationError, setValidationError] = useState<string | null>(null);

  const roleDefinitions: { role: UserRole; title: string; desc: string; icon: React.ReactNode; defaultOrg: string }[] = [
    {
      role: "SELLER",
      title: "Waste Seller / Trader",
      desc: "Upload textile scraps, set prices, and sell to verified recyclers",
      icon: <Shirt className="w-5 h-5 text-emerald-600" />,
      defaultOrg: "Gikomba Textile Traders"
    },
    {
      role: "RECYCLER",
      title: "Recycling Processor",
      desc: "Source scrap materials, submit procurement offers, and track recycling",
      icon: <Recycle className="w-5 h-5 text-teal-600" />,
      defaultOrg: "Green Loop Fiber Recyclers"
    },
    {
      role: "MANUFACTURER",
      title: "Manufacturer / Mill",
      desc: "Source secondary textile inputs for industrial production and weaving",
      icon: <Factory className="w-5 h-5 text-sky-600" />,
      defaultOrg: "Rivatex Textile Millers"
    },
    {
      role: "EPR",
      title: "EPR Regulator",
      desc: "Monitor compliance, material flows, and national diversion metrics",
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      defaultOrg: "Kenya Extended Producer Responsibility Org (KEPRO)"
    }
  ];

  const handleSelectRole = (r: UserRole) => {
    setSelectedRole(r);
    const def = roleDefinitions.find((d) => d.role === r);
    if (def && !organizationName) {
      setOrganizationName(def.defaultOrg);
    }
  };

  // Quick Demo Account autofill
  const fillDemoAccount = (role: UserRole) => {
    handleSelectRole(role);
    if (role === "SELLER") {
      setEmail("seller@uzilink.com");
      setPassword("seller123");
      setName("David Mitumba Trader");
      setOrganizationName("Gikomba Sorting Syndicate");
      setLocation("Gikomba Market, Nairobi");
    } else if (role === "RECYCLER") {
      setEmail("recycler@uzilink.com");
      setPassword("recycler123");
      setName("Green Loop Fiber Recyclers");
      setOrganizationName("Green Loop Textile Solutions");
      setLocation("Industrial Area, Nairobi");
    } else if (role === "MANUFACTURER") {
      setEmail("manufacturer@uzilink.com");
      setPassword("manufacturer123");
      setName("Rivatex East Africa");
      setOrganizationName("Rivatex Textile Millers");
      setLocation("Eldoret, Kenya");
    } else if (role === "EPR") {
      setEmail("epr@uzilink.com");
      setPassword("epr123");
      setName("Joyce Kamau (KEPRO)");
      setOrganizationName("Kenya Extended Producer Responsibility Org (KEPRO)");
      setLocation("Gigiri, Nairobi");
    }
  };

  const validateInputs = (): boolean => {
    setValidationError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError("Please enter a valid email address (e.g. name@domain.com)");
      return false;
    }

    if (password.length < 6) {
      setValidationError("Password must contain at least 6 characters");
      return false;
    }

    if (!isLogin && !name.trim()) {
      setValidationError("Please provide your name or company contact person");
      return false;
    }

    return true;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setLoadingMessage(isLogin ? "Authenticating your circular role..." : "Registering on the circular network...");

    try {
      if (isLogin) {
        const response = await api.login({
          email: email.trim(),
          password,
          role: selectedRole
        });
        
        showToast(`Welcome back, ${response.user.name}!`, "success");
        onSuccess(response.user);
      } else {
        const response = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
          organizationName: organizationName.trim() || undefined,
          location: location.trim()
        });

        showToast(`Account created as ${selectedRole}!`, "success");
        onSuccess(response.user);
      }
    } catch (err: any) {
      setValidationError(err.message || "Authentication failed. Please check your credentials.");
      showToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-xl bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden ${isModal ? "p-6 sm:p-8" : "p-6"}`}>
      {/* Modal Close */}
      {isModal && onClose && (
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-stone-100">
          <UziLinkLogo size="sm" theme="light" />
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 font-['Poppins',sans-serif]">
          {isLogin ? "Sign In to UziLink" : "Join the Circular Network"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isLogin 
            ? "Select your verified professional role to access your dedicated circular workplace."
            : "Choose your professional capacity to connect with Kenya's textile value chain."
          }
        </p>
      </div>

      {/* Step 3: Role Selector */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
          1. Select Professional Role:
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {roleDefinitions.map((item) => {
            const isSelected = selectedRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => handleSelectRole(item.role)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20"
                    : "border-stone-200 bg-stone-50/50 hover:bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 bg-white rounded-xl shadow-xs border border-stone-200/60">
                    {item.icon}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.title}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fast Demo Switches */}
      <div className="mb-6 p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Demo Autofill:
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoAccount("SELLER")}
            className="text-[11px] py-1.5 px-2 bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-xl text-slate-700 font-medium transition cursor-pointer"
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("RECYCLER")}
            className="text-[11px] py-1.5 px-2 bg-white hover:bg-teal-50 border border-stone-200 hover:border-teal-300 rounded-xl text-slate-700 font-medium transition cursor-pointer"
          >
            Recycler
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("MANUFACTURER")}
            className="text-[11px] py-1.5 px-2 bg-white hover:bg-sky-50 border border-stone-200 hover:border-sky-300 rounded-xl text-slate-700 font-medium transition cursor-pointer"
          >
            Manufacturer
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("EPR")}
            className="text-[11px] py-1.5 px-2 bg-white hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl text-slate-700 font-medium transition cursor-pointer"
          >
            Regulator
          </button>
        </div>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleAuthSubmit} className="space-y-4">
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {validationError}
          </div>
        )}

        {!isLogin && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Name / Contact Person</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Mwangi"
                  className="w-full bg-white border border-stone-300 text-xs pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Organization / Enterprise</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Gikomba Traders"
                    className="w-full bg-white border border-stone-300 text-xs pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Location in Kenya</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi, Gikomba"
                    className="w-full bg-white border border-stone-300 text-xs pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. seller@uzilink.com"
              className="w-full bg-white border border-stone-300 text-xs pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700">Password</label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-white border border-stone-300 text-xs pl-10 pr-10 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-['Poppins',sans-serif] disabled:opacity-50"
        >
          {loading ? (
            <span>{loadingMessage}</span>
          ) : (
            <>
              <span>{isLogin ? `Access ${selectedRole} Workspace` : `Register as ${selectedRole}`}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Mode toggle */}
      <div className="mt-5 text-center text-xs text-slate-500">
        {isLogin ? (
          <>
            Don't have an account yet?{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setValidationError(null);
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setValidationError(null);
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Log In
            </button>
          </>
        )}
      </div>
    </div>
  );
};
