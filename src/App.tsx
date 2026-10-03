import React, { useState, useEffect } from "react";
import { api, getToken, removeToken } from "./lib/api.js";
import { UserProfile, ListingItem, SystemNotification, UserRole } from "./types.js";
import { AuthCard } from "./components/AuthCard.js";
import { LandingPage } from "./components/LandingPage.js";
import { UziLinkLogo } from "./components/UziLinkLogo.js";
import { SellerView } from "./components/SellerView.js";
import { RecyclerDashboard } from "./components/RecyclerDashboard.js";
import { ManufacturerDashboard } from "./components/ManufacturerDashboard.js";
import { EprRegulatorDashboard } from "./components/EprRegulatorDashboard.js";
import { AdminView } from "./components/AdminView.js";
import { InboxView } from "./components/InboxView.js";
import { ToastContainer, ToastMessage } from "./components/Banner.js";
import { 
  LogOut, Shield, ShieldCheck, Mail, Bell, MessageSquare, ShoppingBag, 
  HelpCircle, User as UserIcon, X, ExternalLink, Leaf, Phone,
  Sparkles, ChevronDown, Check, ArrowRight, RefreshCw, Shirt, Recycle, Factory
} from "lucide-react";
import { resolveImageUrl, handleImageFallback } from "./lib/imageMap.js";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Loading UziLink Circular Network...");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotificationList, setShowNotificationList] = useState(false);

  // High-level view mode: "landing" for public marketing showcase, "dashboard" for logged-in circular workplace
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");

  // Role-specific Active Navigation tab
  const [sellerTab, setSellerTab] = useState<"dashboard" | "mylistings" | "create" | "messages" | "transactions" | "profile">("dashboard");
  const [recyclerTab, setRecyclerTab] = useState<"dashboard" | "materials" | "saved" | "requests" | "messages" | "profile">("dashboard");
  const [manufacturerTab, setManufacturerTab] = useState<"dashboard" | "materials" | "saved" | "requests" | "messages" | "profile">("dashboard");
  const [regulatorTab, setRegulatorTab] = useState<"dashboard" | "monitoring" | "listings" | "organizations" | "eprrecords" | "analytics" | "profile">("dashboard");

  // Authentication Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authRole, setAuthRole] = useState<UserRole>("SELLER");

  // Support / Contact modal state (Step 20)
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Guest listing preview modal
  const [selectedGuestListing, setSelectedGuestListing] = useState<ListingItem | null>(null);

  // Preset communication routes for direct chat
  const [partnerIdPreset, setPartnerIdPreset] = useState<string | null>(null);
  const [partnerNamePreset, setPartnerNamePreset] = useState<string | null>(null);
  const [listingIdPreset, setListingIdPreset] = useState<string | null>(null);

  // Toast generator
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleToastClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync listings and notifications
  const pullPlatformData = async () => {
    try {
      const listRes = await api.getListings();
      setListings(listRes.listings || []);
    } catch (e) {
      console.warn("Soft: failed to update listings feed.");
    }

    if (!getToken()) return;

    try {
      const notifRes = await api.getNotifications();
      setNotifications(notifRes.notifications || []);
    } catch (e) {
      console.warn("Soft: failed to update notifications.");
    }
  };

  // Profile handshake on mount
  const checkSession = async () => {
    setLoading(true);
    setLoadingText("Connecting to circular network...");
    await pullPlatformData();

    const token = getToken();
    if (!token) {
      setLoading(false);
      setViewMode("landing");
      return;
    }

    try {
      const response = await api.getProfile();
      setUser(response.user);
      setViewMode("dashboard");
    } catch (err) {
      console.error("Expired session context, clearing authorization token.", err);
      removeToken();
      setViewMode("landing");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleSignout = () => {
    removeToken();
    setUser(null);
    setViewMode("landing");
    showToast("Logged out successfully.", "info");
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    setAuthModalOpen(false);
    setViewMode("dashboard");
    pullPlatformData();
  };

  const handleOpenAuth = (mode: "login" | "signup", role: UserRole = "SELLER") => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  // Quick switch role demo helper to allow immediate testing of all 4 roles
  const handleQuickSwitchRole = async (targetRole: UserRole) => {
    const roleAccounts: Record<UserRole, { email: string; password: string; name: string }> = {
      SELLER: { email: "seller@uzilink.com", password: "seller123", name: "David Mitumba Trader" },
      RECYCLER: { email: "recycler@uzilink.com", password: "recycler123", name: "Green Loop Fiber Recyclers" },
      MANUFACTURER: { email: "manufacturer@uzilink.com", password: "manufacturer123", name: "Rivatex East Africa" },
      EPR: { email: "epr@uzilink.com", password: "epr123", name: "Joyce Kamau (KEPRO)" },
      ADMIN: { email: "admin@uzilink.com", password: "admin123", name: "UziLink System Admin" }
    };

    const target = roleAccounts[targetRole];
    setLoading(true);
    setLoadingText(`Switching to ${targetRole} workspace...`);

    try {
      const res = await api.login({ email: target.email, password: target.password, role: targetRole });
      setUser(res.user);
      setViewMode("dashboard");
      await pullPlatformData();
      showToast(`Switched to ${res.user.role} Dashboard (${res.user.name})`, "success");
    } catch (e) {
      showToast("Failed to switch role", "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerDirectMessagePreset = (partnerId: string, partnerName: string, listingId: string) => {
    setPartnerIdPreset(partnerId);
    setPartnerNamePreset(partnerName);
    setListingIdPreset(listingId);

    // Navigate to role's message tab
    if (user?.role === "SELLER") setSellerTab("messages");
    else if (user?.role === "RECYCLER") setRecyclerTab("messages");
    else if (user?.role === "MANUFACTURER") setManufacturerTab("messages");
  };

  const handleViewGuestListing = (listing: ListingItem) => {
    if (user) {
      setViewMode("dashboard");
      if (user.role === "RECYCLER") setRecyclerTab("materials");
      else if (user.role === "MANUFACTURER") setManufacturerTab("materials");
      else if (user.role === "SELLER") setSellerTab("mylistings");
    } else {
      setSelectedGuestListing(listing);
    }
  };

  // STEP 17: PROFESSIONAL LOADING EXPERIENCE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <UziLinkLogo size="xl" theme="light" animated={true} />
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{loadingText}</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Kenya's B2B circular textile waste & secondary materials marketplace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      <ToastContainer toasts={toasts} onClose={handleToastClose} />

      {/* VIEW MODE: LANDING PAGE */}
      {viewMode === "landing" ? (
        <LandingPage
          user={user}
          listings={listings}
          onOpenAuth={handleOpenAuth}
          onGoToDashboard={() => setViewMode("dashboard")}
          onViewListingDetail={handleViewGuestListing}
        />
      ) : (
        /* VIEW MODE: ROLE-SPECIFIC WORKPLACE DASHBOARD */
        <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
          {/* Top Bar Header */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Brand and Current Role Badge */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode("landing")}
                  className="cursor-pointer"
                  title="View Public Landing Page"
                >
                  <UziLinkLogo size="sm" theme="light" />
                </button>

                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-stone-200">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    user?.role === "SELLER"
                      ? "bg-emerald-100 text-emerald-800"
                      : user?.role === "RECYCLER"
                      ? "bg-teal-100 text-teal-800"
                      : user?.role === "MANUFACTURER"
                      ? "bg-sky-100 text-sky-800"
                      : user?.role === "EPR"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    {user?.role === "EPR" ? "EPR Regulator" : `${user?.role} Workspace`}
                  </span>
                  {user?.organizationName && (
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[160px]">
                      • {user.organizationName}
                    </span>
                  )}
                </div>
              </div>

              {/* Fast Role Demo Switcher (Instant Evaluation for all 4 roles) */}
              <div className="hidden md:flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Role Demo:</span>
                {(["SELLER", "RECYCLER", "MANUFACTURER", "EPR"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleQuickSwitchRole(r)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                      user?.role === r
                        ? "bg-white text-slate-900 shadow-xs border border-stone-200"
                        : "text-slate-500 hover:text-slate-800 hover:bg-stone-200/50"
                    }`}
                  >
                    {r === "EPR" ? "Regulator" : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Support Modal Trigger (Step 20) */}
                <button
                  onClick={() => setSupportModalOpen(true)}
                  className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                  title="Contact Support"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationList(!showNotificationList)}
                    className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition cursor-pointer relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full" />
                    )}
                  </button>

                  {showNotificationList && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl p-4 shadow-xl z-50 text-xs">
                      <div className="flex justify-between items-center pb-2 mb-2 border-b border-stone-100 font-bold text-slate-900">
                        <span>Notifications</span>
                        <button
                          onClick={async () => {
                            await api.markNotificationsAsRead();
                            pullPlatformData();
                          }}
                          className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-4 text-center text-slate-400">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-2 bg-stone-50 rounded-xl border border-stone-100">
                              <div className="font-bold text-slate-800">{n.title}</div>
                              <div className="text-slate-500 mt-0.5">{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info */}
                {user && (
                  <div className="hidden lg:flex flex-col text-right leading-tight">
                    <span className="text-xs font-bold text-slate-900">{user.name}</span>
                    <span className="text-[10px] text-slate-400">{user.email}</span>
                  </div>
                )}

                {/* Return to Landing or Sign Out */}
                <button
                  onClick={() => setViewMode("landing")}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public Site</span>
                </button>

                <button
                  onClick={handleSignout}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200/60 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STEP 11: ROLE-SPECIFIC NAVIGATION BAR */}
            <div className="bg-stone-50 border-t border-stone-200/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 1. SELLER NAVIGATION */}
                {user?.role === "SELLER" && (
                  <nav className="flex space-x-6 overflow-x-auto py-2 text-xs font-bold">
                    <button
                      onClick={() => setSellerTab("dashboard")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        sellerTab === "dashboard" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setSellerTab("mylistings")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        sellerTab === "mylistings" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      My Listings
                    </button>
                    <button
                      onClick={() => setSellerTab("create")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        sellerTab === "create" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Create Listing
                    </button>
                    <button
                      onClick={() => setSellerTab("transactions")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        sellerTab === "transactions" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Inquiries & Transactions
                    </button>
                    <button
                      onClick={() => setSellerTab("messages")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        sellerTab === "messages" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Messages
                    </button>
                    <button
                      onClick={() => setSellerTab("profile")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        sellerTab === "profile" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Seller Profile
                    </button>
                  </nav>
                )}

                {/* 2. RECYCLER NAVIGATION */}
                {user?.role === "RECYCLER" && (
                  <nav className="flex space-x-6 overflow-x-auto py-2 text-xs font-bold">
                    <button
                      onClick={() => setRecyclerTab("dashboard")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        recyclerTab === "dashboard" ? "text-teal-700 border-b-2 border-teal-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setRecyclerTab("materials")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        recyclerTab === "materials" ? "text-teal-700 border-b-2 border-teal-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Materials Marketplace
                    </button>
                    <button
                      onClick={() => setRecyclerTab("saved")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        recyclerTab === "saved" ? "text-teal-700 border-b-2 border-teal-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Saved Materials
                    </button>
                    <button
                      onClick={() => setRecyclerTab("requests")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        recyclerTab === "requests" ? "text-teal-700 border-b-2 border-teal-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Material Requests
                    </button>
                    <button
                      onClick={() => setRecyclerTab("messages")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        recyclerTab === "messages" ? "text-teal-700 border-b-2 border-teal-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Messages
                    </button>
                    <button
                      onClick={() => setRecyclerTab("profile")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        recyclerTab === "profile" ? "text-teal-700 border-b-2 border-teal-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Recycler Profile
                    </button>
                  </nav>
                )}

                {/* 3. MANUFACTURER NAVIGATION */}
                {user?.role === "MANUFACTURER" && (
                  <nav className="flex space-x-6 overflow-x-auto py-2 text-xs font-bold">
                    <button
                      onClick={() => setManufacturerTab("dashboard")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        manufacturerTab === "dashboard" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setManufacturerTab("materials")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        manufacturerTab === "materials" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Materials Marketplace
                    </button>
                    <button
                      onClick={() => setManufacturerTab("saved")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        manufacturerTab === "saved" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Saved Materials
                    </button>
                    <button
                      onClick={() => setManufacturerTab("requests")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        manufacturerTab === "requests" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Procurement Requests
                    </button>
                    <button
                      onClick={() => setManufacturerTab("messages")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        manufacturerTab === "messages" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Messages
                    </button>
                    <button
                      onClick={() => setManufacturerTab("profile")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        manufacturerTab === "profile" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Manufacturer Profile
                    </button>
                  </nav>
                )}

                {/* 4. EPR REGULATOR NAVIGATION */}
                {user?.role === "EPR" && (
                  <nav className="flex space-x-6 overflow-x-auto py-2 text-xs font-bold">
                    <button
                      onClick={() => setRegulatorTab("dashboard")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        regulatorTab === "dashboard" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setRegulatorTab("monitoring")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        regulatorTab === "monitoring" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Monitoring
                    </button>
                    <button
                      onClick={() => setRegulatorTab("listings")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        regulatorTab === "listings" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Listings Flow
                    </button>
                    <button
                      onClick={() => setRegulatorTab("eprrecords")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        regulatorTab === "eprrecords" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      EPR Records
                    </button>
                    <button
                      onClick={() => setRegulatorTab("analytics")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        regulatorTab === "analytics" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Analytics & Reports
                    </button>
                    <button
                      onClick={() => setRegulatorTab("profile")}
                      className={`pb-1 transition cursor-pointer font-['Poppins',sans-serif] ${
                        regulatorTab === "profile" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Regulator Profile
                    </button>
                  </nav>
                )}
              </div>
            </div>
          </header>

          {/* MAIN STAGE CONTENT (ROLE-ROUTED) */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* SELLER ROLE ROUTE */}
            {user?.role === "SELLER" && (
              <>
                {sellerTab === "messages" ? (
                  <InboxView
                    user={user}
                    showToast={showToast}
                    partnerIdPreset={partnerIdPreset}
                    partnerNamePreset={partnerNamePreset}
                    listingIdPreset={listingIdPreset}
                    onClearPreset={() => {
                      setPartnerIdPreset(null);
                      setPartnerNamePreset(null);
                      setListingIdPreset(null);
                    }}
                  />
                ) : sellerTab === "profile" ? (
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-4 shadow-xs">
                    <h3 className="font-bold text-lg text-slate-900">Seller Entity Profile</h3>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-slate-400">Trader Name:</span> <span className="font-bold text-slate-900">{user.name}</span></div>
                      <div><span className="text-slate-400">Email:</span> <span className="font-bold text-slate-900">{user.email}</span></div>
                      <div><span className="text-slate-400">Enterprise:</span> <span className="font-bold text-slate-900">{user.organizationName}</span></div>
                      <div><span className="text-slate-400">Depot Hub:</span> <span className="font-bold text-slate-900">{user.location}</span></div>
                      <div><span className="text-slate-400">Role:</span> <span className="font-bold text-emerald-800">SELLER (Authorized)</span></div>
                    </div>
                  </div>
                ) : (
                  <SellerView
                    user={user}
                    showToast={showToast}
                    onRefresh={pullPlatformData}
                    onOpenDirectChat={triggerDirectMessagePreset}
                  />
                )}
              </>
            )}

            {/* RECYCLER ROLE ROUTE */}
            {user?.role === "RECYCLER" && (
              <>
                {recyclerTab === "messages" ? (
                  <InboxView
                    user={user}
                    showToast={showToast}
                    partnerIdPreset={partnerIdPreset}
                    partnerNamePreset={partnerNamePreset}
                    listingIdPreset={listingIdPreset}
                    onClearPreset={() => {
                      setPartnerIdPreset(null);
                      setPartnerNamePreset(null);
                      setListingIdPreset(null);
                    }}
                  />
                ) : recyclerTab === "profile" ? (
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-4 shadow-xs">
                    <h3 className="font-bold text-lg text-slate-900">Recycler Facility Profile</h3>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-slate-400">Facility Contact:</span> <span className="font-bold text-slate-900">{user.name}</span></div>
                      <div><span className="text-slate-400">Email:</span> <span className="font-bold text-slate-900">{user.email}</span></div>
                      <div><span className="text-slate-400">Organization:</span> <span className="font-bold text-slate-900">{user.organizationName}</span></div>
                      <div><span className="text-slate-400">Processing Location:</span> <span className="font-bold text-slate-900">{user.location}</span></div>
                      <div><span className="text-slate-400">Role:</span> <span className="font-bold text-teal-800">RECYCLER (Certified)</span></div>
                    </div>
                  </div>
                ) : (
                  <RecyclerDashboard
                    user={user}
                    showToast={showToast}
                    onOpenDirectChat={triggerDirectMessagePreset}
                  />
                )}
              </>
            )}

            {/* MANUFACTURER ROLE ROUTE */}
            {user?.role === "MANUFACTURER" && (
              <>
                {manufacturerTab === "messages" ? (
                  <InboxView
                    user={user}
                    showToast={showToast}
                    partnerIdPreset={partnerIdPreset}
                    partnerNamePreset={partnerNamePreset}
                    listingIdPreset={listingIdPreset}
                    onClearPreset={() => {
                      setPartnerIdPreset(null);
                      setPartnerNamePreset(null);
                      setListingIdPreset(null);
                    }}
                  />
                ) : manufacturerTab === "profile" ? (
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-4 shadow-xs">
                    <h3 className="font-bold text-lg text-slate-900">Manufacturing Mill Profile</h3>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-slate-400">Procurement Officer:</span> <span className="font-bold text-slate-900">{user.name}</span></div>
                      <div><span className="text-slate-400">Email:</span> <span className="font-bold text-slate-900">{user.email}</span></div>
                      <div><span className="text-slate-400">Industrial Mill:</span> <span className="font-bold text-slate-900">{user.organizationName}</span></div>
                      <div><span className="text-slate-400">Plant Location:</span> <span className="font-bold text-slate-900">{user.location}</span></div>
                      <div><span className="text-slate-400">Role:</span> <span className="font-bold text-sky-800">MANUFACTURER</span></div>
                    </div>
                  </div>
                ) : (
                  <ManufacturerDashboard
                    user={user}
                    showToast={showToast}
                    onOpenDirectChat={triggerDirectMessagePreset}
                  />
                )}
              </>
            )}

            {/* EPR REGULATOR ROLE ROUTE */}
            {user?.role === "EPR" && (
              <>
                {regulatorTab === "profile" ? (
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-4 shadow-xs">
                    <h3 className="font-bold text-lg text-slate-900">EPR Regulatory Inspector Profile</h3>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-slate-400">Inspector Name:</span> <span className="font-bold text-slate-900">{user.name}</span></div>
                      <div><span className="text-slate-400">Official Email:</span> <span className="font-bold text-slate-900">{user.email}</span></div>
                      <div><span className="text-slate-400">Agency:</span> <span className="font-bold text-slate-900">{user.organizationName}</span></div>
                      <div><span className="text-slate-400">Regulatory Role:</span> <span className="font-bold text-purple-800">EPR COMPLIANCE AUDITOR</span></div>
                    </div>
                  </div>
                ) : (
                  <EprRegulatorDashboard
                    user={user}
                    showToast={showToast}
                  />
                )}
              </>
            )}

            {/* SYSTEM ADMIN ROUTE */}
            {user?.role === "ADMIN" && (
              <AdminView
                user={user}
                showToast={showToast}
                onRefresh={pullPlatformData}
              />
            )}
          </main>
        </div>
      )}

      {/* AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <AuthCard
            onSuccess={handleAuthSuccess}
            showToast={showToast}
            initialMode={authMode}
            initialRole={authRole}
            onClose={() => setAuthModalOpen(false)}
            isModal={true}
          />
        </div>
      )}

      {/* SUPPORT & CONTACT INFORMATION MODAL (STEP 20) */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                UziLink Platform Support
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                For circular trading inquiries, EPR compliance assistance, or system support, contact our team:
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Email</span>
                  <a href="mailto:ngunjiridavid28@gmail.com" className="font-bold text-emerald-800 hover:underline">
                    ngunjiridavid28@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Phone / WhatsApp</span>
                  <a href="tel:+254735223879" className="font-bold text-emerald-800 hover:underline">
                    +254735223879
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSupportModalOpen(false)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
            >
              Close Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
