import axios from "axios";

// Determine the base URL based on environment
const getBaseUrl = () => {
  // If we're in a Docker environment with the backend service
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // In local development with Docker, use the backend service name
    return "/api";
  } else if (process.env.REACT_APP_API_URL) {
    // Use environment variable if provided
    return process.env.REACT_APP_API_URL;
  } else {
    // Default fallback for production
    return window.location.origin + "/api";
  }
};

// Create API instance with base URL
const API = axios.create({
  baseURL: getBaseUrl(),
});

// Export a constant with just the base URL for direct access
export const API_BASE_URL = getBaseUrl();

// Example endpoints
export const loginUser = (data) => API.post("/auth/login/", data);
export const signupUser = (data) => API.post("/auth/signup/", data);
export const forgotPassword = (data) =>
  API.post("/auth/forgot-password/", data);
export const resetPassword = (data) => API.post("/auth/reset-password/", data);
export const sendChatMessage = (data) => API.post("/api/chat/", data);
export const getCurrentChatThread = (data) =>
  API.post("/api/chat/current_thread/", data);
export const getChatThreads = (data) => API.post("/api/chat/threads/", data);
export const getChatHistory = (data) => API.post("/api/chat/history/", data);
export const generateCROAudit = (formData, token) =>
  API.post("/api/generate-cro-audit/", formData, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

export const getAllReports = (token) =>
  API.post("/api/reports/all/", {
    user_token: token,
  });

export const getReportFile = (data) =>
  API.post("/api/reports/get/", data, {
    responseType: data.is_delete ? "json" : "blob",
  });

export const userProfile = (data) => API.post("/api/profile/", data);

export const updateProfilePicture = (data) => {
  // For file uploads, we need to use FormData
  const formData = new FormData();

  // Add each property in the data object to the FormData
  // Special handling for the image file
  Object.keys(data).forEach((key) => {
    // Make sure we're sending the file correctly
    if (key === "image" && data[key] instanceof File) {
      // Append the file with its original name to maintain extension
      formData.append(key, data[key], data[key].name);
    } else {
      formData.append(key, data[key]);
    }
  });

  // Log what's being sent for debugging
  console.log(
    "Sending profile picture update with fields:",
    Array.from(formData.entries()).map((entry) =>
      entry[0] === "image" ? [entry[0], "FILE: " + entry[1].name] : entry,
    ),
  );

  // Return the API call with the correct content type for file uploads
  // Important: Do NOT set Content-Type header manually - let the browser set it with the boundary
  return API.post("/api/user/update_profile_picture/", formData, {
    headers: {
      // Remove Content-Type so browser can set it with proper boundary
    },
  });
};

export const userSettings = (data) => API.post("/api/user/settings/", data);

export default API;
