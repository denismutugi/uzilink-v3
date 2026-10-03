import React, { useState } from "react";
import { UziLinkLogo } from "./UziLinkLogo.js";
import { ListingItem, UserProfile } from "../types.js";
import { 
  ArrowRight, CheckCircle2, Recycle, Factory, Scissors, Sparkles, 
  MapPin, Scale, Leaf, ShieldCheck, Mail, Phone, ExternalLink, 
  ChevronRight, ArrowUpRight, AlertTriangle, Layers, Building2, 
  HelpCircle, MessageSquare, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import heroImg from "../assets/images/hero_kenyan_textile_1790988200150.jpg";
import scrapsImg from "../assets/images/scraps_transformation_1790988212084.jpg";
import collectionImg from "../assets/images/kenyan_textile_collection_1790988223725.jpg";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface LandingPageProps {
  user: UserProfile | null;
  listings: ListingItem[];
  onOpenAuth: (mode: "login" | "signup", role?: "SELLER" | "RECYCLER" | "MANUFACTURER" | "EPR") => void;
  onGoToDashboard: () => void;
  onViewListingDetail: (listing: ListingItem) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  listings,
  onOpenAuth,
  onGoToDashboard,
  onViewListingDetail
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Sample or backend preview listings
  const previewListings = listings.length > 0 ? listings.slice(0, 3) : [
    {
      id: "preview-1",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      weightKg: 450,
      quantity: 9,
      location: "Gikomba Market, Nairobi",
      imageUrl: heroImg,
      fabricType: "Denim & Twill Offcuts",
      material: "100% Cotton & Denim Blends",
      condition: "Post-consumer sorted scraps (hardware-free)",
      color: "Indigo Blue & Charcoal",
      texture: "Rough twill, dense weave",
      recyclabilityScore: 84,
      estimatedPriceKES: 27500,
      confidence: 94,
      recommendedIndustries: ["Eco-apparel spinning", "Acoustic insulation batts"],
      upcyclingIdeas: ["Denim patchwork totes", "Insulation boards"],
      carbonSavingsKg: 1350,
      description: "Clean sorted denim cutouts stripped of rivets and zippers. Ready for mechanical shredding or yarn spinning.",
      status: "PUBLISHED" as const,
      viewsCount: 24,
      createdAt: new Date().toISOString()
    },
    {
      id: "preview-2",
      sellerId: "u-seller-1",
      sellerName: "Rivatex Partners",
      weightKg: 280,
      quantity: 5,
      location: "Industrial Area, Nairobi",
      imageUrl: scrapsImg,
      fabricType: "Combed Cotton Jersey",
      material: "100% Combed Cotton",
      condition: "Pre-consumer cutting scraps",
      color: "Assorted Whites & Heathers",
      texture: "Soft single knit standard",
      recyclabilityScore: 92,
      estimatedPriceKES: 18500,
      confidence: 91,
      recommendedIndustries: ["Fiber-to-fiber spinning", "Industrial wiping cottons"],
      upcyclingIdeas: ["Baby clothing patchwork", "Paper pulp stationery"],
      carbonSavingsKg: 840,
      description: "Pure factory cutting scraps from athletic wear production. Dry, unwashed, and high fiber purity.",
      status: "PUBLISHED" as const,
      viewsCount: 19,
      createdAt: new Date().toISOString()
    },
    {
      id: "preview-3",
      sellerId: "u-seller-1",
      sellerName: "Coast Mitumba Sorters",
      weightKg: 1200,
      quantity: 24,
      location: "Mombasa Port Depot",
      imageUrl: collectionImg,
      fabricType: "Synthetic Fleece Bales",
      material: "100% Recycled Polyester (rPET)",
      condition: "Post-consumer sorted bales",
      color: "Black & Dark Gray",
      texture: "High-pile plush knit",
      recyclabilityScore: 88,
      estimatedPriceKES: 68000,
      confidence: 95,
      recommendedIndustries: ["Geotextile weaving", "Automotive interior padding"],
      upcyclingIdeas: ["Pellet compounding", "Soundproofing tiles"],
      carbonSavingsKg: 4200,
      description: "High-volume sorted polar fleece bundles. Monomaterial polymer allows mechanical thermal compounding.",
      status: "PUBLISHED" as const,
      viewsCount: 12,
      createdAt: new Date().toISOString()
    }
  ];

  const faqs = [
    {
      q: "What types of textile waste can be listed on UziLink?",
      a: "We facilitate all streams of Kenyan textile scraps: post-consumer mitumba offcuts, pre-consumer factory cutting scraps, denim remnants, pure cotton jersey, synthetic polyester fleece, wool and felt blends, and industrial end-of-roll fabrics."
    },
    {
      q: "How does pricing and payment work in Kenya Shillings?",
      a: "UziLink provides AI-assisted valuation benchmarks based on weight, fiber purity, and current market demand in KES. Buyers and suppliers negotiate directly on terms, with verified payment settlement upon physical batch inspection or depot handover."
    },
    {
      q: "Can businesses and small workshops buy specific sorted scrap quantities?",
      a: "Yes! While large recyclers procure tons of baled waste, industrial processors, workshops, and product makers can search for batches from 50 kg to multiple metric tons of sorted denim, patterned cotton, or synthetic polyester for local production."
    },
    {
      q: "How does UziLink support Extended Producer Responsibility (EPR)?",
      a: "We automatically calculate abated carbon emissions (kg CO2e) and circular diversion metrics for every completed batch. Manufacturers and recyclers can generate verified compliance audit certificates aligned with Kenya EPR regulations (KEPRO)."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Wordmark */}
          <a href="#" className="flex items-center gap-2 group">
            <UziLinkLogo size="md" theme="light" />
          </a>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-700 transition">How It Works</a>
            <a href="#problem" className="hover:text-emerald-700 transition">The Problem</a>
            <a href="#transformations" className="hover:text-emerald-700 transition">Transformations</a>
            <a href="#marketplace-preview" className="hover:text-emerald-700 transition">Marketplace</a>
            <a href="#network" className="hover:text-emerald-700 transition">Join Network</a>
            <a href="#contact" className="hover:text-emerald-700 transition">Contact</a>
          </nav>

          {/* Right Action Zone */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 font-['Poppins',sans-serif] cursor-pointer"
              >
                <span>Dashboard ({user.name.split(" ")[0]})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth("login")}
                  className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => onOpenAuth("signup")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer font-['Poppins',sans-serif]"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onOpenAuth("signup")}
              className="bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              Sign Up
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-stone-100"
              aria-label="Toggle navigation"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-slate-700 rounded-full" />
                <span className="w-full h-0.5 bg-slate-700 rounded-full" />
                <span className="w-full h-0.5 bg-slate-700 rounded-full" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b border-stone-200 bg-white px-5 py-4 space-y-3 text-sm font-semibold text-slate-700"
            >
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1">How It Works</a>
              <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block py-1">The Problem</a>
              <a href="#transformations" onClick={() => setMobileMenuOpen(false)} className="block py-1">Transformations</a>
              <a href="#marketplace-preview" onClick={() => setMobileMenuOpen(false)} className="block py-1">Live Marketplace</a>
              <a href="#network" onClick={() => setMobileMenuOpen(false)} className="block py-1">Join the Network</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-1">Contact Us</a>
              <div className="pt-2 border-t border-stone-100 flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth("login");
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold border border-stone-300 rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth("signup");
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold bg-emerald-700 text-white rounded-lg"
                >
                  Sign Up
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F2F7F4] via-[#FAF9F5] to-[#FAF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Tagline & CTA */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Climate-tech context kicker */}
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 px-3.5 py-1.5 rounded-full">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kenya's B2B Circular Textile Exchange</span>
              </div>

              {/* Main Tagline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] font-['Poppins',sans-serif] text-balance">
                Where Scraps Find a <span className="text-emerald-700">Second Life.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Turning Kenya’s textile waste into new circular feedstock for businesses, recyclers, and manufacturers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onOpenAuth("signup")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-2.5 cursor-pointer font-['Poppins',sans-serif]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="bg-white hover:bg-stone-50 text-slate-800 font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-stone-300 shadow-xs transition flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif]"
                >
                  <span>Explore UziLink</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 font-['Poppins',sans-serif] tabular-nums">45,000+</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Kg scraps diverted</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-700 font-['Poppins',sans-serif] tabular-nums">KES 3.8M+</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Value recovered</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 font-['Poppins',sans-serif] tabular-nums">350+</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Kenyan partners</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset (Authentic Kenyan Context) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100 aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] group">
                <img
                  src={resolveImageUrl(heroImg)}
                  alt="Kenyan textile sorters categorizing sorted fabric scraps in Nairobi"
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-700"
                  referrerPolicy="no-referrer"
                  onError={handleImageFallback}
                />
                
                {/* Floating Micro Badge 1: Location & Context */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-stone-200/80 px-3 py-2 rounded-xl shadow-md text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Nairobi Sorting Hub · Gikomba</span>
                </div>

                {/* Floating Micro Badge 2: Real Impact */}
                <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>100% Traceable Circular Feedstock</span>
                </div>
              </div>

              {/* Decorative shadow patch */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: THE PROBLEM */}
      <section id="problem" className="py-20 bg-white border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
              The Reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Poppins',sans-serif] text-balance">
              Kenya’s Mounting Textile Waste Challenge
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Every year, over 185,000 tonnes of secondhand clothing (mitumba) arrive in Kenya. 
              Between 30% and 40% is unwearable or severely damaged, creating an overwhelming environmental crisis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Gikomba & Landfill Overflow */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-7 rounded-2xl space-y-4 hover:border-stone-300 transition shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                Overburdened Open Markets
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Traders in markets like Gikomba and Toi must pay disposal fees for bales packed with soiled offcuts. Millions of garments end up dumped or openly burned, generating hazardous smoke.
              </p>
            </div>

            {/* Card 2: River & Environmental Toll */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-7 rounded-2xl space-y-4 hover:border-stone-300 transition shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                River & Ecosystem Degradation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Textile cutouts choke drainage channels and wash into vital waterways like the Nairobi and Athi rivers, degrading aquatic life and shedding persistent synthetic microfibers.
              </p>
            </div>

            {/* Card 3: Missed Economic Potential */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-7 rounded-2xl space-y-4 hover:border-stone-300 transition shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Recycle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                Lost Resource Opportunity
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Meanwhile, Kenyan recyclers, mattress manufacturers, and weaving mills struggle to find clean, sorted cotton and denim fibers at predictable prices. UziLink bridges this gap.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SECTION: HOW UZILINK WORKS */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-md">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
              How UziLink Works
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Designed for ease of use across mobile phones and depots, connecting scrap holders directly with buyers in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-emerald-300 transition group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-black text-emerald-700 font-['Poppins',sans-serif]">01</span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Scale className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Upload & Sort Scraps
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Suppliers upload a quick photo and estimated kilograms. Our system categorizes fiber type (denim, knit, fleece) and estimates recyclability.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span>Free listing declaration</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-emerald-300 transition group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-black text-emerald-700 font-['Poppins',sans-serif]">02</span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Factory className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Match with Buyers
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Recycling plants, spinning mills, and manufacturers filter available batches by composition, weight, and depot proximity to submit quotations.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span>Direct quotation matching</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-emerald-300 transition group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-black text-emerald-700 font-['Poppins',sans-serif]">03</span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Arrange Collection
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Confirm price in Kenya Shillings (KES) and choose depot pickup or local cargo transport between the seller depot and receiving facility.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span>Transparent Kenyan logistics</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between hover:border-emerald-300 transition group">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-black text-emerald-700 font-['Poppins',sans-serif]">04</span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Scissors className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Give Waste a Second Life
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Fibers are transformed into yarn, eco-apparel, insulation batts, and bags while verified carbon offsets are registered on your profile.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span>EPR circular certificate</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. SECTION: WHAT HAPPENS TO THE SCRAPS? */}
      <section id="transformations" className="py-20 bg-white border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
                Circular Value
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
                What Happens to the Scraps?
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                Textile waste isn't garbage—it is valuable feedstock. Here is how Kenyan mills, recyclers, and manufacturers turn discarded scraps into marketable, high-utility products.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200 bg-stone-100 aspect-[16/9]">
                <img
                  src={resolveImageUrl(scrapsImg)}
                  alt="Finished upcycled products from Kenyan textile scraps"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={handleImageFallback}
                />
              </div>
            </div>
          </div>

          {/* Transformation Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-[#FAF9F5] border border-stone-200/80 p-5 rounded-2xl space-y-3">
              <div className="text-emerald-700 font-bold text-xs uppercase tracking-wide">01 · High Purity</div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">Recycled Fibres & Yarn</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pure cotton and polyester scraps mechanically opened, carded, and spun into durable secondary yarn for Kenyan weaving mills.
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-stone-200/80 p-5 rounded-2xl space-y-3">
              <div className="text-emerald-700 font-bold text-xs uppercase tracking-wide">02 · Secondary Products</div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">Industrial Bags & Covers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Heavy denim and canvas offcuts transformed into durable utility packaging, cargo strapping, and commercial tote covers.
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-stone-200/80 p-5 rounded-2xl space-y-3">
              <div className="text-emerald-700 font-bold text-xs uppercase tracking-wide">03 · Construction</div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">Thermal & Acoustic Batts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mixed post-consumer apparel shredded and bonded into sound-dampening acoustic tiles and energy-efficient building insulation.
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-stone-200/80 p-5 rounded-2xl space-y-3">
              <div className="text-emerald-700 font-bold text-xs uppercase tracking-wide">04 · Industrial</div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">Wipes & Floor Underlays</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stretchy knit jersey remnants converted into sterile cleaning rags for machinery, mattress stuffing, and automotive underlays.
              </p>
            </div>

          </div>

          {/* Secondary Photo Showcase with Circular Economy Context */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Circular Impact</span>
              <h3 className="text-2xl font-bold font-['Poppins',sans-serif]">
                Empowering Kenya's Circular Textile Supply Network
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                By formalizing the scrap trade, UziLink boosts the weekly incomes of sorting syndicates while delivering traceable feedstock directly to mills, recyclers, and EPR regulators.
              </p>
            </div>
            <button
              onClick={() => onOpenAuth("signup", "SELLER")}
              className="bg-white hover:bg-stone-100 text-slate-900 font-bold text-xs px-5 py-3 rounded-xl shadow-md transition shrink-0 cursor-pointer font-['Poppins',sans-serif]"
            >
              Join the Network
            </button>
          </div>

        </div>
      </section>

      {/* 6. SECTION: LIVE MARKETPLACE PREVIEW */}
      <section id="marketplace-preview" className="py-20 bg-[#FAF9F5] border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-md">
                Live Feed
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
                Active Scrap Batches in Kenya
              </h2>
              <p className="text-sm text-slate-600 font-normal">
                Browse real-time declared scrap inventory from Nairobi, Mombasa, and regional sorting depots.
              </p>
            </div>
            <button
              onClick={() => {
                if (user) {
                  onGoToDashboard();
                } else {
                  onOpenAuth("signup");
                }
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-xs transition"
            >
              <span>View Full Marketplace ({listings.length || 3} lots)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {previewListings.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewListingDetail(item)}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Photo with Overlay Badge */}
                  <div className="relative h-48 bg-stone-100 overflow-hidden">
                    <img
                      src={resolveImageUrl(item.images?.[0] || item.imageUrl, item.category, item.materialType || item.material)}
                      data-category={item.category}
                      data-material={item.materialType || item.material}
                      alt={item.title || item.fabricType}
                      className="w-full h-full object-cover group-hover:scale-104 transition duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageFallback}
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-stone-200">
                      Recyclability: {item.recyclabilityScore}%
                    </div>
                    <div className="absolute bottom-3 left-3 bg-emerald-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-emerald-400" />
                      <span>-{item.carbonSavingsKg} kg CO2e</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition">
                        {item.fabricType}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
                        {item.description}
                      </p>
                    </div>

                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 text-xs text-slate-600 flex justify-between items-center font-medium">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{item.weightKg} Kg</strong> ({item.quantity} bales)
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location.split(",")[0]}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="p-5 pt-0 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase font-semibold">Lot Valuation</div>
                    <div className="text-base font-extrabold text-emerald-700 font-['Poppins',sans-serif]">
                      KES {item.estimatedPriceKES.toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewListingDetail(item);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    View Lot
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. SECTION: JOIN THE NETWORK */}
      <section id="network" className="py-20 md:py-28 bg-white border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
              Stakeholder Hub
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
              Join the UziLink Network
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Whether you generate kilograms of cutting scraps or process tons of industrial fiber, choose your role to connect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Waste Suppliers */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-6 rounded-2xl flex flex-col justify-between space-y-5 hover:border-emerald-300 transition">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Waste Suppliers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mitumba importers, open-market sorters, and EPZ apparel manufacturers. Turn disposal headaches into cash flow and clear factory floors.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">• Automated batch pricing</li>
                  <li className="flex items-center gap-2">• Depot collection support</li>
                  <li className="flex items-center gap-2">• Transparent KES payments</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth("signup", "SELLER")}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer font-['Poppins',sans-serif]"
              >
                Join as Supplier
              </button>
            </div>

            {/* 2. Recyclers */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-6 rounded-2xl flex flex-col justify-between space-y-5 hover:border-emerald-300 transition">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-sky-100/70 text-sky-800 flex items-center justify-center font-bold">
                  <Recycle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Textile Recyclers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mechanical fiber shredders, chemical polymer processors, and pellet compounders requiring sorted, consistent bulk supply.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">• Verified material composition</li>
                  <li className="flex items-center gap-2">• High-tonnage lot booking</li>
                  <li className="flex items-center gap-2">• Real-time scrap alerts</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth("signup", "RECYCLER")}
                className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer font-['Poppins',sans-serif]"
              >
                Join as Recycler
              </button>
            </div>

            {/* 3. Manufacturers */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-6 rounded-2xl flex flex-col justify-between space-y-5 hover:border-emerald-300 transition">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center font-bold">
                  <Factory className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                  Manufacturers & Mills
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Spinning mills, furniture factories, mattress makers, and automotive interior developers sourcing secondary feedstock.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">• Cheaper virgin fiber alternative</li>
                  <li className="flex items-center gap-2">• Traceable green procurement</li>
                  <li className="flex items-center gap-2">• EPR compliance alignment</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth("signup", "MANUFACTURER")}
                className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer font-['Poppins',sans-serif]"
              >
                Join as Manufacturer
              </button>
            </div>

            {/* 4. EPR Regulators */}
            <div className="bg-[#FAF9F5] border border-stone-200 p-6 rounded-2xl flex flex-col justify-between space-y-5 hover:border-emerald-300 transition">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100/70 text-purple-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif]">
                  EPR Regulators
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  KEPRO inspectors, environmental compliance officers, and PRO auditors monitoring textile waste flows and statutory quotas.
                </p>
                <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">• Platform-wide scrap statistics</li>
                  <li className="flex items-center gap-2">• Verified material custody tracking</li>
                  <li className="flex items-center gap-2">• Audit-ready EPR compliance records</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth("login", "EPR")}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer font-['Poppins',sans-serif]"
              >
                Access Regulator Portal
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 8. SECTION: FREQUENT QUESTIONS */}
      <section className="py-20 bg-[#FAF9F5] border-t border-stone-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-md">
              Answers
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex justify-between items-center text-sm sm:text-base font-bold text-slate-900 gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-emerald-700" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-stone-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 9. SECTION: CALL TO ACTION */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-emerald-800 to-slate-900 text-white relative overflow-hidden">
        {/* Subtle patterned circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Join 350+ Kenyan Businesses Today</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-['Poppins',sans-serif] tracking-tight text-balance">
            Turn your textile waste into an opportunity.
          </h2>

          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop dumping and start trading. Connect with verified buyers, lower disposal costs, and help build Kenya’s circular textile economy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onOpenAuth("signup")}
              className="bg-white hover:bg-stone-100 text-slate-900 font-bold text-sm sm:text-base px-8 py-4 rounded-xl shadow-xl transition cursor-pointer font-['Poppins',sans-serif]"
            >
              Get Started Now — It's Free
            </button>
            <a
              href="#contact"
              className="bg-emerald-900/60 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base px-6 py-4 rounded-xl border border-emerald-600/40 transition"
            >
              Speak with a Waste Specialist
            </a>
          </div>
        </div>
      </section>

      {/* 10. SECTION: CONTACT & INQUIRY */}
      <section id="contact" className="py-20 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
                Get in Touch
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
                Contact UziLink Hub
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Have bulk textile scraps, require corporate EPR certification, or want to partner on a regional circular pilot in Kenya?
              </p>

              <div className="space-y-3.5 pt-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Nairobi Circular Hub · Industrial Area & Gikomba Depot, Kenya</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>ngunjiridavid28@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>+254735223879</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="lg:col-span-7 bg-[#FAF9F5] border border-stone-200 p-6 sm:p-8 rounded-3xl">
              <h3 className="text-base font-bold text-slate-900 mb-4 font-['Poppins',sans-serif]">
                Send a Message or Pilot Request
              </h3>
              {formSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">Inquiry Received</h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Thank you! Your inquiry has been received. An UziLink circular specialist will contact you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs text-emerald-800 font-semibold underline cursor-pointer pt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Grace Wanjiku"
                        className="w-full bg-white border border-stone-300 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-700 text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="grace@company.co.ke"
                        className="w-full bg-white border border-stone-300 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-700 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Organization or Trader Type</label>
                    <select
                      className="w-full bg-white border border-stone-300 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-700 text-slate-800"
                    >
                      <option>Waste Supplier (Factory / Mitumba Trader)</option>
                      <option>Recycling Processor</option>
                      <option>Product Manufacturer / Weaver</option>
                      <option>EPR Compliance / KEPRO Inspector</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">How can we assist you?</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about the scrap types, estimated monthly weight, or partnership requirements..."
                      className="w-full bg-white border border-stone-300 text-xs p-3.5 rounded-xl outline-none focus:border-emerald-700 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-xs cursor-pointer font-['Poppins',sans-serif]"
                  >
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 11. QUIET FOOTER */}
      <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <UziLinkLogo size="sm" theme="dark" />
            <span className="text-stone-500 font-medium">· Nairobi, Kenya</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-stone-400">
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#problem" className="hover:text-white transition">The Problem</a>
            <a href="#transformations" className="hover:text-white transition">Transformations</a>
            <a href="#network" className="hover:text-white transition">Stakeholders</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
            <button onClick={() => onOpenAuth("login")} className="hover:text-white transition cursor-pointer">
              Login
            </button>
          </div>

          <div className="text-stone-500 text-center md:text-right">
            © {new Date().getFullYear()} UziLink Technologies Ltd. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};
