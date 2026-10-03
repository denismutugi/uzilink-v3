import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/crypto.js";
import { db } from "../db.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "SELLER" | "RECYCLER" | "MANUFACTURER" | "EPR" | "ADMIN";
    name: string;
  };
}

/**
 * Access-control authentication gate middleware
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    // 1. Support demo/development tokens (e.g. demo-SELLER-..., token-u-...)
    if (token.startsWith("demo-") || token.startsWith("token-")) {
      const users = db.getUsers();
      let matchedUser = null;

      if (token.toUpperCase().includes("SELLER")) {
        matchedUser = users.find((u) => u.role === "SELLER");
      } else if (token.toUpperCase().includes("RECYCLER")) {
        matchedUser = users.find((u) => u.role === "RECYCLER");
      } else if (token.toUpperCase().includes("MANUFACTURER")) {
        matchedUser = users.find((u) => u.role === "MANUFACTURER");
      } else if (token.toUpperCase().includes("EPR")) {
        matchedUser = users.find((u) => u.role === "EPR");
      } else if (token.toUpperCase().includes("ADMIN")) {
        matchedUser = users.find((u) => u.role === "ADMIN");
      } else {
        const cleanId = token.replace("token-", "").replace("demo-", "").split("-")[0];
        matchedUser = users.find((u) => u.id === cleanId || token.includes(u.id));
      }

      if (matchedUser) {
        req.user = {
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          name: matchedUser.name,
        };
        return next();
      }
    }

    // 2. Standard JWT token verification
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired session token" });
    }

    // Double check user exists in Database
    const users = db.getUsers();
    let user = users.find((u) => u.id === decoded.id || u.email.toLowerCase() === decoded.email?.toLowerCase());

    // If user was created dynamically, ensure record is active in central DB
    if (!user && decoded.email) {
      user = {
        id: decoded.id || `u-${Date.now()}`,
        name: decoded.name || decoded.email.split("@")[0],
        email: decoded.email,
        passwordHash: "",
        role: decoded.role || "SELLER",
        verified: true,
        approvalStatus: "APPROVED",
        createdAt: new Date().toISOString(),
      };
      db.addUser(user);
    }

    if (!user) {
      return res.status(401).json({ message: "User account no longer exists" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication process failed" });
  }
}

/**
 * Optional authentication middleware for public endpoints that can be enhanced with user context
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token.startsWith("demo-") || token.startsWith("token-")) {
        const users = db.getUsers();
        let matchedUser = null;
        if (token.toUpperCase().includes("SELLER")) matchedUser = users.find((u) => u.role === "SELLER");
        else if (token.toUpperCase().includes("RECYCLER")) matchedUser = users.find((u) => u.role === "RECYCLER");
        else if (token.toUpperCase().includes("MANUFACTURER")) matchedUser = users.find((u) => u.role === "MANUFACTURER");
        else if (token.toUpperCase().includes("EPR")) matchedUser = users.find((u) => u.role === "EPR");
        else if (token.toUpperCase().includes("ADMIN")) matchedUser = users.find((u) => u.role === "ADMIN");

        if (matchedUser) {
          req.user = {
            id: matchedUser.id,
            email: matchedUser.email,
            role: matchedUser.role,
            name: matchedUser.name,
          };
          return next();
        }
      }

      const decoded = verifyToken(token);
      if (decoded) {
        const users = db.getUsers();
        const user = users.find((u) => u.id === decoded.id || u.email.toLowerCase() === decoded.email?.toLowerCase());
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          };
        }
      }
    }
  } catch (error) {
    // Graceful fallback for optional auth
  }
  next();
}

/**
 * Role authorization builder
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: This action requires role of: ${allowedRoles.join(" or ")}` 
      });
    }

    next();
  };
}
