export type UserRole = "SELLER" | "RECYCLER" | "MANUFACTURER" | "EPR" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  verified?: boolean;
  organizationName?: string;
  location?: string;
  phone?: string;
  createdAt?: string;
}

export type TextileUnit = "kg" | "bales" | "tonnes" | "pieces" | "meters";

export type TextileCategory = 
  | "Cotton"
  | "Denim"
  | "Synthetic"
  | "Mixed textile"
  | "Used clothing"
  | "Textile scraps"
  | "Industrial textile waste"
  | "Fleece"
  | "Linen & Canvas"
  | "Other";

export interface ListingItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerLocation?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  title: string;
  description: string;
  category: TextileCategory | string;
  materialType: string;
  condition: string;
  quantity: number;
  unit: TextileUnit | string;
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
  viewsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DirectMessage {
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

export interface ChatThread {
  lastMessage: DirectMessage;
  partnerId: string;
  partnerName: string;
  partnerRole?: string;
  listingId?: string;
}

export interface MaterialRequestItem {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerRole: string;
  buyerEmail?: string;
  requestedQuantity: number;
  offeredPrice: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface SavedMaterialItem {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

export interface EprRecordItem {
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

export interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface PlatformAnalyticsReport {
  totalListings: number;
  availableListings: number;
  totalQuantityKg: number;
  totalValueKES: number;
  totalCarbonSavedKg: number;
  categoryBreakdown: { category: string; count: number; totalKg: number }[];
  locationBreakdown: { location: string; count: number }[];
  userCounts: {
    SELLER: number;
    RECYCLER: number;
    MANUFACTURER: number;
    EPR: number;
    ADMIN: number;
  };
  eprRecords: EprRecordItem[];
}

export interface AdminAnalyticsReport {
  totalWeightKg: number;
  solvedWeightKg: number;
  totalCarbonSavedKg: number;
  totalKESValue: number;
  userCount: number;
  roleStats: {
    SELLER: number;
    RECYCLER: number;
    MANUFACTURER: number;
    EPR: number;
    ADMIN: number;
  };
  pendingReviewCount: number;
  recentLogs: AuditLogItem[];
}

