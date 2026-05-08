import { Role } from "@/lib/types";

/**
 * Determines the primary entry point for a user based on their cryptographic role.
 * Used during login redirects and unauthorized access recovery.
 */
export function getDashboardRouteForRole(role?: Role | string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MERCHANT":
      return "/merchant/dashboard";
    case "CUSTOMER":
      return "/store";
    default:
      // Default fallback for unidentified actors or guest sessions
      return "/store";
  }
}