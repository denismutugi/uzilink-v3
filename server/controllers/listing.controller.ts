import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { db, Listing, BuyerRequest } from "../db.js";
import { generateAiListing, AiListingGenerationInput } from "../services/ai.service.js";

/**
 * Fetch centralized listings with comprehensive marketplace filtering
 * (Category, Material, Condition, Location, Price, Negotiable, Quantity, Search query)
 */
export async function getListings(req: AuthenticatedRequest, res: Response) {
  try {
    let listings = db.getListings();

    const { 
      category, 
      material, 
      condition, 
      location, 
      minPrice, 
      maxPrice, 
      negotiable, 
      minQuantity, 
      maxQuantity, 
      search, 
      sellerId, 
      allStatuses 
    } = req.query;

    // Filter by seller ID if looking at personal portfolio
    if (sellerId) {
      listings = listings.filter((l) => l.sellerId === String(sellerId));
    } else if (allStatuses !== "true") {
      // Marketplace defaults to only AVAILABLE listings
      listings = listings.filter((l) => l.status === "AVAILABLE" || l.status === "PENDING");
    }

    if (category && category !== "All") {
      listings = listings.filter((l) => l.category.toLowerCase() === String(category).toLowerCase());
    }

    if (material) {
      const matStr = String(material).toLowerCase();
      listings = listings.filter((l) => 
        (l.materialType && l.materialType.toLowerCase().includes(matStr)) ||
        (l.title && l.title.toLowerCase().includes(matStr))
      );
    }

    if (condition && condition !== "All") {
      const condStr = String(condition).toLowerCase();
      listings = listings.filter((l) => l.condition.toLowerCase().includes(condStr));
    }

    if (location) {
      const locStr = String(location).toLowerCase();
      listings = listings.filter((l) => l.location.toLowerCase().includes(locStr));
    }

    if (minPrice) {
      listings = listings.filter((l) => l.price >= Number(minPrice));
    }

    if (maxPrice) {
      listings = listings.filter((l) => l.price <= Number(maxPrice));
    }

    if (negotiable !== undefined && negotiable !== "") {
      const isNeg = String(negotiable) === "true";
      listings = listings.filter((l) => l.negotiable === isNeg);
    }

    if (minQuantity) {
      listings = listings.filter((l) => l.quantity >= Number(minQuantity));
    }

    if (maxQuantity) {
      listings = listings.filter((l) => l.quantity <= Number(maxQuantity));
    }

    if (search) {
      const query = String(search).toLowerCase();
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          (l.materialType && l.materialType.toLowerCase().includes(query)) ||
          l.category.toLowerCase().includes(query) ||
          l.location.toLowerCase().includes(query) ||
          (l.searchKeywords && l.searchKeywords.some((k) => k.toLowerCase().includes(query)))
      );
    }

    return res.json({ listings });
  } catch (error) {
    console.error("Listings query error:", error);
    return res.status(500).json({ message: "Failed to query Listings database" });
  }
}

/**
 * Retrieve one listing details & increments view count
 */
