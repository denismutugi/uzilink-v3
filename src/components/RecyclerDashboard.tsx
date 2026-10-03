import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { ListingItem, UserProfile, MaterialRequestItem } from "../types.js";
import { 
  Recycle, Search, Filter, Bookmark, MessageSquare, Send, Check, 
  MapPin, Scale, Leaf, AlertCircle, RefreshCw, X, Eye, ExternalLink,
  ChevronRight, Heart, DollarSign, Clock, ShieldCheck
} from "lucide-react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface RecyclerDashboardProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onOpenDirectChat?: (partnerId: string, partnerName: string, listingId: string) => void;
}

export const RecyclerDashboard: React.FC<RecyclerDashboardProps> = ({
  user,
  showToast,
  onOpenDirectChat
}) => {
  const [activeTab, setActiveTab] = useState<"materials" | "saved" | "requests">("materials");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [myRequests, setMyRequests] = useState<MaterialRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [onlyNegotiable, setOnlyNegotiable] = useState(false);

  // Listing Detail Modal
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);

  // Request Material Modal
  const [requestModalListing, setRequestModalListing] = useState<ListingItem | null>(null);
  const [requestQuantity, setRequestQuantity] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const categories = [
    "All",
    "Cotton",
    "Denim",
    "Synthetic",
    "Mixed textile",
    "Used clothing",
    "Textile scraps",
    "Industrial textile waste",
    "Fleece"
  ];

  const conditions = [
    "All",
    "Sorted Post-Consumer Waste",
    "Pre-Consumer Factory Offcuts & Scraps",
    "Baled Mitumba / Clothing Waste",
    "Unsorted Mixed Scraps"
  ];

  const loadData = async () => {
    setLoadingListings(true);
    try {
      const res = await api.getListings();
      setListings(res.listings || []);
    } catch (e) {
      showToast("Could not load marketplace listings", "error");
    } finally {
      setLoadingListings(false);
    }

    try {
      const savedRes = await api.getSavedMaterials();
      setSavedListingIds((savedRes.savedItems || []).map((s: any) => s.listingId));
    } catch (e) {}

    setLoadingRequests(true);
    try {
      const reqRes = await api.getRequests();
      setMyRequests(reqRes.requests || []);
    } catch (e) {} finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSave = async (listingId: string) => {
    try {
      const res = await api.toggleSaveMaterial(listingId);
      if (res.saved) {
        setSavedListingIds((prev) => [...prev, listingId]);
      } else {
        setSavedListingIds((prev) => prev.filter((id) => id !== listingId));
      }
      showToast(res.message, "success");
    } catch (e: any) {
      showToast(e.message || "Failed to update saved material", "error");
    }
  };

  const openRequestModal = (listing: ListingItem) => {
    setRequestModalListing(listing);
    setRequestQuantity(String(listing.quantity));
    setOfferedPrice(String(listing.price));
    setRequestMessage(`Hello ${listing.sellerName}, we at ${user.organizationName || user.name} are interested in collecting this ${listing.title} batch for fiber recycling. Please confirm availability and logistics terms.`);
  };

  const handleSubmitMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalListing) return;

    setSubmittingRequest(true);
    try {
      await api.requestMaterial({
        listingId: requestModalListing.id,
        requestedQuantity: Number(requestQuantity) || requestModalListing.quantity,
        offeredPrice: Number(offeredPrice) || requestModalListing.price,
        message: requestMessage
      });

      showToast("Procurement request sent to seller successfully!", "success");
      setRequestModalListing(null);
      const reqRes = await api.getRequests();
      setMyRequests(reqRes.requests || []);
    } catch (err: any) {
      showToast(err.message || "Failed to submit request", "error");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((l) => {
    // Only available listings
    if (l.status === "UNAVAILABLE" || l.status === "SOLD") return false;

    if (selectedCategory !== "All" && l.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    if (selectedCondition !== "All" && !l.condition.toLowerCase().includes(selectedCondition.toLowerCase())) {
      return false;
    }

    if (selectedLocation && !l.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false;
    }

    if (maxPrice && l.price > Number(maxPrice)) {
      return false;
    }

    if (minQuantity && l.quantity < Number(minQuantity)) {
      return false;
    }

    if (onlyNegotiable && !l.negotiable) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        l.title.toLowerCase().includes(q) ||
        l.materialType.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        (l.searchKeywords && l.searchKeywords.some((k) => k.toLowerCase().includes(q)));
      if (!match) return false;
    }

    return true;
  });

  const savedListings = listings.filter((l) => savedListingIds.includes(l.id));

  return (
    <div className="space-y-6">
      {/* Recycler Header */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
            <Recycle className="w-3.5 h-3.5" />
            <span>Recycling Processor Workplace</span>
          </div>
          <h2 className="text-2xl font-extrabold font-['Poppins',sans-serif]">
            Fiber Sourcing & Waste Reclamation
          </h2>
          <p className="text-xs text-teal-100/80 mt-1 max-w-xl">
            Browse verified Kenyan textile waste, connect directly with mitumba sorters and factories, submit procurement offers, and track recycling chain-of-custody.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-teal-200 uppercase font-semibold block">Available Batches</span>
            <span className="text-lg font-bold text-white tabular-nums">{listings.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl text-center border border-white/10">
            <span className="text-[10px] text-teal-200 uppercase font-semibold block">Saved Watchlist</span>
            <span className="text-lg font-bold text-white tabular-nums">{savedListingIds.length}</span>
          </div>
        </div>
      </div>

      {/* Recycler Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab("materials")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "materials" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Available Textile Materials ({filteredListings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "saved" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Saved Materials ({savedListings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-sm font-bold transition relative cursor-pointer font-['Poppins',sans-serif] ${
            activeTab === "requests" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>My Procurement Requests ({myRequests.length})</span>
        </button>
      </div>

      {/* MATERIALS TAB */}
      {activeTab === "materials" && (
        <div className="space-y-6">
          {/* Search & Filters Bar */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by fiber type, title, location, or keywords..."
                  className="w-full bg-stone-50 border border-stone-200 text-xs pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="Location (e.g. Gikomba, Mombasa)"
                  className="w-full bg-stone-50 border border-stone-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-emerald-600 text-slate-800"
                />
              </div>
            </div>

            {/* Sub-Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Condition:</span>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="bg-stone-50 border border-stone-200 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                  >
                    {conditions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Max Price:</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="KSh"
                    className="w-20 bg-stone-50 border border-stone-200 text-xs px-2 py-1.5 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Min Quantity:</span>
                  <input
                    type="number"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    placeholder="kg"
                    className="w-16 bg-stone-50 border border-stone-200 text-xs px-2 py-1.5 rounded-lg"
                  />
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={onlyNegotiable}
                    onChange={(e) => setOnlyNegotiable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Negotiable Only</span>
                </label>
              </div>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedCondition("All");
                  setSelectedLocation("");
                  setMaxPrice("");
                  setMinQuantity("");
                  setOnlyNegotiable(false);
                }}
                className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold cursor-pointer underline"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Grid of Listings */}
          {loadingListings ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Loading available textile waste...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-3xl p-8 bg-stone-50/50">
              <Recycle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No Textile Materials Match Criteria</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try widening your search terms or resetting price and category filters.
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
                      {/* Image & Badges */}
                      <div className="relative h-48 bg-stone-100 overflow-hidden">
                        <img
                          src={resolveImageUrl(item.images && item.images.length > 0 ? item.images[0] : "", item.category, item.materialType)}
                          data-category={item.category}
                          data-material={item.materialType}
                          onError={handleImageFallback}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 px-2.5 py-1 rounded-full border border-stone-200 shadow-xs">
                          {item.category}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSave(item.id)}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xs transition shadow-xs cursor-pointer ${
                            isSaved ? "bg-rose-50 text-rose-600" : "bg-white/90 text-slate-400 hover:text-rose-600"
                          }`}
                          title={isSaved ? "Saved to Watchlist" : "Save Material"}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? "fill-current text-rose-600" : ""}`} />
                        </button>
                      </div>

                      {/* Info Content */}
                      <div className="p-5 space-y-2.5">
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 font-['Poppins',sans-serif]">
                          {item.title}
                        </h4>
                        
                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="font-medium text-slate-700">Material:</span> {item.materialType}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="font-medium text-slate-700">Condition:</span> {item.condition}
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-stone-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Quantity</span>
                            <span className="font-bold text-slate-900">{item.quantity} {item.unit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Location</span>
                            <span className="font-semibold text-slate-700 truncate block">{item.location}</span>
                          </div>
                        </div>

                        {/* Pricing Line */}
                        <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                            <span className="text-base font-extrabold text-emerald-800">
                              KSh {item.price.toLocaleString()}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.negotiable ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-slate-600"
                          }`}>
                            {item.negotiable ? "Negotiable" : "Fixed Price"}
                          </span>
                        </div>

                        {/* Seller Attribution */}
                        <div className="text-[11px] text-slate-400 pt-1">
                          Seller: <span className="font-semibold text-slate-700">{item.sellerName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedListing(item)}
                        className="flex-1 bg-white hover:bg-stone-100 border border-stone-300 text-slate-800 font-bold text-xs py-2 rounded-xl transition text-center cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => openRequestModal(item)}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 rounded-xl transition text-center cursor-pointer"
                      >
                        Request Material
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SAVED MATERIALS TAB */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
            Your Saved Sourcing Watchlist ({savedListings.length})
          </h3>

          {savedListings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-stone-200 rounded-3xl p-8 bg-stone-50/50">
              <Heart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No Saved Materials</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bookmark listings from the marketplace to track prices and initiate batch requests quickly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedListings.map((item) => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-3xl overflow-hidden p-5 space-y-3">
                  <div className="h-36 rounded-2xl overflow-hidden bg-stone-100">
                    <img 
                      src={resolveImageUrl(item.images?.[0] || item.imageUrl, item.category, item.materialType)} 
                      data-category={item.category}
                      data-material={item.materialType}
                      onError={handleImageFallback}
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                  <div className="text-xs text-slate-500">{item.quantity} {item.unit} • {item.location}</div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                    <span className="font-extrabold text-sm text-emerald-800">KSh {item.price.toLocaleString()}</span>
                    <button
                      onClick={() => openRequestModal(item)}
                      className="bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                    >
                      Request Batch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROCUREMENT REQUESTS TAB */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-['Poppins',sans-serif]">
            Your Submitted Procurement Requests ({myRequests.length})
          </h3>

          {loadingRequests ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading your requests...</div>
          ) : myRequests.length === 0 ? (
            <div className="py-12 text-center border border-stone-200 rounded-3xl bg-stone-50 p-6 text-xs text-slate-500">
              You haven't submitted any procurement requests yet. Use "Request Material" on any listing to begin negotiations.
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.listingTitle}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : req.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Your message: "{req.message}"</p>
                    <div className="text-xs text-emerald-800 font-bold">
                      Requested: {req.requestedQuantity} • Offered Price: KSh {req.offeredPrice.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenDirectChat && (
                      <button
                        onClick={() => onOpenDirectChat(req.sellerId, "Seller", req.listingId)}
                        className="bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Seller</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                  {selectedListing.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-['Poppins',sans-serif] mt-1.5">
                  {selectedListing.title}
                </h3>
                <span className="text-xs text-slate-500">
                  Seller: <span className="font-semibold text-slate-800">{selectedListing.sellerName}</span> • {selectedListing.location}
                </span>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-2 gap-3">
              {selectedListing.images.map((img, i) => (
                <div key={i} className="h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img 
                    src={resolveImageUrl(img, selectedListing.category, selectedListing.materialType)} 
                    data-category={selectedListing.category}
                    data-material={selectedListing.materialType}
                    onError={handleImageFallback}
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>

            {/* Technical Specifications */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Material</span>
                <span className="font-bold text-slate-900">{selectedListing.materialType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Quantity</span>
                <span className="font-bold text-slate-900">{selectedListing.quantity} {selectedListing.unit}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Condition</span>
                <span className="font-bold text-slate-900">{selectedListing.condition}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                <span className="font-bold text-emerald-800 text-sm">
                  KSh {selectedListing.price.toLocaleString()} ({selectedListing.negotiable ? "Negotiable" : "Fixed"})
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-900 text-xs uppercase">Description & Sorting Notes</h4>
              <p>{selectedListing.description}</p>
            </div>

            {/* Recommended Industries */}
            {selectedListing.recommendedIndustries && (
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-900 uppercase">Recommended Recycling Applications</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.recommendedIndustries.map((ind, idx) => (
                    <span key={idx} className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              {onOpenDirectChat && (
                <button
                  onClick={() => {
                    onOpenDirectChat(selectedListing.sellerId, selectedListing.sellerName, selectedListing.id);
                    setSelectedListing(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-stone-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Seller</span>
                </button>
              )}
              <button
                onClick={() => {
                  const target = selectedListing;
                  setSelectedListing(null);
                  openRequestModal(target);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Request Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MATERIAL MODAL */}
      {requestModalListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-['Poppins',sans-serif]">
                  Request Material Quotation
                </h3>
                <span className="text-xs text-slate-500">
                  Listing: <span className="font-semibold text-slate-800">{requestModalListing.title}</span>
                </span>
              </div>
              <button
                onClick={() => setRequestModalListing(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaterialRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Requested Quantity ({requestModalListing.unit}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    className="w-full bg-white border border-stone-300 p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Offered Price (KSh) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="w-full bg-white border border-stone-300 p-2.5 rounded-xl font-bold text-emerald-800"
                  />
                  {requestModalListing.negotiable ? (
                    <span className="text-[10px] text-emerald-700 block">Seller accepts negotiations</span>
                  ) : (
                    <span className="text-[10px] text-amber-700 block">Seller marked price as fixed</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Message & Collection Terms</label>
                <textarea
                  rows={3}
                  required
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full bg-white border border-stone-300 p-2.5 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRequestModalListing(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {submittingRequest ? "Sending Offer..." : "Submit Material Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
