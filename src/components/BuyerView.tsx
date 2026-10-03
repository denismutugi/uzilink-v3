import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { ListingItem, UserProfile } from "../types.js";
import { Search, MapPin, Scale, Leaf, Heart, ArrowRight, ShieldCheck, HelpCircle, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface BuyerViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  listings: ListingItem[];
  onRefresh: () => void;
  openContactPartner: (partnerId: string, partnerName: string, listingId: string) => void;
}

export const BuyerView: React.FC<BuyerViewProps> = ({ 
  user, 
  showToast, 
  listings: initialListings, 
  onRefresh,
  openContactPartner
}) => {
  const [listings, setListings] = useState<ListingItem[]>(initialListings);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState("");
  const [location, setLocation] = useState("");
  const [minRecyclability, setMinRecyclability] = useState("0");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Saved listings storage
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

  // Selected Listing Detail Popup
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  
  // Quotation Submission Drawer
  const [bidMessage, setBidMessage] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  // Fetch / Query filtered list
  const applyFilters = async () => {
    setLoading(true);
    try {
      const response = await api.getListings({
        search,
        material,
        location,
        minRecyclability: Number(minRecyclability),
        maxPrice: maxPrice ? Number(maxPrice) : "",
        condition
      });
      setListings(response.listings);
    } catch (e: any) {
      showToast("Failed to apply filters.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [search, material, location, minRecyclability, maxPrice, condition]);

  // Load Saved Listings list
  useEffect(() => {
    const saved = localStorage.getItem(`saved_listings_${user.id}`);
    if (saved) {
      setSavedListingIds(JSON.parse(saved));
    }
  }, [user.id]);

  const toggleSaveListing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (savedListingIds.includes(id)) {
      updated = savedListingIds.filter(item => item !== id);
      showToast("Listing removed from favorites", "info");
    } else {
      updated = [...savedListingIds, id];
      showToast("Listing saved to favorites!", "success");
    }
    setSavedListingIds(updated);
    localStorage.setItem(`saved_listings_${user.id}`, JSON.stringify(updated));
  };

  const handleQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !bidMessage) return;
    setSubmittingBid(true);

    try {
      await api.requestQuotation({
        listingId: selectedListing.id,
        message: bidMessage
      });
      showToast("Quotation request sent to seller!", "success");
      setBidMessage("");
      setSelectedListing(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Quotation submittal failed", "error");
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <div className="space-y-6" id="buyer-page-wrapper">
      {/* Search and Filters Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by material fabric, composition, location or keywords..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-400 text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition"
              id="buyer-search-input"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 rounded-xl border font-semibold flex items-center gap-2 cursor-pointer transition text-xs ${
              showFilters ? "bg-teal-950/40 text-teal-300 border-teal-800" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            id="btn-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filters Panel Expansion */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800/80 overflow-hidden"
              id="expanded-filters-panel"
            >
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Fabric Composition</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 outline-none"
                >
                  <option value="">All Materials</option>
                  <option value="Cotton">Pure Cotton</option>
                  <option value="Denim">Recycled Denim</option>
                  <option value="Polyester">Polyester (Synthetic)</option>
                  <option value="Fleece">Fleece Fabrics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Location Base</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mombasa"
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Min Recyclability</label>
                <select
                  value={minRecyclability}
                  onChange={(e) => setMinRecyclability(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 outline-none"
                >
                  <option value="0">Any Score</option>
                  <option value="50">50% + (Intermediate)</option>
                  <option value="75">75% + (Pure Monomaterial)</option>
                  <option value="90">90% + (Highly Recyclable)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Max Budget (KES)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2.5 outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Querying marketplace records...</div>
      ) : listings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No matching textile waste batches found. Try broadening your query!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="buyer-listings-grid">
          {listings.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedListing(item)}
              className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group cursor-pointer transition relative"
              id={`listing-card-${item.id}`}
            >
              {/* Image Section */}
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={resolveImageUrl((item as any).images?.[0] || item.imageUrl, (item as any).category, (item as any).materialType || item.material)}
                  data-category={(item as any).category}
                  data-material={(item as any).materialType || item.material}
                  alt={item.fabricType}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={handleImageFallback}
                />
                
                {/* Floating Tags */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  <span className="bg-teal-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    RECYCLABILITY: {item.recyclabilityScore}%
                  </span>
                  {item.status === "SOLD" && (
                    <span className="bg-blue-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                      SOLD
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => toggleSaveListing(item.id, e)}
                  className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full transition"
                  title="Bookmark"
                >
                  <Heart className={`w-4 h-4 ${savedListingIds.includes(item.id) ? "fill-red-500 text-red-500" : "text-white/80"}`} />
                </button>

                {/* Foot indicators */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 shadow-sm">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  -{item.carbonSavingsKg} Kg CO2
                </div>
              </div>

              {/* Text Area */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-teal-400 transition truncate">{item.fabricType}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> {item.weightKg} Kg</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.location.split(",")[0]}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-teal-400 font-black text-base">
                      KES {item.estimatedPriceKES?.toLocaleString()}
                    </span>
                    <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-1 border border-slate-800/80 rounded font-bold uppercase truncate max-w-28" title={item.material}>
                      {item.material.split(" ")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Popup Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative block"
              id="buyer-detail-modal"
            >
              {/* Modal Body Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 md:h-full bg-slate-950 border-r border-slate-800/50">
                  <img
                    src={resolveImageUrl((selectedListing as any).images?.[0] || selectedListing.imageUrl, (selectedListing as any).category, (selectedListing as any).materialType || selectedListing.material)}
                    data-category={(selectedListing as any).category}
                    data-material={(selectedListing as any).materialType || selectedListing.material}
                    alt={selectedListing.fabricType}
                    className="w-full h-full object-cover"
                    onError={handleImageFallback}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-5">
                    <h3 className="text-xl font-black text-white">{selectedListing.fabricType}</h3>
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-1">
                      <Leaf className="w-4 h-4 text-emerald-400" />
                      Saving approx {selectedListing.carbonSavingsKg} kg in carbon outputs
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] px-2.5 py-1 rounded font-bold uppercase">
                        RECYCLABILITY: {selectedListing.recyclabilityScore}%
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="text-slate-500 hover:text-slate-300 font-semibold text-xs"
                      id="modal-close"
                    >
                      Close [X]
                    </button>
                  </div>

                  <div className="space-y-3">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Description & composition</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">{selectedListing.description}</p>
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 grid grid-cols-2 gap-2 font-medium">
                      <span>• Composition: <strong className="text-white">{selectedListing.material}</strong></span>
                      <span>• Condition: <strong className="text-white">{selectedListing.condition}</strong></span>
                      <span>• Weight: <strong className="text-white">{selectedListing.weightKg} Kg</strong></span>
                      <span>• Color palette: <strong className="text-white">{selectedListing.color}</strong></span>
                    </div>
                  </div>

                  {/* Recommendation and Upcycles */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Recommended Upcycling Actions</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedListing.upcyclingIdeas?.map((idea, i) => (
                          <span key={i} className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-1 rounded">
                            {idea}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-800/80 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-slate-500 text-[9px]">Sellers Valuation estimate</span>
                          <div className="text-xl font-bold text-teal-400">KES {selectedListing.estimatedPriceKES?.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[9px]">Location Base</span>
                          <div className="text-sm font-bold text-white uppercase">{selectedListing.location.split(",")[0]}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit quotation bid action form */}
                  {selectedListing.status !== "SOLD" && selectedListing.sellerId !== user.id && (
                    <form onSubmit={handleQuotationSubmit} className="border-t border-slate-800/80 pt-4 space-y-3">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Request Quotation / Submit Bid Terms</span>
                      <textarea
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        placeholder="Hi! State your purchase price proposal, pickup logistics, and payment terms..."
                        required
                        className="w-full min-h-[70px] bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-200 text-xs p-2.5 rounded-xl outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedListing(null);
                            openContactPartner(selectedListing.sellerId, selectedListing.sellerName || "Seller", selectedListing.id);
                          }}
                          className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Send Message
                        </button>
                        <button
                          type="submit"
                          disabled={submittingBid || !bidMessage}
                          className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          Submit Bid Offer
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
