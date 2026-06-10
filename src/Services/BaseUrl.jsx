

// // ✅ Keep your helper (no harm)
// const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

// // ✅ FORCE production backend (NO env override)
// const defaultBaseUrl = "https://dev.foxiomlabs.com/zkfitness";

// // ❌ Removed env usage (this was causing localhost issue)
// // const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// // ✅ Always use production URL
// export const base_url = trimTrailingSlash(defaultBaseUrl);






// Helper (keep this)
const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

// ✅ SWITCH BASE URL BASED ON ENV
const defaultBaseUrl =
  import.meta.env.MODE === "development"
    ? "https://dev.foxiomlabs.com/zkfitness"       // 👉 LOCAL BACKEND
    : "https://app.365zkfitnessclub.com/"; // 👉 PRODUCTION BACKEND

// const defaultBaseUrl =
//   import.meta.env.MODE === "development"
//     ? "http://localhost:5000"
//     : "http://localhost:5000";

// Export final base_url
export const base_url = trimTrailingSlash(defaultBaseUrl);