export async function getListingById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const listing = db.getListingById(id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    db.updateListing(id, { viewsCount: (listing.viewsCount || 0) + 1 });
    return res.json({ listing: db.getListingById(id) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load listing details" });
  }
}

/**
 * Generate Listing with AI Assistant
 * STRICT RULE: AI NEVER determines the price. Pricing is strictly controlled by the seller.
 */
export async function generateAiListingController(req: AuthenticatedRequest, res: Response) {
  try {
    const { textileType, material, condition, quantity, unit, color, intendedUse, notes, imageB64, mimeType } = req.body;

    const result = await generateAiListing({
      textileType,
      material,
      condition,
      quantity: quantity ? Number(quantity) : undefined,
      unit,
      color,
      intendedUse,
      notes,
      imageB64,
      mimeType
    });

    return res.json({ listingSuggestion: result });
  } catch (error: any) {
    console.error("AI Listing generation failed:", error);
    return res.status(500).json({ message: error.message || "Failed to generate AI listing" });
  }
}

/**
 * Create listing with strict validation
 * Sellers explicitly provide: Price: KSh [user input] & Negotiable: Yes/No
 */
export async function createListing(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const {
      title,
      description,
      category,
      materialType,
      condition,
      quantity,
      unit,
      location,
      price,
      currency,
      negotiable,
      images,
      searchKeywords,
      carbonSavingsKg,
      recyclabilityScore,
      recommendedIndustries,
      upcyclingIdeas,
      status
    } = req.body;

    // STEP 14 Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: "Please provide a valid listing title (at least 3 characters)" });
    }

    if (!category) {
      return res.status(400).json({ message: "Please select a textile category" });
    }

    if (!materialType) {
      return res.status(400).json({ message: "Please specify the material type" });
    }

    if (!condition) {
      return res.status(400).json({ message: "Please describe the material condition" });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a valid positive number" });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ message: "Price must be a valid positive number in KSh" });
    }

    if (typeof negotiable !== "boolean") {
      return res.status(400).json({ message: "Please explicitly specify if the price is negotiable (Yes/No)" });
    }

    if (!location || location.trim().length === 0) {
      return res.status(400).json({ message: "Please specify the material location in Kenya" });
    }

    const finalImages = Array.isArray(images) && images.length > 0 
      ? images 
      : ["/assets/images/hero_kenyan_textile_1790988200150.jpg"];

    const newListing: Listing = {
      id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sellerId: user.id,
      sellerName: user.name || "Kenyan Textile Trader",
      sellerLocation: location,
      sellerEmail: user.email,
      title: title.trim(),
      description: description ? description.trim() : "Circular textile batch available for industrial recycling or upcycling.",
      category: category.trim(),
      materialType: materialType.trim(),
      condition: condition.trim(),
      quantity: numQuantity,
      unit: unit || "kg",
      location: location.trim(),
      price: numPrice,
      currency: "KSh",
      negotiable: Boolean(negotiable),
      images: finalImages,
      status: (status as any) || "AVAILABLE",
      searchKeywords: Array.isArray(searchKeywords) ? searchKeywords : [category.toLowerCase()],
      carbonSavingsKg: Number(carbonSavingsKg) || Math.round(numQuantity * 2.8),
      recyclabilityScore: Number(recyclabilityScore) || 85,
      recommendedIndustries: Array.isArray(recommendedIndustries) ? recommendedIndustries : ["Textile Recycling", "Industrial Absorbents"],
      upcyclingIdeas: Array.isArray(upcyclingIdeas) ? upcyclingIdeas : ["Regenerated yarn", "Insulation batts"],
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Backward compatibility aliases
      weightKg: numQuantity,
      imageUrl: finalImages[0],
      fabricType: category,
      material: materialType,
      estimatedPriceKES: numPrice
    };

    db.addListing(newListing);
    return res.status(201).json({ listing: newListing, message: "Your listing has been published successfully." });
  } catch (error: any) {
    console.error("Listing creation failed:", error);
    return res.status(500).json({ message: error.message || "Failed to create listing" });
  }
}

/**
 * Update listing
 * If seller updates price, quantity, status, images or negotiability, updates sync across all interfaces.
 */
export async function updateListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const existing = db.getListingById(id);
    if (!existing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (existing.sellerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: You cannot modify another seller's listing" });
    }

    const updates = req.body;
    if (updates.price !== undefined) {
      const p = Number(updates.price);
      if (isNaN(p) || p < 0) return res.status(400).json({ message: "Price must be a positive number" });
      updates.price = p;
      updates.estimatedPriceKES = p;
    }

    if (updates.quantity !== undefined) {
      const q = Number(updates.quantity);
      if (isNaN(q) || q <= 0) return res.status(400).json({ message: "Quantity must be a positive number" });
      updates.quantity = q;
      updates.weightKg = q;
      updates.carbonSavingsKg = Math.round(q * 2.8);
    }

    db.updateListing(id, updates);
    const updated = db.getListingById(id);
    return res.json({ listing: updated, message: "Listing updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to update listing" });
  }
}

/**
 * Delete listing
 */
