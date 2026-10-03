import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { ListingItem, UserProfile, MaterialRequestItem } from "../types.js";
import { 
  Factory, Search, Filter, Bookmark, MessageSquare, Send, Check, 
  MapPin, Scale, Layers, ChevronRight, X, Heart, Shield, Cpu,
  SlidersHorizontal, CheckCircle2, Building, RefreshCw, Eye
} from "lucide-react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface ManufacturerDashboardProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onOpenDirectChat?: (partnerId: string, partnerName: string, listingId: string) => void;
}

export const ManufacturerDashboard: React.FC<ManufacturerDashboardProps> = ({
  user,
  showToast,
  onOpenDirectChat
}) => {
  const [activeTab, setActiveTab] = useState<"sourcing" | "watchlist" | "procurements">("sourcing");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<MaterialRequestItem[]>([]);

  // Sourcing Filters
  const [searchMaterial, setSearchMaterial] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minBatchQty, setMinBatchQty] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [priceCap, setPriceCap] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");

  // Inspect Modal
  const [inspectListing, setInspectListing] = useState<ListingItem | null>(null);

  // Sourcing Order Modal
  const [orderModalListing, setOrderModalListing] = useState<ListingItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [contractSpecs, setContractSpecs] = useState("");
  const [sendingOrder, setSendingOrder] = useState(false);

  const categories = [
    "All",
    "Cotton",
    "Denim",
    "Synthetic",
    "Mixed textile",
    "Industrial textile waste",
    "Textile scraps",
    "Fleece"
  ];

  const loadData = async () => {
    setLoadingListings(true);
    try {
      const res = await api.getListings();
      setListings(res.listings || []);
    } catch (e) {
      showToast("Failed to load materials feed", "error");
    } finally {
      setLoadingListings(false);
    }

    try {
      const savedRes = await api.getSavedMaterials();
      setSavedListingIds((savedRes.savedItems || []).map((s: any) => s.listingId));
    } catch (e) {}

    try {
      const reqRes = await api.getRequests();
      setOrders(reqRes.requests || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleWatchlist = async (listingId: string) => {
    try {
      const res = await api.toggleSaveMaterial(listingId);
      if (res.saved) {
        setSavedListingIds((prev) => [...prev, listingId]);
      } else {
        setSavedListingIds((prev) => prev.filter((id) => id !== listingId));
      }
      showToast(res.message, "success");
    } catch (e: any) {
      showToast(e.message || "Watchlist update failed", "error");
    }
  };

  const openOrderModal = (listing: ListingItem) => {
    setOrderModalListing(listing);
    setOrderQuantity(String(listing.quantity));
    setProposedPrice(String(listing.price));
    setContractSpecs(`Industrial Procurement PO from ${user.organizationName || user.name}.\nIntended Use: Circular manufacturing feedstock.\nDelivery/Collection: Ex-Warehouse inspection requested.`);
  };

  const handleSendProcurementOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalListing) return;

    setSendingOrder(true);
    try {
      await api.requestMaterial({
        listingId: orderModalListing.id,
        requestedQuantity: Number(orderQuantity) || orderModalListing.quantity,
        offeredPrice: Number(proposedPrice) || orderModalListing.price,
        message: contractSpecs
      });

      showToast("Industrial procurement order transmitted to supplier!", "success");
      setOrderModalListing(null);
      const reqRes = await api.getRequests();
      setOrders(reqRes.requests || []);
    } catch (err: any) {
      showToast(err.message || "Failed to submit procurement order", "error");
    } finally {
      setSendingOrder(false);
    }
  };

  // Filter logic
  const filteredListings = listings.filter((l) => {
    if (l.status === "UNAVAILABLE" || l.status === "SOLD") return false;

    if (categoryFilter !== "All" && l.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    if (conditionFilter !== "All" && !l.condition.toLowerCase().includes(conditionFilter.toLowerCase())) {
      return false;
    }

    if (targetLocation && !l.location.toLowerCase().includes(targetLocation.toLowerCase())) {
      return false;
    }

    if (priceCap && l.price > Number(priceCap)) {
      return false;
    }

    if (minBatchQty && l.quantity < Number(minBatchQty)) {
      return false;
    }

    if (searchMaterial) {
      const q = searchMaterial.toLowerCase();
      const match =
        l.materialType.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.searchKeywords && l.searchKeywords.some((k) => k.toLowerCase().includes(q)));
      if (!match) return false;
    }

    return true;
  });

  const watchlistListings = listings.filter((l) => savedListingIds.includes(l.id));

  return (
    <div className="space-y-6">
      {/* Manufacturer Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-2">
            <Factory className="w-3.5 h-3.5" />
            <span>Industrial Manufacturing & Mills Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold font-['Poppins',sans-serif]">
            Industrial Secondary Fiber Sourcing
          </h2>
          <p className="text-xs text-sky-100/80 mt-1 max-w-xl">
            Source high-grade pre/post-consumer textile feedstocks for yarn spinning, non-woven felting, acoustic insulation, and eco-textile product lines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-sky-200 uppercase font-semibold block">Feedstock Lots</span>
            <span className="text-lg font-bold text-white tabular-nums">{listings.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-sky-200 uppercase font-semibold block">Active POs</span>
            <span className="text-lg font-bold text-white tabular-nums">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("sourcing")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "sourcing" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Materials Marketplace ({filteredListings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "watchlist" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Sourcing Watchlist ({watchlistListings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("procurements")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "procurements" ? "text-sky-700 border-b-2 border-sky-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Procurement Orders ({orders.length})</span>
        </button>
      </div>

      {/* SOURCING MARKETPLACE */}
      {activeTab === "sourcing" && (
        <div className="space-y-6">
          {/* Engineering Filters */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                  placeholder="Filter by raw material composition (e.g. Cotton, Poly, PET)..."
                  className="w-full bg-stone-50 border border-stone-200 text-xs pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-sky-600 text-slate-800"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-sky-600 text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === "All" ? "All Fiber Classes" : c}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  value={minBatchQty}
                  onChange={(e) => setMinBatchQty(e.target.value)}
                  placeholder="Min Batch Qty (kg)"
                  className="w-full bg-stone-50 border border-stone-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-sky-600"
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  value={priceCap}
                  onChange={(e) => setPriceCap(e.target.value)}
                  placeholder="Max Price (KSh)"
                  className="w-full bg-stone-50 border border-stone-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-sky-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-semibold">Location / Depot:</span>
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="e.g. Nairobi, Mombasa, Eldoret"
                  className="bg-stone-50 border border-stone-200 text-xs px-3 py-1.5 rounded-lg outline-none"
                />
              </div>

              <button
                onClick={() => {
                  setSearchMaterial("");
                  setCategoryFilter("All");
                  setMinBatchQty("");
                  setPriceCap("");
                  setTargetLocation("");
                }}
                className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline cursor-pointer"
              >
                Clear Sourcing Filters
              </button>
            </div>
          </div>

          {/* Sourcing Grid */}
          {loadingListings ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Querying industrial textile feedstocks...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-3xl p-8 bg-stone-50/50">
              <Factory className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No Industrial Materials Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Adjust your quantity thresholds or fiber specifications to view available stock.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => {
                const isSaved = savedListingIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo and Category */}
                      <div className="relative h-48 bg-stone-100 overflow-hidden">
                        <img
                          src={resolveImageUrl(item.images && item.images.length > 0 ? item.images[0] : "", item.category, item.materialType)}
                          data-category={item.category}
                          data-material={item.materialType}
                          onError={handleImageFallback}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                          {item.category}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleWatchlist(item.id)}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xs transition shadow-xs cursor-pointer ${
                            isSaved ? "bg-sky-50 text-sky-600" : "bg-white/90 text-slate-400 hover:text-sky-600"
                          }`}
                          title="Save to Watchlist"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current text-sky-600" : ""}`} />
                        </button>
                      </div>

                      {/* Manufacturing Specs */}
                      <div className="p-5 space-y-3">
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 font-['Poppins',sans-serif]">
                          {item.title}
                        </h4>

                        <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-2.5 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Fiber Composition:</span>
                            <span className="font-bold text-slate-900 text-right">{item.materialType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Feedstock Grade:</span>
                            <span className="font-semibold text-sky-900">{item.condition}</span>
                          </div>
                        </div>

                        {/* Batch metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="bg-stone-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Available Batch</span>
                            <span className="font-extrabold text-slate-900 text-sm">{item.quantity} {item.unit}</span>
                          </div>
                          <div className="bg-stone-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Depot</span>
                            <span className="font-semibold text-slate-800 text-xs truncate block">{item.location}</span>
                          </div>
                        </div>

                        {/* Commercials */}
                        <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Valuation</span>
                            <span className="text-base font-extrabold text-sky-900">
                              KSh {item.price.toLocaleString()}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.negotiable ? "bg-sky-100 text-sky-800" : "bg-stone-100 text-slate-600"
                          }`}>
                            {item.negotiable ? "Negotiable Terms" : "Fixed Quote"}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          Supplier: <span className="font-semibold text-slate-700">{item.sellerName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Manufacturing Actions */}
                    <div className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center gap-2">
                      <button
                        onClick={() => setInspectListing(item)}
                        className="flex-1 bg-white hover:bg-stone-100 border border-stone-300 text-slate-800 font-bold text-xs py-2 rounded-xl transition text-center cursor-pointer"
                      >
                        Inspect Specs
                      </button>
                      <button
                        onClick={() => openOrderModal(item)}
                        className="flex-1 bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs py-2 rounded-xl transition text-center cursor-pointer"
                      >
                        Request Batch
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WATCHLIST TAB */}
      {activeTab === "watchlist" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
            Your Manufacturing Sourcing Watchlist ({watchlistListings.length})
          </h3>

          {watchlistListings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-3xl p-8 bg-stone-50/50">
              <Bookmark className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Watchlist Empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bookmark feedstock batches from the marketplace to track continuous supply.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlistListings.map((item) => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3">
                  <div className="h-36 rounded-2xl overflow-hidden bg-stone-100">
                    <img 
                      src={resolveImageUrl(item.images && item.images.length > 0 ? item.images[0] : "", item.category, item.materialType)} 
                      data-category={item.category}
                      data-material={item.materialType}
                      onError={handleImageFallback}
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                  <div className="text-xs text-slate-600">{item.materialType} • {item.quantity} {item.unit}</div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                    <span className="font-extrabold text-sm text-sky-900">KSh {item.price.toLocaleString()}</span>
                    <button
                      onClick={() => openOrderModal(item)}
                      className="bg-sky-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                    >
                      Issue PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROCUREMENTS TAB */}
      {activeTab === "procurements" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
            Active Sourcing Purchase Orders ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <div className="py-12 text-center border border-stone-200 rounded-3xl bg-stone-50 p-6 text-xs text-slate-500">
              No procurement purchase orders initiated yet. Use "Request Batch" on any material listing to send procurement specs.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((po) => (
                <div key={po.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{po.listingTitle}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        po.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : po.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Procurement Volume: <span className="font-bold text-slate-900">{po.requestedQuantity}</span> • Proposed Amount: <span className="font-bold text-sky-900">KSh {po.offeredPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 italic">PO Notes: "{po.message}"</p>
                  </div>

                  {onOpenDirectChat && (
                    <button
                      onClick={() => onOpenDirectChat(po.sellerId, "Supplier", po.listingId)}
                      className="bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact Supplier</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECT MODAL */}
      {inspectListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full uppercase">
                  Industrial Specification Sheet
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif] mt-1.5">
                  {inspectListing.title}
                </h3>
                <span className="text-xs text-slate-500">
                  Supplier: {inspectListing.sellerName} • {inspectListing.location}
                </span>
              </div>
              <button onClick={() => setInspectListing(null)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {inspectListing.images.map((img, idx) => (
                <div key={idx} className="h-40 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img 
                    src={resolveImageUrl(img, inspectListing.category, inspectListing.materialType)} 
                    data-category={inspectListing.category}
                    data-material={inspectListing.materialType}
                    onError={handleImageFallback}
                    alt={inspectListing.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>

            <div className="bg-sky-50/50 border border-sky-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Composition</span>
                <span className="font-bold text-slate-900">{inspectListing.materialType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Batch Volume</span>
                <span className="font-bold text-slate-900">{inspectListing.quantity} {inspectListing.unit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Sorting Grade</span>
                <span className="font-bold text-slate-900">{inspectListing.condition}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Price</span>
                <span className="font-bold text-sky-900 text-sm">KSh {inspectListing.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 uppercase">Description & Industrial Quality Notes</h4>
              <p className="leading-relaxed">{inspectListing.description}</p>
            </div>

            {inspectListing.recommendedIndustries && (
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-900 uppercase">Compatible Manufacturing Sectors</h4>
                <div className="flex flex-wrap gap-2">
                  {inspectListing.recommendedIndustries.map((ind, i) => (
                    <span key={i} className="bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              {onOpenDirectChat && (
                <button
                  onClick={() => {
                    onOpenDirectChat(inspectListing.sellerId, inspectListing.sellerName, inspectListing.id);
                    setInspectListing(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-stone-100 rounded-xl"
                >
                  Contact Supplier
                </button>
              )}
              <button
                onClick={() => {
                  const target = inspectListing;
                  setInspectListing(null);
                  openOrderModal(target);
                }}
                className="bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Request Batch Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOURCING ORDER MODAL */}
      {orderModalListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-['Poppins',sans-serif]">
                  Industrial Feedstock Purchase Order
                </h3>
                <span className="text-xs text-slate-500">
                  Target Batch: <span className="font-semibold text-slate-800">{orderModalListing.title}</span>
                </span>
              </div>
              <button onClick={() => setOrderModalListing(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendProcurementOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Procurement Volume ({orderModalListing.unit}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    className="w-full bg-white border border-stone-300 p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Proposed PO Valuation (KSh) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="w-full bg-white border border-stone-300 p-2.5 rounded-xl font-bold text-sky-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Procurement Specifications & Delivery Terms</label>
                <textarea
                  rows={3}
                  required
                  value={contractSpecs}
                  onChange={(e) => setContractSpecs(e.target.value)}
                  className="w-full bg-white border border-stone-300 p-2.5 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setOrderModalListing(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingOrder}
                  className="bg-sky-800 hover:bg-sky-900 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {sendingOrder ? "Submitting..." : "Send Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
