/** Where the API is; set EXPO_PUBLIC_API_URL when it isn't on this computer. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

/** The site, for pages the app only links to. */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://personal-expenses-tracker-beta.vercel.app";
