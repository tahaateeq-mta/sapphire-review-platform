// lib/firebase/firebaseErrors.ts

export function getFriendlyFirebaseError(error: any): string {
  if (!error || !error.code) return "An unexpected network error occurred. Please try again.";

  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/popup-closed-by-user":
      return "Google login was cancelled. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed login attempts. Please try again later.";
    case "permission-denied":
      return "Access Denied: You do not have the required permissions to perform this action.";
    case "unavailable":
      return "Database is currently unavailable. Please check your internet connection.";
    case "failed-precondition":
      return "Action failed. The database index is currently building, or data is out of sync.";
    default:
      return `System Error: ${error.message || "Unknown error"}`;
  }
}