import fs from "fs";
import path from "path";
import { hashPassword } from "./utils/crypto.js";

// Database file path
const DB_FILE = path.join(process.cwd(), "db_data.json");

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "SELLER" | "RECYCLER" | "MANUFACTURER" | "EPR" | "ADMIN";
  verified: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  organizationName?: string;
  location?: string;
  phone?: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerLocation?: string;
  sellerEmail?: string;
  title: string;
  description: string;
  category: string;
  materialType: string;
  condition: string;
  quantity: number;
  unit: string;
  location: string;
  price: number;
  currency: "KSh";
  negotiable: boolean;
  images: string[];
  status: "AVAILABLE" | "PENDING" | "UNAVAILABLE" | "SOLD";
  searchKeywords?: string[];
  carbonSavingsKg?: number;
  recyclabilityScore?: number;
  recommendedIndustries?: string[];
  upcyclingIdeas?: string[];
  viewsCount: number;
  createdAt: string;
  updatedAt?: string;
  
  // Backward compatibility fields
  weightKg?: number;
  imageUrl?: string;
  fabricType?: string;
  material?: string;
  estimatedPriceKES?: number;
  color?: string;
  texture?: string;
  confidence?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  receiverId: string;
  receiverName?: string;
  content: string;
  listingId?: string;
  listingTitle?: string;
  createdAt: string;
  read: boolean;
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerRole: string;
  buyerEmail?: string;
  sellerId: string;
  listingId: string;
  listingTitle: string;
  requestedQuantity?: number;
  offeredPrice?: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface SavedMaterial {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface EprRecord {
  id: string;
  listingId: string;
  materialType: string;
  quantity: number;
  unit: string;
  sellerLocation: string;
  recyclingPartner: string;
  carbonSavingsKg: number;
  complianceStatus: "VERIFIED" | "AUDITED" | "PENDING_REPORT";
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DBStructure {
  users: User[];
  listings: Listing[];
  messages: Message[];
  buyerRequests: BuyerRequest[];
  savedMaterials: SavedMaterial[];
  eprRecords: EprRecord[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

// In-Memory Fallback State in case of write-prohibited or ephemeral containers
let dbState: DBStructure = {
  users: [],
  listings: [],
  messages: [],
  buyerRequests: [],
  savedMaterials: [],
  eprRecords: [],
  notifications: [],
  auditLogs: []
};

// Seed Function with Kenyan circular textile marketplace records
function generateSeedData(): DBStructure {
  const users: User[] = [
    {
      id: "u-admin",
      name: "UziLink System Admin",
      email: "admin@uzilink.com",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "UziLink Ltd",
      location: "Nairobi HQ",
      phone: "+254735223879",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-seller-1",
      name: "David Mitumba Trader",
      email: "seller@uzilink.com",
      passwordHash: hashPassword("seller123"),
      role: "SELLER",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Gikomba Sorting Syndicate",
      location: "Gikomba Market, Nairobi",
      phone: "+254700123456",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-recycler-1",
      name: "Green Loop Fiber Recyclers",
      email: "recycler@uzilink.com",
      passwordHash: hashPassword("recycler123"),
      role: "RECYCLER",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Green Loop Textile Solutions",
      location: "Industrial Area, Nairobi",
      phone: "+254711987654",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-manuf-1",
      name: "Rivatex East Africa",
      email: "manufacturer@uzilink.com",
      passwordHash: hashPassword("manufacturer123"),
      role: "MANUFACTURER",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Rivatex Textile Millers",
      location: "Eldoret, Kenya",
      phone: "+254722334455",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-epr-1",
      name: "Joyce Kamau (KEPRO Inspector)",
      email: "epr@uzilink.com",
      passwordHash: hashPassword("epr123"),
      role: "EPR",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Kenya Extended Producer Responsibility Org (KEPRO)",
      location: "Gigiri, Nairobi",
      phone: "+254733445566",
      createdAt: new Date().toISOString()
    }
  ];

  const listings: Listing[] = [
    {
      id: "list-1",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      sellerLocation: "Gikomba Market, Nairobi",
      sellerEmail: "seller@uzilink.com",
      title: "Sorted Heavy Cotton Denim & Twill Cutouts",
      description: "Carefully sorted post-consumer denim and manufacturing cutout scraps. Stripped clean of metal rivets, zippers, buttons, and waistbands. Prime grade for fiber garnetting, recycled yarn spinning, and thermal/acoustic insulation boards.",
      category: "Denim",
      materialType: "100% Cotton & Heavy Denim",
      condition: "Post-consumer Sorted Waste",
      quantity: 450,
      unit: "kg",
      location: "Gikomba Market, Nairobi",
      price: 27500,
      currency: "KSh",
      negotiable: true,
      images: [
        "/assets/images/denim_textile_scraps_1791049107969.jpg"
      ],
      status: "AVAILABLE",
      searchKeywords: ["denim", "cotton", "gikomba", "insulation", "twill", "yarn spinning"],
      carbonSavingsKg: 1350,
      recyclabilityScore: 88,
      recommendedIndustries: [
        "Eco-Jeans & Recycled Apparel Weaving",
        "Acoustic & Thermal Insulation Batts",
        "Heavy Duty Upholstery & Tote Bags"
      ],
      upcyclingIdeas: [
        "Denim patchwork utility bags",
        "Compressed thermal isolation wall panels",
        "Spun cotton-denim yarn for knitwear"
      ],
      viewsCount: 42,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      weightKg: 450,
      imageUrl: "/assets/images/denim_textile_scraps_1791049107969.jpg",
      fabricType: "Denim & Twill",
      material: "100% Cotton & Denim",
      estimatedPriceKES: 27500
    },
    {
      id: "list-2",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      sellerLocation: "Nanyuki Sorting Depot",
      sellerEmail: "seller@uzilink.com",
      title: "Pre-Consumer Knit Jersey Cutting Offcuts",
      description: "Clean factory offcuts from athletic and apparel garment manufacturing. 100% combed cotton jersey knit. Zero dust, completely dry, elastic fibers ready for industrial non-woven felt processing, mattress padding, or wiping cloths.",
      category: "Cotton",
      materialType: "100% Combed Cotton Knit Jersey",
      condition: "Pre-consumer Manufacturing Offcuts",
      quantity: 280,
      unit: "kg",
      location: "Nanyuki Sorting Depot",
      price: 14000,
      currency: "KSh",
      negotiable: false,
      images: [
        "/assets/images/cotton_jersey_scraps_1791049120724.jpg"
      ],
      status: "AVAILABLE",
      searchKeywords: ["knit", "jersey", "cotton", "nanyuki", "pre-consumer", "padding"],
      carbonSavingsKg: 780,
      recyclabilityScore: 92,
      recommendedIndustries: [
        "Industrial Absorbents & Wipers",
        "Non-woven Textile Felting",
        "Automotive Seat Padding"
      ],
      upcyclingIdeas: [
        "Mechanically shredded stuffing for mattresses",
        "Industrial oil-absorbing cushions",
        "Low-lint commercial cleaning cloths"
      ],
      viewsCount: 29,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      weightKg: 280,
      imageUrl: "/assets/images/cotton_jersey_scraps_1791049120724.jpg",
      fabricType: "Knit Jersey",
      material: "100% Cotton",
      estimatedPriceKES: 14000
    },
    {
      id: "list-3",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      sellerLocation: "Mombasa Port Warehouse",
      sellerEmail: "seller@uzilink.com",
      title: "Bulk Baled Synthetic Polar Fleece (rPET)",
      description: "Monolithic post-consumer fleece sorted strictly by fiber class. 100% recycled polyester (PET) base. Ideal for chemical depolymerization, thermal pelletizing, or industrial geotextile matting.",
      category: "Synthetic",
      materialType: "100% Recycled Polyester (PET)",
      condition: "Baled Post-Consumer Fleece",
      quantity: 1200,
      unit: "kg",
      location: "Mombasa Port Warehouse",
      price: 68000,
      currency: "KSh",
      negotiable: true,
      images: [
        "/assets/images/synthetic_fleece_scraps_1791049134251.jpg"
      ],
      status: "AVAILABLE",
      searchKeywords: ["fleece", "polyester", "rpet", "mombasa", "pelletizing", "geotextiles"],
      carbonSavingsKg: 3600,
      recyclabilityScore: 92,
      recommendedIndustries: [
        "Fiber-to-Fiber Polyester Re-spinning",
        "Carpet & Flooring Backing Manufacture",
        "Civil Geotextile Fabric Weaving"
      ],
      upcyclingIdeas: [
        "Polyester pellet compounding for injection molding",
        "Outdoor thermal camping blankets",
        "High-strength sub-grade road membranes"
      ],
      viewsCount: 51,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weightKg: 1200,
      imageUrl: "/assets/images/synthetic_fleece_scraps_1791049134251.jpg",
      fabricType: "Synthetic Fleece",
      material: "100% Polyester",
      estimatedPriceKES: 68000
    },
    {
      id: "list-4",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      sellerLocation: "Gikomba Market, Nairobi",
      sellerEmail: "seller@uzilink.com",
      title: "Grade-B Mitumba Sorted Used Clothing Bales",
      description: "Post-consumer sorted cotton shirts, chinos, and dresses sorted for mechanical shredding, thermal recycling, or industrial wiping rags. Baled tightly in 250 kg export blocks.",
      category: "Used clothing",
      materialType: "Assorted Cotton & Blend Garments",
      condition: "Post-consumer Sorted Bales",
      quantity: 750,
      unit: "kg",
      location: "Gikomba Market, Nairobi",
      price: 33750,
      currency: "KSh",
      negotiable: true,
      images: [
        "/assets/images/used_clothing_bales_1791049152076.jpg"
      ],
      status: "AVAILABLE",
      searchKeywords: ["mitumba", "clothing", "bales", "gikomba", "rags", "cotton"],
      carbonSavingsKg: 2100,
      recyclabilityScore: 84,
      recommendedIndustries: [
        "Industrial Wiping Rags",
        "Mattress & Upholstery Stuffing",
        "Secondary Fiber Spinning"
      ],
      upcyclingIdeas: [
        "Mechanical cotton shoddy for vehicle acoustic damping",
        "Commercial absorbent wiping pads"
      ],
      viewsCount: 38,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      weightKg: 750,
      imageUrl: "/assets/images/used_clothing_bales_1791049152076.jpg",
      fabricType: "Sorted Mitumba",
      material: "Cotton & Blends",
      estimatedPriceKES: 33750
    },
    {
      id: "list-5",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      sellerLocation: "Industrial Area, Nairobi",
      sellerEmail: "seller@uzilink.com",
      title: "Industrial Poly-Cotton Factory Offcuts & Strips",
      description: "Heavy woven industrial textile scrap offcuts from uniform manufacturing. 65% polyester / 35% cotton high tensile strength. Excellent for secondary yarn re-spinning or geotextile matting.",
      category: "Industrial textile waste",
      materialType: "65/35 Poly-Cotton Industrial Weft",
      condition: "Pre-consumer Clean Offcuts",
      quantity: 900,
      unit: "kg",
      location: "Industrial Area, Nairobi",
      price: 49500,
      currency: "KSh",
      negotiable: false,
      images: [
        "/assets/images/industrial_textile_waste_1791049166827.jpg"
      ],
      status: "AVAILABLE",
      searchKeywords: ["industrial", "offcuts", "poly-cotton", "uniform", "yarn", "re-spinning"],
      carbonSavingsKg: 2700,
      recyclabilityScore: 89,
      recommendedIndustries: [
        "Secondary Yarn Spinning",
        "Acoustic Baffles",
        "Heavy Canvas Weaving"
      ],
      upcyclingIdeas: [
        "Woven straps and heavy tie-down webbing",
        "Reinforced road foundation geotextiles"
      ],
      viewsCount: 22,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      weightKg: 900,
      imageUrl: "/assets/images/industrial_textile_waste_1791049166827.jpg",
      fabricType: "Industrial Weave",
      material: "65/35 Poly-Cotton",
      estimatedPriceKES: 49500
    },
    {
      id: "list-6",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      sellerLocation: "Nakuru Sorting Depot",
      sellerEmail: "seller@uzilink.com",
      title: "Sorted Natural Fiber Multi-Pattern Textile Scraps",
      description: "Clean sorted colorful natural fiber remnants from garment manufacturing houses. Ideal for mechanical garnetting, rag rug braiding, and recycled cotton paper milling.",
      category: "Textile scraps",
      materialType: "Natural Cotton & Linen Remnants",
      condition: "Pre-consumer Sorted Remnants",
      quantity: 320,
      unit: "kg",
      location: "Nakuru Sorting Depot",
      price: 19200,
      currency: "KSh",
      negotiable: true,
      images: [
        "/assets/images/scraps_transformation_1790988212084.jpg"
      ],
      status: "AVAILABLE",
      searchKeywords: ["scraps", "remnants", "nakuru", "cotton", "linen", "patchwork"],
      carbonSavingsKg: 960,
      recyclabilityScore: 90,
      recommendedIndustries: [
        "Recycled Cotton Paper Milling",
        "Rug & Mat Braiding",
        "Non-woven Sound Dampeners"
      ],
      upcyclingIdeas: [
        "Handmade 100% cotton rag archival paper",
        "High-density thermal car insulation"
      ],
      viewsCount: 65,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      weightKg: 320,
      imageUrl: "/assets/images/scraps_transformation_1790988212084.jpg",
      fabricType: "Natural Scraps",
      material: "Cotton & Linen",
      estimatedPriceKES: 19200
    }
  ];

  const messages: Message[] = [
    {
      id: "msg-1",
      senderId: "u-recycler-1",
      senderName: "Green Loop Fiber Recyclers",
      senderRole: "RECYCLER",
      receiverId: "u-seller-1",
      receiverName: "David Mitumba Trader",
      listingId: "list-1",
      listingTitle: "Sorted Heavy Cotton Denim & Twill Cutouts",
      content: "Hello David, we reviewed your 450 kg Denim batch. We have capacity to collect next Tuesday in Gikomba. Are terms agreeable at KSh 26,000 for immediate cash settlement?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ];

  const buyerRequests: BuyerRequest[] = [
    {
      id: "req-1",
      buyerId: "u-recycler-1",
      buyerName: "Green Loop Fiber Recyclers",
      buyerRole: "RECYCLER",
      buyerEmail: "recycler@uzilink.com",
      sellerId: "u-seller-1",
      listingId: "list-1",
      listingTitle: "Sorted Heavy Cotton Denim & Twill Cutouts",
      requestedQuantity: 450,
      offeredPrice: 26000,
      message: "Direct procurement offer for full 450 kg batch. Collection via our fleet from Gikomba depot. KEPRO waste transfer note provided.",
      status: "PENDING",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const savedMaterials: SavedMaterial[] = [
    {
      id: "saved-1",
      userId: "u-recycler-1",
      listingId: "list-1",
      createdAt: new Date().toISOString()
    }
  ];

  const eprRecords: EprRecord[] = [
    {
      id: "epr-1",
      listingId: "list-1",
      materialType: "Denim & Heavy Cotton",
      quantity: 450,
      unit: "kg",
      sellerLocation: "Gikomba Market, Nairobi",
      recyclingPartner: "Green Loop Textile Solutions",
      carbonSavingsKg: 1350,
      complianceStatus: "VERIFIED",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "epr-2",
      listingId: "list-2",
      materialType: "Poly-Cotton Knit Jersey",
      quantity: 280,
      unit: "kg",
      sellerLocation: "Nanyuki Sorting Depot",
      recyclingPartner: "Rivatex Textile Millers",
      carbonSavingsKg: 780,
      complianceStatus: "AUDITED",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const notifications: Notification[] = [
    {
      id: "notif-1",
      userId: "u-seller-1",
      title: "New Material Requisition",
      message: "Green Loop Fiber Recyclers submitted an offer for your Denim batch (KSh 26,000).",
      read: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "audit-1",
      action: "CIRCULAR_DATABASE_INITIALIZED",
      details: "Centralized UziLink marketplace database mounted with 4 core roles.",
      timestamp: new Date().toISOString()
    }
  ];

  return { users, listings, messages, buyerRequests, savedMaterials, eprRecords, notifications, auditLogs };
}

export function lockAndLoadDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const p = fs.readFileSync(DB_FILE, "utf-8");
      const loaded = JSON.parse(p);
      dbState = {
        users: loaded.users || [],
        listings: loaded.listings || [],
        messages: loaded.messages || [],
        buyerRequests: loaded.buyerRequests || [],
        savedMaterials: loaded.savedMaterials || [],
        eprRecords: loaded.eprRecords || [],
        notifications: loaded.notifications || [],
        auditLogs: loaded.auditLogs || []
      };
      // Normalize any older listing objects and remove dummy test images
      dbState.listings = dbState.listings.map((l) => {
        let cleanImgs = l.images && l.images.length > 0 ? l.images : (l.imageUrl ? [l.imageUrl] : []);
        cleanImgs = cleanImgs.map((img) => {
          if (
            img.includes("artisans_workshop") || 
            img.includes("2wCEAAkGBxMSEhUTEhIW") || 
            (img.startsWith("data:") && img.length < 2500)
          ) {
            // Assign distinct category image
            const cat = (l.category || "").toLowerCase();
            if (cat.includes("denim")) return "/assets/images/denim_textile_scraps_1791049107969.jpg";
            if (cat.includes("cotton")) return "/assets/images/cotton_jersey_scraps_1791049120724.jpg";
            if (cat.includes("synthetic")) return "/assets/images/synthetic_fleece_scraps_1791049134251.jpg";
            if (cat.includes("clothing") || cat.includes("mitumba")) return "/assets/images/used_clothing_bales_1791049152076.jpg";
            if (cat.includes("industrial")) return "/assets/images/industrial_textile_waste_1791049166827.jpg";
            return "/assets/images/scraps_transformation_1790988212084.jpg";
          }
          return img;
        });

        return {
          ...l,
          title: l.title || l.fabricType || "Textile Waste Material",
          category: l.category || "Cotton",
          materialType: l.materialType || l.material || "Sorted Textile Waste",
          condition: l.condition || "Sorted Waste",
          quantity: l.quantity || l.weightKg || 100,
          unit: l.unit || "kg",
          price: l.price ?? l.estimatedPriceKES ?? 15000,
          currency: l.currency || "KSh",
          negotiable: typeof l.negotiable === "boolean" ? l.negotiable : true,
          images: cleanImgs.length > 0 ? cleanImgs : ["/assets/images/denim_textile_scraps_1791049107969.jpg"],
          imageUrl: cleanImgs[0] || "/assets/images/denim_textile_scraps_1791049107969.jpg",
          status: l.status === "DRAFT" ? "AVAILABLE" : ((l.status as any) || "AVAILABLE")
        };
      });

      // If listings were just duplicate test drafts, ensure seed data available listings are active
      const hasRealListings = dbState.listings.some((l) => l.status === "AVAILABLE" && l.id.startsWith("list-"));
      if (!hasRealListings || dbState.listings.length < 3) {
        dbState.listings = generateSeedData().listings;
        saveDB();
      }

      return dbState;
    } else {
      dbState = generateSeedData();
      saveDB();
      return dbState;
    }
  } catch (e) {
    console.error("DB read error. Working on in-memory state", e);
    if (dbState.users.length === 0) {
      dbState = generateSeedData();
    }
    return dbState;
  }
}

export function saveDB(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (error) {
    console.warn("DB file write prohibited/ephemeral. Keeping memory state synced.", error);
  }
}

// Initial boot sync
lockAndLoadDB();

export const db = {
  getUsers: () => dbState.users,
  getUserById: (id: string) => dbState.users.find((u) => u.id === id),
  getUserByEmail: (email: string) => dbState.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  addUser: (user: User) => {
    dbState.users.push(user);
    saveDB();
    db.addAuditLog(user.id, "USER_REGISTERED", `New user registered: ${user.name} (${user.email}) as ${user.role}`);
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const idx = dbState.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      dbState.users[idx] = { ...dbState.users[idx], ...updates };
      saveDB();
    }
  },

  // Centralized Listings CRUD
  getListings: () => dbState.listings,
  getListingById: (id: string) => dbState.listings.find((l) => l.id === id),
  addListing: (listing: Listing) => {
    dbState.listings.unshift(listing);
    saveDB();
    db.addAuditLog(listing.sellerId, "LISTING_CREATED", `Listing created: ${listing.title} - ${listing.quantity} ${listing.unit}`);
    
    // Automatically register an EPR audit tracking entry
    dbState.eprRecords.unshift({
      id: `epr-${Date.now()}`,
      listingId: listing.id,
      materialType: listing.materialType || listing.category,
      quantity: listing.quantity,
      unit: listing.unit,
      sellerLocation: listing.location,
      recyclingPartner: "Pending Buyer Allocation",
      carbonSavingsKg: listing.carbonSavingsKg || Math.round(listing.quantity * 2.8),
      complianceStatus: "PENDING_REPORT",
      timestamp: new Date().toISOString()
    });
    saveDB();
  },
  updateListing: (id: string, updates: Partial<Listing>) => {
    const idx = dbState.listings.findIndex((l) => l.id === id);
    if (idx !== -1) {
      dbState.listings[idx] = {
        ...dbState.listings[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveDB();
      db.addAuditLog(dbState.listings[idx].sellerId, "LISTING_UPDATED", `Listing updated: ${dbState.listings[idx].title} (Price: KSh ${dbState.listings[idx].price}, Status: ${dbState.listings[idx].status})`);
    }
  },
  deleteListing: (id: string) => {
    const item = dbState.listings.find((l) => l.id === id);
    dbState.listings = dbState.listings.filter((l) => l.id !== id);
    saveDB();
    if (item) {
      db.addAuditLog(item.sellerId, "LISTING_DELETED", `Listing deleted: ${item.title}`);
    }
  },

  // Material requests & bids
  getBuyerRequests: () => dbState.buyerRequests,
  addBuyerRequest: (req: BuyerRequest) => {
    dbState.buyerRequests.unshift(req);
    saveDB();
    db.addAuditLog(req.buyerId, "MATERIAL_REQUESTED", `Requested quotation on listing ${req.listingId}`);
  },
  updateBuyerRequest: (id: string, status: "PENDING" | "ACCEPTED" | "DECLINED") => {
    const req = dbState.buyerRequests.find((r) => r.id === id);
    if (req) {
      req.status = status;
      saveDB();
    }
  },

  // Saved Materials
  getSavedMaterials: (userId: string) => {
    return dbState.savedMaterials.filter((s) => s.userId === userId);
  },
  addSavedMaterial: (userId: string, listingId: string) => {
    if (!dbState.savedMaterials.some((s) => s.userId === userId && s.listingId === listingId)) {
      dbState.savedMaterials.unshift({
        id: `saved-${Date.now()}`,
        userId,
        listingId,
        createdAt: new Date().toISOString()
      });
      saveDB();
    }
  },
  removeSavedMaterial: (userId: string, listingId: string) => {
    dbState.savedMaterials = dbState.savedMaterials.filter((s) => !(s.userId === userId && s.listingId === listingId));
    saveDB();
  },

  // EPR compliance records
  getEprRecords: () => dbState.eprRecords,
  addEprRecord: (record: EprRecord) => {
    dbState.eprRecords.unshift(record);
    saveDB();
  },

  // Messages
  getMessages: () => dbState.messages,
  addMessage: (msg: Message) => {
    dbState.messages.push(msg);
    saveDB();
  },
  markMessagesAsRead: (userId: string, senderId: string) => {
    dbState.messages.forEach((m) => {
      if (m.receiverId === userId && m.senderId === senderId) {
        m.read = true;
      }
    });
    saveDB();
  },

  // Notifications
  getNotifications: () => dbState.notifications,
  addNotification: (notif: Notification) => {
    dbState.notifications.unshift(notif);
    saveDB();
  },
  markNotificationsAsRead: (userId: string) => {
    dbState.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    saveDB();
  },

  // Audit logs
  getAuditLogs: () => dbState.auditLogs,
  addAuditLog: (userId: string, action: string, details: string) => {
    const user = dbState.users.find((u) => u.id === userId);
    dbState.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userEmail: user?.email || "system",
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (dbState.auditLogs.length > 500) {
      dbState.auditLogs = dbState.auditLogs.slice(0, 500);
    }
    saveDB();
  }
};
