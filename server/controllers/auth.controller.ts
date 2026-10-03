import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { hashPassword, verifyPassword, generateToken } from "../utils/crypto.js";
import { db } from "../db.js";

/**
 * Handle user registration
 */
export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, role, organizationName, location } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email address is required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailNorm = email.trim().toLowerCase();
    
    // Check if user exists
    const users = db.getUsers();
    if (users.some((u) => u.email.toLowerCase() === emailNorm)) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const rawRole = (role || "SELLER").toString().toUpperCase().trim();
    const normalizedRole = rawRole === "BUYER" ? "RECYCLER" : rawRole === "ARTISAN" ? "MANUFACTURER" : rawRole;
    const validRoles = ["SELLER", "RECYCLER", "MANUFACTURER", "EPR", "ADMIN"];
    const finalRole = validRoles.includes(normalizedRole) ? normalizedRole : "SELLER";

    // Recyclers and manufacturers require administrative document review / approval
    const isRelationalBusiness = finalRole === "RECYCLER" || finalRole === "MANUFACTURER";
    const approvalStatus = isRelationalBusiness ? "PENDING" : "APPROVED";

    const userName = (name && name.trim()) ? name.trim() : emailNorm.split("@")[0];

    const newUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: userName,
      email: emailNorm,
      passwordHash: hashPassword(password),
      role: finalRole as any,
      verified: false, // will require simulated verification
      approvalStatus: approvalStatus as any,
      organizationName: organizationName?.trim() || "",
      location: location?.trim() || "",
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    // If approval is pending, send notifications to admins
    if (isRelationalBusiness) {
      db.getUsers().forEach(u => {
        if (u.role === "ADMIN") {
          db.addNotification({
            id: `notif-${Date.now()}`,
            userId: u.id,
            title: "Business Approval Needed",
            message: `New resource: ${newUser.name} registered as ${newUser.role} and requires credentials review.`,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    // Auto generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    return res.status(201).json({
      message: "Account registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        approvalStatus: newUser.approvalStatus,
        verified: newUser.verified,
        organizationName: newUser.organizationName,
        location: newUser.location
      }
    });
  } catch (error) {
    console.error("Registration endpoint failed:", error);
    return res.status(500).json({ message: "Internal server registry error" });
  }
}

/**
 * Handle user login
 */
export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const emailNorm = email.trim().toLowerCase();
    const users = db.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === emailNorm);

    // Support standard circular demo accounts
    const demoAccounts: Record<string, { role: any; name: string; org: string; loc: string }> = {
      "seller@uzilink.com": { role: "SELLER", name: "David Mitumba Trader", org: "Gikomba Sorting Syndicate", loc: "Gikomba Market, Nairobi" },
      "recycler@uzilink.com": { role: "RECYCLER", name: "Green Loop Fiber Recyclers", org: "Green Loop Textile Solutions", loc: "Industrial Area, Nairobi" },
      "manufacturer@uzilink.com": { role: "MANUFACTURER", name: "Rivatex East Africa", org: "Rivatex Textile Millers", loc: "Eldoret, Kenya" },
      "epr@uzilink.com": { role: "EPR", name: "Joyce Kamau (KEPRO)", org: "Kenya Extended Producer Responsibility Org (KEPRO)", loc: "Gigiri, Nairobi" },
      "admin@uzilink.com": { role: "ADMIN", name: "UziLink System Admin", org: "UziLink Ltd", loc: "Nairobi HQ" }
    };

    if (demoAccounts[emailNorm]) {
      if (!user) {
        const demoInfo = demoAccounts[emailNorm];
        user = {
          id: `u-${demoInfo.role.toLowerCase()}-1`,
          name: demoInfo.name,
          email: emailNorm,
          passwordHash: hashPassword(password || "password123"),
          role: demoInfo.role,
          verified: true,
          approvalStatus: "APPROVED",
          organizationName: demoInfo.org,
          location: demoInfo.loc,
          createdAt: new Date().toISOString()
        };
        db.addUser(user);
      }
    } else {
      if (!password) {
        return res.status(400).json({ message: "Please provide your password" });
      }

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(400).json({ message: "Invalid email or login credentials" });
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid email or login credentials" });
    }

    // Log the successful login
    db.addAuditLog(user.id, "USER_LOGIN", `User ${user.email} (${user.role}) logged in successfully.`);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        verified: user.verified,
        organizationName: user.organizationName,
        location: user.location
      }
    });
  } catch (error) {
    console.error("Login endpoint failed:", error);
    return res.status(500).json({ message: "Internal login handler failed" });
  }
}

/**
 * Fetch authenticated profile information
 */
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const users = db.getUsers();
    const user = users.find((u) => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        verified: user.verified,
        organizationName: user.organizationName,
        location: user.location,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile details" });
  }
}

/**
 * Handle verification request simulation
 */
export async function requestVerification(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    db.updateUser(req.user.id, { verified: true });
    db.addAuditLog(req.user.id, "VERIFY_EMAIL", `Verified user email address successfully.`);
    
    return res.json({ message: "Email verification simulated and verified successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Email verification process failed" });
  }
}

/**
 * Forgot password simulation
 */
export async function requestForgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Please provide an email address" });

    return res.json({ 
      message: `A password reset link has been mock-dispatched to: ${email}. Please check your inbox (simulated).` 
    });
  } catch (error) {
    return res.status(500).json({ message: "Forgot password procedure failed" });
  }
}
