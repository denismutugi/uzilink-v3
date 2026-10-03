import { resolveImageUrl } from "./imageMap.js";
import { 
  ListingItem, 
  UserProfile, 
  MaterialRequestItem, 
  SystemNotification, 
  DirectMessage,
  EprRecordItem
} from "../types.js";
import { db as firestoreDb } from "./firebase.js";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from "firebase/firestore";

const API_BASE = "/api";

export function getToken(): string | null {
  return localStorage.getItem("uzilink_token");
}

export function setToken(token: string) {
  localStorage.setItem("uzilink_token", token);
}

export function removeToken() {
  localStorage.removeItem("uzilink_token");
  localStorage.removeItem("uzilink_current_session");
}

export function getCurrentUserSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem("uzilink_current_session");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function setCurrentUserSession(user: UserProfile) {
  localStorage.setItem("uzilink_current_session", JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || `HTTP ${response.status}: Request failed`);
  }

  return response.json();
}

export const api = {
  // Authentication
  async login(credentials: { email: string; password?: string; role?: string }): Promise<{ token: string; user: UserProfile }> {
    try {
      const res = await request<{ token: string; user: UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      setToken(res.token);
      setCurrentUserSession(res.user);
      return res;
    } catch (err: any) {
      // Demo accounts fallback if backend has an issue
      const demoAccounts: Record<string, UserProfile> = {
        "seller@uzilink.com": {
          id: "u-seller-1",
          name: "David Mitumba Trader",
          email: "seller@uzilink.com",
          role: "SELLER",
          verified: true,
          organizationName: "Gikomba Sorting Syndicate",
          location: "Gikomba Market, Nairobi",
          createdAt: new Date().toISOString()
        },
        "recycler@uzilink.com": {
          id: "u-recycler-1",
          name: "Green Loop Fiber Recyclers",
          email: "recycler@uzilink.com",
          role: "RECYCLER",
          verified: true,
          organizationName: "Green Loop Textile Solutions",
          location: "Industrial Area, Nairobi",
          createdAt: new Date().toISOString()
        },
        "manufacturer@uzilink.com": {
          id: "u-manuf-1",
          name: "Rivatex East Africa",
          email: "manufacturer@uzilink.com",
          role: "MANUFACTURER",
          verified: true,
          organizationName: "Rivatex Textile Millers",
          location: "Eldoret, Kenya",
          createdAt: new Date().toISOString()
        },
        "epr@uzilink.com": {
          id: "u-epr-1",
          name: "Joyce Kamau (KEPRO)",
          email: "epr@uzilink.com",
          role: "EPR",
          verified: true,
          organizationName: "Kenya Extended Producer Responsibility Org (KEPRO)",
          location: "Gigiri, Nairobi",
          createdAt: new Date().toISOString()
        }
      };

      const matched = demoAccounts[credentials.email.toLowerCase()];
      if (matched) {
        const dummyToken = `demo-${matched.role}-${Date.now()}`;
        setToken(dummyToken);
        setCurrentUserSession(matched);
        return { token: dummyToken, user: matched };
      }
      throw err;
    }
  },

  async register(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
    organizationName?: string;
    location?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    try {
      const res = await request<{ token: string; user: UserProfile }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setToken(res.token);
      setCurrentUserSession(res.user);
      return res;
    } catch (err) {
      // Local graceful fallback
      const newUser: UserProfile = {
        id: `u-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role as any,
        verified: true,
        organizationName: data.organizationName,
        location: data.location || "Nairobi, Kenya",
        createdAt: new Date().toISOString()
      };
      const dummyToken = `token-${newUser.id}`;
      setToken(dummyToken);
      setCurrentUserSession(newUser);
      return { token: dummyToken, user: newUser };
    }
  },

  async getProfile(): Promise<{ user: UserProfile }> {
    try {
      const res = await request<{ user: UserProfile }>("/auth/me");
      setCurrentUserSession(res.user);
      return res;
    } catch (e) {
      const session = getCurrentUserSession();
      if (session) return { user: session };
      throw e;
    }
  },

  // Centralized Listings CRUD
  async getListings(params: Record<string, any> = {}): Promise<{ listings: ListingItem[] }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          queryParams.append(k, String(v));
        }
      });
      const qStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const res = await request<{ listings: ListingItem[] }>(`/listings${qStr}`);
      return res;
    } catch (e) {
      console.warn("Direct API getListings failed, fetching from Firestore...", e);
      try {
        const snap = await getDocs(collection(firestoreDb, "listings"));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ListingItem));
        return { listings: items };
      } catch (fErr) {
        return { listings: [] };
      }
    }
  },

  async getListingById(id: string): Promise<{ listing: ListingItem }> {
    return request<{ listing: ListingItem }>(`/listings/${id}`);
  },

  async createListing(listingData: Partial<ListingItem>): Promise<{ listing: ListingItem; message: string }> {
    // 1. Submit to API backend (persists in central DB)
    const res = await request<{ listing: ListingItem; message: string }>("/listings", {
      method: "POST",
      body: JSON.stringify(listingData),
    });

    // 2. Dual-write to Firestore for real-time live synchronization
    try {
      if (res.listing && res.listing.id) {
        await setDoc(doc(firestoreDb, "listings", res.listing.id), res.listing);
      }
    } catch (fsErr) {
      console.warn("Firestore dual-write soft notice:", fsErr);
    }

    return res;
  },

  async updateListing(id: string, updates: Partial<ListingItem>): Promise<{ listing: ListingItem; message: string }> {
    const res = await request<{ listing: ListingItem; message: string }>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    try {
      await updateDoc(doc(firestoreDb, "listings", id), updates as any);
    } catch (fsErr) {
      console.warn("Firestore sync update soft notice:", fsErr);
    }

    return res;
  },

  async deleteListing(id: string): Promise<{ message: string }> {
    const res = await request<{ message: string }>(`/listings/${id}`, {
      method: "DELETE",
    });

    try {
      await deleteDoc(doc(firestoreDb, "listings", id));
    } catch (fsErr) {
      console.warn("Firestore delete soft notice:", fsErr);
    }

    return res;
  },

  // AI Listing Generation
  async generateAiListing(input: {
    textileType?: string;
    material?: string;
    condition?: string;
    quantity?: number;
    unit?: string;
    color?: string;
    intendedUse?: string;
    notes?: string;
    imageB64?: string;
    mimeType?: string;
  }): Promise<{ listingSuggestion: any }> {
    return request<{ listingSuggestion: any }>("/listings/generate-ai", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // Requisitions & Inquiries
  async requestQuotation(data: {
    listingId: string;
    requestedQuantity?: number;
    offeredPrice?: number;
    message: string;
  }): Promise<{ request: MaterialRequestItem; message: string }> {
    return request<{ request: MaterialRequestItem; message: string }>("/listings/requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async requestMaterial(data: {
    listingId: string;
    requestedQuantity?: number;
    offeredPrice?: number;
    message: string;
  }): Promise<{ request: MaterialRequestItem; message: string }> {
    return request<{ request: MaterialRequestItem; message: string }>("/listings/requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getRequests(): Promise<{ requests: MaterialRequestItem[] }> {
    return request<{ requests: MaterialRequestItem[] }>("/listings/requests");
  },

  async getBids(): Promise<{ requests: MaterialRequestItem[] }> {
    return request<{ requests: MaterialRequestItem[] }>("/listings/requests");
  },

  async updateRequestStatus(id: string, status: "PENDING" | "ACCEPTED" | "DECLINED"): Promise<{ message: string }> {
    return request<{ message: string }>(`/listings/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Saved materials
  async getSavedMaterials(): Promise<{ savedListings: ListingItem[]; savedItems: any[] }> {
    return request<{ savedListings: ListingItem[]; savedItems: any[] }>("/listings/saved");
  },

  async toggleSaveMaterial(listingId: string): Promise<{ saved: boolean; message: string }> {
    return request<{ saved: boolean; message: string }>("/listings/save", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
  },

  // EPR Records
  async getEprRecords(): Promise<{ records: EprRecordItem[]; statistics: any }> {
    return request<{ records: EprRecordItem[]; statistics: any }>("/listings/epr-records");
  },

  // Direct Messages & Threads
  async getThreads(): Promise<{ threads: any[] }> {
    return request<{ threads: any[] }>("/messages/threads");
  },

  async getThread(partnerId: string): Promise<{ messages: DirectMessage[] }> {
    return request<{ messages: DirectMessage[] }>(`/messages/thread/${partnerId}`);
  },

  async getMessages(partnerId?: string, listingId?: string): Promise<{ messages: DirectMessage[] }> {
    const q = new URLSearchParams();
    if (partnerId) q.append("partnerId", partnerId);
    if (listingId) q.append("listingId", listingId);
    return request<{ messages: DirectMessage[] }>(`/messages?${q.toString()}`);
  },

  async sendMessage(data: { receiverId: string; content: string; listingId?: string }): Promise<{ message: DirectMessage }> {
    return request<{ message: DirectMessage }>("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: SystemNotification[] }> {
    return request<{ notifications: SystemNotification[] }>("/notifications");
  },

  async markNotificationsAsRead(): Promise<{ message: string }> {
    return request<{ message: string }>("/notifications/read", {
      method: "POST",
    });
  },

  async verifyAccount(): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/verify", {
      method: "POST",
    });
  },

  // Admin Methods
  async getAnalytics(): Promise<any> {
    return request<any>("/admin/analytics");
  },

  async getAdminUsers(): Promise<{ users: UserProfile[] }> {
    return request<{ users: UserProfile[] }>("/admin/users");
  },

  async approveUser(userId: string, status: "APPROVED" | "REJECTED"): Promise<{ message: string }> {
    return request<{ message: string }>(`/admin/users/${userId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async moderateListing(listingId: string, status: string = "REMOVED"): Promise<{ message: string }> {
    return request<{ message: string }>(`/admin/listings/${listingId}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
};