export async function deleteListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const existing = db.getListingById(id);
    if (!existing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (existing.sellerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: You cannot delete another seller's listing" });
    }

    db.deleteListing(id);
    return res.json({ message: "Listing deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to delete listing" });
  }
}

/**
 * Submit material procurement request (Quotation inquiry / order)
 */
export async function requestQuotation(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { listingId, requestedQuantity, offeredPrice, message } = req.body;

    const listing = db.getListingById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Target textile material listing not found" });
    }

    const newRequest: BuyerRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      buyerId: user.id,
      buyerName: user.name,
      buyerRole: user.role,
      buyerEmail: user.email,
      sellerId: listing.sellerId,
      listingId: listing.id,
      listingTitle: listing.title,
      requestedQuantity: Number(requestedQuantity) || listing.quantity,
      offeredPrice: Number(offeredPrice) || listing.price,
      message: message ? message.trim() : `Material request for ${listing.title}`,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    db.addBuyerRequest(newRequest);

    // Notify seller
    db.addNotification({
      id: `notif-${Date.now()}`,
      userId: listing.sellerId,
      title: "New Material Procurement Request",
      message: `${user.name} (${user.role}) submitted an inquiry for "${listing.title}". Offered: KSh ${newRequest.offeredPrice}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ request: newRequest, message: "Material request submitted successfully to the seller." });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to submit request" });
  }
}

/**
 * Fetch buyer requests / seller inquiries
 */
export async function getBuyerRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const all = db.getBuyerRequests();
    let filtered = all;

    if (user.role === "SELLER") {
      filtered = all.filter((r) => r.sellerId === user.id);
    } else if (user.role === "RECYCLER" || user.role === "MANUFACTURER") {
      filtered = all.filter((r) => r.buyerId === user.id);
    }

    return res.json({ requests: filtered });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load requests" });
  }
}

/**
 * Update request status (Accept / Decline)
 */
export async function updateRequestStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!["PENDING", "ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({ message: "Invalid request status" });
    }

    const reqs = db.getBuyerRequests();
    const target = reqs.find((r) => r.id === id);
    if (!target) return res.status(404).json({ message: "Request not found" });

    if (target.sellerId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    db.updateBuyerRequest(id, status as any);

    // If accepted, notify the buyer
    db.addNotification({
      id: `notif-${Date.now()}`,
      userId: target.buyerId,
      title: status === "ACCEPTED" ? "Material Request Accepted!" : "Material Request Update",
      message: `Seller ${user.name} has ${status.toLowerCase()} your request for "${target.listingTitle}".`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: `Request status marked as ${status}` });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to update request" });
  }
}

/**
 * Saved Materials Handlers
 */
export async function getSavedMaterials(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const saved = db.getSavedMaterials(user.id);
    const listingIds = saved.map((s) => s.listingId);
    const listings = db.getListings().filter((l) => listingIds.includes(l.id));

    return res.json({ savedListings: listings, savedItems: saved });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load saved materials" });
  }
}

export async function toggleSaveMaterial(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { listingId } = req.body;
    const existing = db.getSavedMaterials(user.id).find((s) => s.listingId === listingId);

    if (existing) {
      db.removeSavedMaterial(user.id, listingId);
      return res.json({ saved: false, message: "Removed from saved materials" });
    } else {
      db.addSavedMaterial(user.id, listingId);
      return res.json({ saved: true, message: "Saved to your circular sourcing watchlist" });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Failed to update saved material" });
  }
}

/**
 * EPR regulatory tracking records
 */
export async function getEprRecordsController(req: AuthenticatedRequest, res: Response) {
  try {
    const records = db.getEprRecords();
    const listings = db.getListings();

    const totalWeightKg = listings.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
    const totalCarbonSavedKg = listings.reduce((acc, l) => acc + (Number(l.carbonSavingsKg) || 0), 0);
    const totalValueKES = listings.reduce((acc, l) => acc + (Number(l.price) || 0), 0);

    return res.json({
      records,
      statistics: {
        totalListings: listings.length,
        totalWeightKg,
        totalCarbonSavedKg,
        totalValueKES
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load EPR records" });
  }
}
