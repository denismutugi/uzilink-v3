import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { ListingItem, UserProfile, EprRecordItem } from "../types.js";
import { 
  ShieldCheck, Activity, BarChart3, Scale, Layers, MapPin, 
  FileText, Download, CheckCircle, Clock, AlertTriangle, Building,
  TrendingUp, Leaf, RefreshCw, Eye, Check
} from "lucide-react";

interface EprRegulatorDashboardProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const EprRegulatorDashboard: React.FC<EprRegulatorDashboardProps> = ({
  user,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "listingsflow" | "eprrecords" | "compliance">("overview");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [eprRecords, setEprRecords] = useState<EprRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter in monitoring view
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  const loadRegulatorData = async () => {
    setLoading(true);
    try {
      const [listRes, eprRes] = await Promise.all([
        api.getListings({ allStatuses: "true" }),
        api.getEprRecords()
      ]);
      setListings(listRes.listings || []);
      setEprRecords(eprRes.records || []);
    } catch (e) {
      showToast("Failed to fetch EPR data feeds", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegulatorData();
  }, []);

  // Compute Platform-wide Statistics
  const totalListings = listings.length;
  const totalWeightKg = listings.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  const totalWeightTonnes = (totalWeightKg / 1000).toFixed(2);
  const totalCarbonAvoidanceKg = listings.reduce((sum, l) => sum + (Number(l.carbonSavingsKg) || Math.round((Number(l.quantity) || 0) * 2.8)), 0);
  const totalMarketplaceValueKES = listings.reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  const availableCount = listings.filter(l => l.status === "AVAILABLE").length;
  const processedOrSoldCount = listings.filter(l => l.status === "SOLD" || l.status === "PENDING").length;

  // Breakdown by category
  const categoryStats: Record<string, { count: number; kg: number }> = {};
  listings.forEach((l) => {
    const cat = l.category || "Other";
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, kg: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].kg += Number(l.quantity) || 0;
  });

  // Geographic Breakdown
  const locationStats: Record<string, number> = {};
  listings.forEach((l) => {
    const loc = l.location ? l.location.split(",")[0].trim() : "Nairobi";
    locationStats[loc] = (locationStats[loc] || 0) + (Number(l.quantity) || 0);
  });

  const handleExportEprReport = () => {
    const reportData = {
      title: "KEPRO / NEMA National Circular Textile Waste Compliance Summary",
      dateGenerated: new Date().toISOString(),
      regulatorUser: user.name,
      metrics: {
        totalRegisteredLots: totalListings,
        divertedTonnage: totalWeightTonnes,
        carbonSavingsMetricTonnes: (totalCarbonAvoidanceKg / 1000).toFixed(2),
        totalEconomicValueCirculatedKES: totalMarketplaceValueKES
      },
      materialDistribution: categoryStats,
      recordsAudited: eprRecords
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uzilink-epr-compliance-audit-${Date.now()}.json`;
    a.click();
    showToast("EPR compliance report generated and downloaded successfully", "success");
  };

  const handleVerifyEprRecord = (recordId: string) => {
    setEprRecords(prev => prev.map(r => r.id === recordId ? { ...r, complianceStatus: "VERIFIED" } : r));
    showToast("Chain-of-Custody record certified under KEPRO EPR guidelines!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>National Circularity & EPR Compliance Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold font-['Poppins',sans-serif]">
            Textile Waste Monitoring & Compliance Dashboard
          </h2>
          <p className="text-xs text-purple-100/80 mt-1 max-w-xl">
            Empowered for regulatory oversight under Kenya's Extended Producer Responsibility regulations (KEPRO / NEMA). Track material flows, landfill diversion, and chain-of-custody transfer notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRegulatorData}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition cursor-pointer"
            title="Refresh Monitoring Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportEprReport}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif]"
          >
            <Download className="w-4 h-4" />
            <span>Export Official EPR Audit</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "overview" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Compliance Overview & Metrics</span>
        </button>
        <button
          onClick={() => setActiveTab("listingsflow")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "listingsflow" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Material Flow Monitoring ({listings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("eprrecords")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "eprrecords" ? "text-purple-700 border-b-2 border-purple-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Chain-of-Custody EPR Records ({eprRecords.length})</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* High Level KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Scraps Diverted</span>
                <Scale className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
                {Number(totalWeightTonnes).toLocaleString()} <span className="text-sm font-normal text-slate-500">Tonnes</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                ({totalWeightKg.toLocaleString()} kg declared in platform)
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Carbon Offset (CO2e)</span>
                <Leaf className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 font-['Poppins',sans-serif]">
                {(totalCarbonAvoidanceKg / 1000).toFixed(1)} <span className="text-sm font-normal text-slate-500">Tons CO2</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Calculated via standard LCA diversion factor
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Circular Economic Value</span>
                <TrendingUp className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
                KSh {(totalMarketplaceValueKES / 1000000).toFixed(2)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total commercial secondary valuation
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-center text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Material Recovery State</span>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-['Poppins',sans-serif]">
                {processedOrSoldCount} / {totalListings}
              </div>
              <div className="text-[11px] text-purple-700 font-semibold mt-1">
                {availableCount} currently active for allocation
              </div>
            </div>
          </div>

          {/* Categorical & Geographic Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-['Poppins',sans-serif] flex items-center justify-between">
                <span>Material Fiber Composition Breakdown</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </h3>

              <div className="space-y-3">
                {Object.entries(categoryStats).map(([cat, data]) => {
                  const percent = totalWeightKg > 0 ? Math.round((data.kg / totalWeightKg) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{cat}</span>
                        <span>{data.kg.toLocaleString()} kg ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 font-['Poppins',sans-serif] flex items-center justify-between">
                <span>Geographic Scrap Concentration</span>
                <MapPin className="w-4 h-4 text-emerald-600" />
              </h3>

              <div className="space-y-3">
                {Object.entries(locationStats).map(([loc, kg]) => {
                  const pct = totalWeightKg > 0 ? Math.round((kg / totalWeightKg) * 100) : 0;
                  return (
                    <div key={loc} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{loc}</span>
                        <span>{kg.toLocaleString()} kg</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATERIAL FLOW MONITORING TAB */}
      {activeTab === "listingsflow" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
                Textile Scrap Lots Regulatory Stream
              </h3>
              <p className="text-xs text-slate-500">
                Live monitoring of all declared textile waste batches across sellers, recyclers, and manufacturers.
              </p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Lot ID</th>
                    <th className="py-3 px-4">Title & Material</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Weight / Quantity</th>
                    <th className="py-3 px-4">Origin Hub</th>
                    <th className="py-3 px-4">Seller Entity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Carbon Avoided</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{l.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{l.title}</div>
                        <div className="text-[11px] text-slate-400">{l.materialType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-stone-100 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {l.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {l.quantity} {l.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{l.location}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{l.sellerName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === "AVAILABLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.status === "SOLD"
                            ? "bg-slate-800 text-white"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">
                        {l.carbonSavingsKg || Math.round(l.quantity * 2.8)} kg CO2
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CHAIN OF CUSTODY EPR RECORDS */}
      {activeTab === "eprrecords" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
                Official EPR Chain-of-Custody Logs
              </h3>
              <p className="text-xs text-slate-500">
                Transfer notes and recycling verification records submitted under KEPRO circularity guidelines.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {eprRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-purple-700 font-bold">#{rec.id}</span>
                    <span className="font-bold text-sm text-slate-900">{rec.materialType}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      rec.complianceStatus === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800"
                        : rec.complianceStatus === "AUDITED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {rec.complianceStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    Volume: <span className="font-bold text-slate-900">{rec.quantity} {rec.unit}</span> • Origin: <span className="text-slate-800">{rec.sellerLocation}</span> • Recycling Partner: <span className="font-semibold text-slate-800">{rec.recyclingPartner}</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Logged: {new Date(rec.timestamp).toLocaleDateString()} • Verified Carbon Avoidance: <span className="text-emerald-700 font-bold">{rec.carbonSavingsKg} kg CO2e</span>
                  </div>
                </div>

                <div>
                  {rec.complianceStatus !== "VERIFIED" ? (
                    <button
                      onClick={() => handleVerifyEprRecord(rec.id)}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-['Poppins',sans-serif]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Certify Chain-of-Custody</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Certified Compliance
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
