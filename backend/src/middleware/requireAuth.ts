import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth";
import UserModel from "../models/User";
import { UserRepository } from "../repositories/UserRepository";
import { reportError } from "../lib/logger";

export type AppRole = "user" | "admin";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role?: AppRole;
};

// Gets WHITELIST Emails from the env then applies those
const getAdminEmails = (): Set<string> =>
  new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

const applyAdminWhitelist = async (
  user: AuthenticatedUser & { role?: AppRole },
): Promise<AuthenticatedUser & { role?: AppRole }> => {
  const adminEmails = getAdminEmails();
  const email = user.email?.trim().toLowerCase();

  if (user.role === "admin") {
    return user;
  }

  // Fail Safe: some session payloads may omit email/role; hydrate from DB when possible.
  const dbUser = await UserModel.findOne({
    where: { id: user.id },
    attributes: ["email", "role"],
  });
  const dbEmail = dbUser?.email?.trim().toLowerCase();
  const dbRole = dbUser?.role as AppRole | undefined;

  if (dbRole === "admin") {
    return { ...user, email: email ?? dbEmail, role: "admin" };
  }

  const effectiveEmail = email ?? dbEmail;
  if (!effectiveEmail || !adminEmails.has(effectiveEmail)) {
    return user;
  }

  // Authorization should not depend on write success; role is elevated immediately.
  try {
    await UserModel.update({ role: "admin" }, { where: { id: user.id } });
  } catch (error) {
    reportError(error, { scope: "auth.admin_role_persist" });
  }

  return { ...user, email: effectiveEmail, role: "admin" };
};

const rejectRestrictedAccount = async (userId: string, res: Response): Promise<boolean> => {
  const user = await new UserRepository().findRestriction(userId);
  if (!user?.banned || (user.banExpires && user.banExpires.getTime() <= Date.now())) return false;
  const suspended = Boolean(user.banExpires);
  res.status(403).json({
    error: suspended ? "ACCOUNT_SUSPENDED" : "ACCOUNT_BANNED",
    message: suspended
      ? "Your account is temporarily restricted. Please contact support if you need help."
      : "Your account is restricted. Please contact support if you need help.",
  });
  return true;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// For standard logged-in users, like saving routines
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (await rejectRestrictedAccount(session.user.id, res)) return;

  const userWithRole =
    (session.user as AuthenticatedUser & { role?: AppRole }) || session.user;
  req.user = await applyAdminWhitelist(userWithRole);
  next();
};

// For admin features, like CSV uploads
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (await rejectRestrictedAccount(session.user.id, res)) return;

  const userWithRole = await applyAdminWhitelist(
    session.user as typeof session.user & { role?: AppRole },
  );

  if (userWithRole.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }

  req.user = userWithRole;
  next();
};
