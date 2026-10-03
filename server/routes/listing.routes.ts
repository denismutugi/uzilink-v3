import { Router } from "express";
import { 
  getListings, 
  getListingById, 
  createListing, 
  updateListing, 
  deleteListing,
  generateAiListingController,
  requestQuotation, 
  getBuyerRequests, 
  updateRequestStatus,
  getSavedMaterials,
  toggleSaveMaterial,
  getEprRecordsController
} from "../controllers/listing.controller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public & role-based listing discovery
router.get("/", optionalAuth, getListings);

// Requisitions & Inquiries
router.get("/bids", requireAuth, getBuyerRequests);
router.get("/requests", requireAuth, getBuyerRequests);
router.post("/quotation", requireAuth, requireRole(["RECYCLER", "MANUFACTURER", "ADMIN"]), requestQuotation);
router.post("/requests", requireAuth, requireRole(["RECYCLER", "MANUFACTURER", "ADMIN"]), requestQuotation);
router.patch("/bids/:id", requireAuth, requireRole(["SELLER", "ADMIN"]), updateRequestStatus);
router.patch("/requests/:id", requireAuth, requireRole(["SELLER", "ADMIN"]), updateRequestStatus);

// Saved materials
router.get("/saved", requireAuth, getSavedMaterials);
router.post("/save", requireAuth, toggleSaveMaterial);

// EPR Regulatory reporting
router.get("/epr-records", requireAuth, requireRole(["EPR", "ADMIN"]), getEprRecordsController);

// AI Listing Generation (Seller)
router.post("/generate-ai", requireAuth, requireRole(["SELLER", "ADMIN"]), generateAiListingController);

// Single listing details
router.get("/:id", optionalAuth, getListingById);

// Seller listing CRUD
router.post("/", requireAuth, requireRole(["SELLER", "ADMIN"]), createListing);
router.patch("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

export default router;
