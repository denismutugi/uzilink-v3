import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { AdminAnalyticsReport, UserProfile, ListingItem } from "../types.js";
import { ShieldCheck, Users, Percent, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface AdminViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onRefresh: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, showToast, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "listings" | "audit">("analytics");
  const [report, setReport] = useState<AdminAnalyticsReport | null>(null);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [inventoryList, setInventoryList] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync / pull report
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const reportRes = await api.getAnalytics();
      setReport(reportRes.analytics);

      if (activeTab === "users") {
        const usersRes = await api.getAdminUsers();
        setUserList(usersRes.users);
      } else if (activeTab === "listings") {
        const listRes = await api.getListings();
        setInventoryList(listRes.listings);
      }
    } catch (e: any) {
      showToast("Access restricted or administrative request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const handleApproveBusiness = async (bizId: string, isApprove: boolean) => {
    try {
      const decision = isApprove ? "APPROVED" : "REJECTED";
      await api.approveUser(bizId, decision);
      showToast(`User credentials successfully updated to ${decision}`, "success");
      loadAdminData();
      onRefresh();
    } catch (e) {
      showToast("Failed to process approval.", "error");
    }
  };

  const handleModerateDelete = async (listId: string) => {
    try {
      await api.moderateListing(listId);
      showToast("Listing deleted successfully by moderator.", "success");
      setConfirmDeleteId(null);
      loadAdminData();
      onRefresh();
    } catch (e) {
      showToast("Failed to delete listing.", "error");
    }
  };

  return (
    <div className="space-y-6" id="admin-page-wrapper">
      {/* Header and Sync Control */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/15 p-2 rounded-xl border border-teal-500/20">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Administrative Moderation Center</h1>
            <p className="text-xs text-slate-500">Superuser hub to moderate traders, manage circular inventory, and audit carbon savings reports.</p>
          </div>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="bg-slate-950 hover:bg-slate-850 p-2 text-slate-300 hover:text-white rounded-xl border border-slate-800 cursor-pointer disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metric card grid scorecard */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-analytics-grid">
          <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Circular Users Registered</span>
            <div className="text-2xl font-black text-white mt-1.5">{report.userCount} <span className="text-xs font-normal text-slate-500">owners</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active listings weight</span>
            <div className="text-2xl font-black text-white mt-1.5">{report.totalWeightKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">Kg</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Carbon Abated</span>
            <div className="text-2xl font-black text-emerald-400 mt-1.5">-{report.totalCarbonSavedKg.toLocaleString()} <span className="text-xs font-normal text-emerald-500">kg CO2</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Marketplace Net Value</span>
            <div className="text-2xl font-black text-teal-400 mt-1.5">KES {report.totalKESValue?.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Quick Approvals Checklist */}
      {report && report.pendingReviewCount > 0 && (
        <div className="bg-[#452E10]/15 border border-[#6B4B18]/30 p-5 rounded-2xl text-amber-300" id="admin-notifications-warning">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            B2B Approvals review list ({report.pendingReviewCount})
          </h3>
          <p className="text-xs text-amber-300/80 mb-3 block">Recyclers and Manufacturers must pass credential audit and registration review before full platform authorization is activated.</p>
          <button
            onClick={() => setActiveTab("users")}
            className="text-xs bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition"
          >
            Review Business Accounts
          </button>
        </div>
      )}

      {/* Admin Tab Nav */}
      <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800" id="admin-subtabs">
        {(["analytics", "users", "listings", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl uppercase tracking-wider transition ${
              activeTab === tab ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading directory database...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden" id="admin-active-tab-content">
          {activeTab === "analytics" && report && (
            <div className="space-y-6" id="panel-admin-activity-report">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-4">Textile User base Segmentation ratio</h3>
                  <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-xs space-y-3.5 text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>Textile Waste Sellers (Traders/Factories):</span>
                      <strong className="text-white text-sm">{report.roleStats?.SELLER || 0} users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Recycling Firms (Processors/Shredders):</span>
                      <strong className="text-white text-sm">{report.roleStats?.RECYCLER || 0} users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Product Manufacturers (Weavers/Mills):</span>
                      <strong className="text-white text-sm">{report.roleStats?.MANUFACTURER || 0} users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>EPR Auditing Officers:</span>
                      <strong className="text-white text-sm">{report.roleStats?.EPR || 0} users</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-4">Circular economy recycling rate</h3>
                  <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-xs flex flex-col justify-center h-full min-h-[140px]">
                    <div className="flex justify-between text-slate-400 mb-1.5 font-medium">
                      <span>Total Waste Saved / Re-channeled:</span>
                      <strong className="text-white">{report.solvedWeightKg} Kg / {report.totalWeightKg} Kg</strong>
                    </div>
                    {/* Visual meter bar */}
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${report.totalWeightKg ? (report.solvedWeightKg / report.totalWeightKg) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-2 text-right">
                      {report.totalWeightKg ? Math.round((report.solvedWeightKg / report.totalWeightKg) * 100) : 0}% Completed Recycling rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Show Audit Logs Timeline */}
              <div className="pt-4">
                <h3 className="text-base font-bold text-white mb-4">Latest System Activities Logs</h3>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 divide-y divide-slate-900 font-mono text-[10px] text-slate-400 max-h-60 overflow-y-auto">
                  {report.recentLogs?.map((log) => (
                    <div key={log.id} className="py-2.5 flex justify-between items-start">
                      <div>
                        <span className="bg-slate-900 text-slate-300 font-bold px-1.5 py-0.5 rounded mr-2 uppercase text-[8px] tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-slate-200">{log.details}</span>
                        {log.userEmail && <span className="text-slate-500 ml-1">({log.userEmail})</span>}
                      </div>
                      <span className="text-slate-500 ml-4 font-normal select-all">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto" id="panel-admin-directory">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-l-lg">User details</th>
                    <th scope="col" className="px-6 py-3">B2B Role type</th>
                    <th scope="col" className="px-6 py-3">Location Base</th>
                    <th scope="col" className="px-6 py-3">Company organization</th>
                    <th scope="col" className="px-6 py-3">Verification status</th>
                    <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Action Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {userList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850/50">
                      <td className="px-6 py-4 font-bold text-white">
                        <div>{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-light mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{u.location || "N/A"}</td>
                      <td className="px-6 py-4">{u.organizationName || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.approvalStatus === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                          u.approvalStatus === "PENDING" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {u.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.approvalStatus === "PENDING" ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleApproveBusiness(u.id, false)}
                              className="bg-rose-600 hover:bg-rose-500 text-white p-1 rounded transition"
                              title="Reject Application"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApproveBusiness(u.id, true)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded transition"
                              title="Approve Credentials"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">Fully Authorized</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "listings" && (
            <div className="overflow-x-auto" id="panel-admin-moderator">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-l-lg">shipment Asset</th>
                    <th scope="col" className="px-6 py-3">Primary Seller</th>
                    <th scope="col" className="px-6 py-3">Location & Weight</th>
                    <th scope="col" className="px-6 py-3">AI composition summary</th>
                    <th scope="col" className="px-6 py-3">Value (KES)</th>
                    <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {inventoryList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-850/50">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <img 
                            src={resolveImageUrl((item as any).images?.[0] || item.imageUrl, (item as any).category, item.material || item.fabricType)} 
                            data-category={(item as any).category}
                            data-material={item.material || item.fabricType}
                            alt={item.fabricType}
                            className="w-8 h-8 object-cover rounded" 
                            onError={handleImageFallback}
                          />
                          <span className="truncate max-w-44">{item.fabricType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.sellerName || "Trader"}</td>
                      <td className="px-6 py-4">{item.weightKg} Kg in {item.location.split(",")[0]}</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">{item.material}</td>
                      <td className="px-6 py-4 font-bold text-teal-400">KES {item.estimatedPriceKES?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-rose-400 font-bold">Remove?</span>
                            <button
                              onClick={() => handleModerateDelete(item.id)}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded transition cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="bg-rose-950/40 hover:bg-rose-900 border border-rose-900/40 text-rose-400 hover:text-rose-200 p-1.5 rounded transition cursor-pointer"
                            title="Ban Listing (Flag Fraudulent)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "audit" && report && (
            <div className="space-y-4" id="panel-admin-raw-audit-logs">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Historical Audit Logs Trace</h3>
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2 max-h-96 overflow-y-auto font-mono text-[10px]">
                {report.recentLogs?.map((log) => (
                  <div key={log.id} className="border-b border-slate-900/80 pb-2 text-slate-400">
                    <span className="text-sky-400 font-semibold">[{log.id}]</span>{" "}
                    <span className="text-slate-500">{new Date(log.timestamp).toISOString()}</span> -{" "}
                    <span className="text-slate-100 font-bold">{log.action}:</span>{" "}
                    <span className="text-slate-300">{log.details}</span>{" "}
                    {log.userEmail && <span className="text-teal-400">(Actor: {log.userEmail})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
