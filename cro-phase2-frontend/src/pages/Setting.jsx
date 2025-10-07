import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  userProfile,
  resetPassword,
  userSettings,
  updateProfilePicture,
  // API,
  API_BASE_URL,
} from "../api/api";
import "../css/global.css";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Profile Settings");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    jobTitle: "",
    company: "",
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState("https://i.pravatar.cc/100?img=3");
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Integration connection states
  const [integrations, setIntegrations] = useState({
    hotjar: false, // Show Connect button by default
    shopify: false,
    googleAnalytics: false, // Show Connect button by default
  });

  // Additional settings states
  // eslint-disable-next-line no-unused-vars
  const [additionalSettings, setAdditionalSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    dataAnalytics: true,
    sessionTimeout: "30",
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  // Success state for password change
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);

  // API Key Setup states
  const [apiKeyData, setApiKeyData] = useState({
    aiType: "rag",
    aiProvider: "openai",
    aiModel: "gpt-4",
    openaiApiKey: "",
    geminiApiKey: "",
    temperature: 0.7,
    max_tokens: 2048,
  });

  // For debugging
  console.log("Initial apiKeyData state:", apiKeyData);

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    provider: "",
  });

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image (JPG, PNG, GIF)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB");
        return;
      }

      // Preview the selected image locally first
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageBase64 = reader.result;
        // Add a timestamp as part of the state update to force re-render
        const tempPreview = `${imageBase64}#temp-${new Date().getTime()}`;
        setPreview(tempPreview); // Set temporary preview from local file
      };
      reader.readAsDataURL(file);

      // Automatically update profile image when selected
      const updateProfileImage = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("accessToken");

          if (!token) {
            console.error("No access token found");
            return;
          }

          // Create FormData object to send file
          const formData = new FormData();
          formData.append("user_token", token);
          formData.append("image", file);

          console.log("Uploading file:", file.name, file.type, file.size);

          // Use the imported API function which already has the correct baseURL
          const response = await updateProfilePicture({
            user_token: token,
            image: file,
          });

          console.log("Profile picture update response:", response.data);
          if (response.data && response.data.success) {
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);

            // If the API returns an image URL, use it for preview and sidebar update
            if (response.data.profile_picture) {
              console.log("Received image URL:", response.data.profile_picture);

              // Check if it's a full URL or a relative path
              let fullImageUrl = response.data.profile_picture;
              if (!fullImageUrl.startsWith("http")) {
                // It's a relative path, add the base URL
                fullImageUrl = API_BASE_URL + fullImageUrl;
              }

              // Add cache-busting parameter for server-side images
              const imageWithCacheBuster = `${fullImageUrl}?t=${new Date().getTime()}`;
              console.log("Using complete image URL:", imageWithCacheBuster);
              setPreview(imageWithCacheBuster);

              // Update sidebar by dispatching an event
              const event = new CustomEvent("profile-updated", {
                detail: {
                  name: formData.fullName,
                  profileImage: fullImageUrl,
                },
              });
              // Alternative simpler event to just trigger a profile refresh
              const refreshEvent = new CustomEvent("profile-updated", {
                detail: {},
              });
              window.dispatchEvent(event);
              // Dispatch the refresh event with a slight delay to ensure consistency
              setTimeout(() => window.dispatchEvent(refreshEvent), 300);
            }
          }
        } catch (error) {
          console.error("Failed to update profile image:", error);
          console.error(
            "Error details:",
            error.response?.data || error.message,
          );
          alert(
            `Failed to update profile image: ${error.response?.data?.error || error.message}`,
          );
        } finally {
          setLoading(false);
        }
      };

      updateProfileImage();
    }
  };

  // Load user profile and settings data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.error("No access token found");
          return;
        }

        const response = await userProfile({
          user_token: token,
        });
        console.log(response.data);
        if (response.data) {
          const user = response.data;
          setFormData({
            fullName: user.full_name || "",
            email: user.email || "",
            jobTitle: user.job || "",
            company: user.company || "",
          });
          console.log("User data:", user.profile_picture);
          if (user.profile_picture) {
            // Check if it's a full URL or a relative path
            console.log("User profile image found");
            let fullImageUrl = user.profile_picture;
            if (!fullImageUrl.startsWith("http")) {
              // It's a relative path, add the base URL
              fullImageUrl = API_BASE_URL + fullImageUrl;
            }
            // Add cache-busting parameter for initial load
            const imageWithCacheBuster = `${fullImageUrl}?t=${new Date().getTime()}`;
            console.log("Using complete image URL:", imageWithCacheBuster);
            setPreview(imageWithCacheBuster);

            // Update sidebar with the new profile image
            const event = new CustomEvent("profile-updated", {
              detail: {
                name: user.full_name,
                profileImage: imageWithCacheBuster,
              },
            });
            window.dispatchEvent(event);
            // Also dispatch an empty event to trigger a full profile refresh
            const refreshEvent = new CustomEvent("profile-updated", {
              detail: {},
            });
            setTimeout(() => window.dispatchEvent(refreshEvent), 300);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        alert("Failed to fetch user profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserSettings = async () => {
      try {
        console.log("Starting to fetch user settings");
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        if (!token) {
          console.error("No access token found");
          return;
        }

        console.log("Making API call to fetch settings");
        const response = await userSettings({
          user_token: token,
        });

        console.log("Settings API Response:", response.data);

        if (response.data) {
          const settings = response.data;
          console.log("Settings object:", settings);
          console.log("Settings keys available:", Object.keys(settings));

          // Map API values to form fields
          let aiProviderValue = "openai";
          if (settings.ai_provider) {
            const provider = settings.ai_provider.toLowerCase();
            if (provider.includes("google")) {
              aiProviderValue = "google";
            } else {
              aiProviderValue = "openai";
            }
          }

          const updatedApiKeyData = {
            aiType: settings.agent_type === "RAG" ? "rag" : "chat",
            aiProvider: aiProviderValue,
            aiModel: settings.ai_model.split("/").pop() || "gpt-4",
            openaiApiKey: settings.openai_key || "",
            geminiApiKey: settings.google_key || "",
            temperature: settings.temperature || 0.7,
            max_tokens: settings.max_tokens || 2048,
          };

          console.log("Updated apiKeyData:", updatedApiKeyData);
          setApiKeyData(updatedApiKeyData);

          // Set connection status if keys are available
          setConnectionStatus({
            isConnected: !!(
              (aiProviderValue === "openai" && settings.openai_key) ||
              (aiProviderValue === "google" && settings.google_key)
            ),
            provider:
              settings.ai_provider +
              " " +
              (settings.ai_model.split("/").pop() || ""),
          });
        }
      } catch (error) {
        console.error("Failed to fetch user settings:", error);
        // If settings fail to load, we'll use the defaults already set in state
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserSettings();
  }, []);

  // Form validation and submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job Title is required";
    if (!formData.company.trim())
      newErrors.company = "Company Name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }

      const response = await userProfile({
        user_token: token,
        full_name: formData.fullName,
        email: formData.email,
        job: formData.jobTitle,
        company: formData.company,
        // Don't include profile_image here as we now have a dedicated endpoint
      });

      if (response.data && response.data.success) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);

        // Update sidebar by dispatching an event
        const event = new CustomEvent("profile-updated", {
          detail: {
            name: formData.fullName,
            profileImage: preview,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Failed to update user profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel → Reset form
  const handleCancel = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }

      const response = await userProfile({
        user_token: token,
      });

      if (response.data && response.data.user) {
        const user = response.data.user;
        setFormData({
          fullName: user.full_name || "",
          email: user.email || "",
          jobTitle: user.job || "",
          company: user.company || "",
        });

        if (user.profile_picture) {
          // Check if it's a full URL or a relative path
          let fullImageUrl = user.profile_picture;
          if (!fullImageUrl.startsWith("http")) {
            // It's a relative path, add the base URL
            fullImageUrl = API_BASE_URL + fullImageUrl;
          }
          // Add cache-busting parameter for reset
          const imageWithCacheBuster = `${fullImageUrl}?t=${new Date().getTime()}`;
          console.log("Reset profile image URL:", imageWithCacheBuster);
          setPreview(imageWithCacheBuster);

          // Update sidebar with the reset profile image
          const event = new CustomEvent("profile-updated", {
            detail: {
              name: user.full_name,
              profileImage: imageWithCacheBuster,
            },
          });
          window.dispatchEvent(event);
          // Also dispatch an empty event to trigger a full profile refresh
          const refreshEvent = new CustomEvent("profile-updated", {
            detail: {},
          });
          setTimeout(() => window.dispatchEvent(refreshEvent), 300);
        }
      }
    } catch (error) {
      console.error("Failed to reset user profile:", error);
      alert("Failed to reset form. Please try again.");
    } finally {
      setLoading(false);
      setErrors({});
    }
  };

  // Handle integration connection
  const handleConnect = (integrationName) => {
    setIntegrations((prev) => ({
      ...prev,
      [integrationName]: !prev[integrationName],
    }));

    const newStatus = !integrations[integrationName];
    if (newStatus) {
      alert(
        `${integrationName.charAt(0).toUpperCase() + integrationName.slice(1)} connected successfully!`,
      );
    } else {
      alert(
        `${integrationName.charAt(0).toUpperCase() + integrationName.slice(1)} disconnected.`,
      );
    }
  };

  // Handle additional settings toggle
  // eslint-disable-next-line no-unused-vars
  const handleSettingToggle = (settingName) => {
    setAdditionalSettings((prev) => ({
      ...prev,
      [settingName]: !prev[settingName],
    }));
  };

  // Handle select dropdown change
  // eslint-disable-next-line no-unused-vars
  const handleSelectChange = (e) => {
    setAdditionalSettings((prev) => ({
      ...prev,
      sessionTimeout: e.target.value,
    }));
  };

  // Handle action buttons
  // eslint-disable-next-line no-unused-vars
  const handleActionButton = (action) => {
    switch (action) {
      case "enable2FA":
        alert("Two-Factor Authentication setup would be initiated here");
        break;
      case "manageKeys":
        alert("API Key management interface would open here");
        break;
      case "exportData":
        alert("Data export process would start here");
        break;
      case "resetSettings":
        if (
          window.confirm(
            "Are you sure you want to reset all settings to default?",
          )
        ) {
          setAdditionalSettings({
            emailNotifications: true,
            pushNotifications: true,
            weeklyReports: false,
            dataAnalytics: true,
            sessionTimeout: "30",
          });
          alert("Settings have been reset to default values");
        }
        break;
      default:
        break;
    }
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    // Validate old password
    if (!passwordData.oldPassword.trim()) {
      newErrors.oldPassword = "Current password is required";
    }

    // Validate new password
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }

      const response = await resetPassword({
        user_token: token,
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      });

      console.log("Password reset response:", response.data);

      // Clear form data first
      setPasswordData({
        oldPassword: "",
        newPassword: "",
      });
      setPasswordErrors({});
      setShowNewPassword(false);
      setShowOldPassword(false);

      // Show success message
      setIsPasswordSuccess(true);
      setTimeout(() => setIsPasswordSuccess(false), 5000);
    } catch (error) {
      console.error("Failed to reset password:", error);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
      });
      console.error("Reset password error details:", error.response?.data);
      setPasswordErrors({
        oldPassword:
          error.response?.data?.message || "Invalid current password",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password cancel
  const handlePasswordCancel = () => {
    setPasswordData({ oldPassword: "", newPassword: "" });
    setPasswordErrors({});
    setShowOldPassword(false);
    setShowNewPassword(false);
    setIsPasswordSuccess(false);
  };

  // Handle API Key Setup changes
  const handleApiKeyChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`);
    console.log("Current apiKeyData before change:", apiKeyData);

    // Create a deep copy of the current state
    const updatedData = JSON.parse(JSON.stringify(apiKeyData));

    // Handle provider change - ensure correct fields are filled
    if (name === "aiProvider" && value !== apiKeyData.aiProvider) {
      // Reset model selection based on provider
      if (value === "openai") {
        updatedData.aiModel = "gpt-4";
      } else if (value === "google") {
        updatedData.aiModel = "gemini-pro";
      }
      updatedData[name] = value;

      // Force render by creating a new state object
      console.log("Updated state after provider change:", updatedData);
      setApiKeyData(updatedData);

      // Force re-render after state update to ensure DOM is updated
      setTimeout(() => {
        console.log("State after timeout:", apiKeyData);
      }, 100);
    } else {
      // Update the specified field
      updatedData[name] = value;
      console.log("Updated state after field change:", updatedData);
      setApiKeyData(updatedData);
    }
  };

  // Handle Save & Connect
  const handleSaveAndConnect = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }

      // Validate input
      if (
        (apiKeyData.aiProvider === "openai" && !apiKeyData.openaiApiKey) ||
        (apiKeyData.aiProvider === "google" && !apiKeyData.geminiApiKey)
      ) {
        alert("Please enter an API key for the selected provider");
        setLoading(false);
        return;
      }

      // Prepare the provider name as expected by backend
      const providerName =
        apiKeyData.aiProvider === "openai" ? "OpenAI" : "Google Gemini";

      // Prepare model name with provider prefix if needed
      const fullModelName =
        apiKeyData.aiProvider === "openai"
          ? "openai/" + apiKeyData.aiModel
          : "google/" + apiKeyData.aiModel;

      console.log("Sending settings to API:", {
        user_token: token ? "token-exists" : "no-token",
        agent_type: apiKeyData.aiType === "rag" ? "RAG" : "MEMO",
        ai_provider: providerName,
        ai_model: fullModelName,
      });

      const response = await userSettings({
        user_token: token,
        agent_type: apiKeyData.aiType === "rag" ? "RAG" : "MEMO",
        ai_provider: providerName,
        ai_model: fullModelName,
        openai_key: apiKeyData.openaiApiKey,
        google_key: apiKeyData.geminiApiKey,
        temperature: apiKeyData.temperature,
        max_tokens: apiKeyData.max_tokens,
      });

      console.log("API Response:", response.data);

      if (response.data) {
        setConnectionStatus({
          isConnected: true,
          provider: `${providerName} ${apiKeyData.aiModel}`,
        });
        alert("API keys saved and connection established! ✅");
      } else {
        alert("Failed to save settings: Unknown error");
      }
    } catch (error) {
      console.error("Failed to save user settings:", error);

      if (error.response && error.response.data && error.response.data.error) {
        alert(`Failed to save settings: ${error.response.data.error}`);
      } else {
        alert(`Failed to save settings: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.error("No access token found");
        return;
      }

      // First check if we have API keys filled in
      if (
        (apiKeyData.aiProvider === "openai" && !apiKeyData.openaiApiKey) ||
        (apiKeyData.aiProvider === "google" && !apiKeyData.geminiApiKey)
      ) {
        alert("Please enter an API key for the selected provider");
        setLoading(false);
        return;
      }

      alert("Testing connection...");

      // Validate the format of the keys
      let keyValid = false;
      if (apiKeyData.aiProvider === "openai" && apiKeyData.openaiApiKey) {
        keyValid =
          apiKeyData.openaiApiKey.startsWith("sk-") &&
          apiKeyData.openaiApiKey.length > 20;
      } else if (
        apiKeyData.aiProvider === "google" &&
        apiKeyData.geminiApiKey
      ) {
        keyValid =
          apiKeyData.geminiApiKey.startsWith("AI") &&
          apiKeyData.geminiApiKey.length > 10;
      }

      if (!keyValid) {
        alert(
          "The API key format appears to be invalid. Please check your key.",
        );
        setLoading(false);
        return;
      }

      // Prepare the provider name as expected by backend
      const providerName =
        apiKeyData.aiProvider === "openai" ? "OpenAI" : "Google Gemini";

      // Prepare model name with provider prefix if needed
      const fullModelName =
        apiKeyData.aiProvider === "openai"
          ? "openai/" + apiKeyData.aiModel
          : "google/" + apiKeyData.aiModel;

      // We'll just make a get call with our settings to test
      const response = await userSettings({
        user_token: token,
        agent_type: apiKeyData.aiType === "rag" ? "RAG" : "MEMO",
        ai_provider: providerName,
        ai_model: fullModelName,
        openai_key: apiKeyData.openaiApiKey,
        google_key: apiKeyData.geminiApiKey,
        temperature: apiKeyData.temperature,
        max_tokens: apiKeyData.max_tokens,
      });

      console.log("Test connection response:", response.data);

      // Since our backend doesn't have a dedicated test endpoint,
      // we'll consider the connection successful if the API call works
      if (response.data) {
        setConnectionStatus({
          isConnected: true,
          provider: `${providerName} ${apiKeyData.aiModel}`,
        });
        alert("Connection test successful! ✅");
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      setConnectionStatus({
        isConnected: false,
        provider: "",
      });

      if (error.response && error.response.data && error.response.data.error) {
        alert(`Connection test failed: ${error.response.data.error}`);
      } else {
        alert(
          `Connection test failed: ${error.message || "Please check your API keys and try again."}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Render tab content dynamically
  const renderTabContent = () => {
    switch (activeTab) {
      case "Profile Settings":
        return (
          <>
            <h2 style={styles.cardTitle}>Profile Picture</h2>
            <div style={styles.uploadRow}>
              <img
                src={preview}
                alt="Profile"
                style={
                  loading
                    ? { ...styles.uploadImage, opacity: 0.5 }
                    : styles.uploadImage
                }
                onError={(e) => {
                  console.error("Error loading image:", e);
                  e.target.onerror = null; // Prevent infinite fallback loop
                  e.target.src = "https://i.pravatar.cc/100?img=3"; // Fallback image
                }}
                onLoad={() => console.log("Profile image loaded successfully")}
                key={preview} // Add key to force re-render when preview changes
              />
              <div>
                <button
                  style={{
                    ...styles.uploadButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  onClick={() => !loading && fileInputRef.current.click()}
                  disabled={loading}
                >
                  <img
                    src="/assets/arrow.png"
                    alt="arrow"
                    style={styles.arrowupload}
                  />
                  <span>{loading ? "Uploading..." : "Upload New Photo"}</span>
                </button>

                <input
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  disabled={loading}
                />

                <p style={styles.uploadNote}>JPG, PNG or GIF. Max size 5MB.</p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <h2 style={styles.personalinfo}>Personal Information</h2>

              <div style={styles.formGrid}>
                {/* Full Name */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                  {errors.fullName && (
                    <span style={styles.error}>{errors.fullName}</span>
                  )}
                </div>

                {/* Email */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                  />
                  {errors.email && (
                    <span style={styles.error}>{errors.email}</span>
                  )}
                </div>

                {/* Job Title */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Job Title / Role</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    style={styles.input}
                  />
                  {errors.jobTitle && (
                    <span style={styles.error}>{errors.jobTitle}</span>
                  )}
                </div>

                {/* Company */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Company Name</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    style={styles.input}
                  />
                  {errors.company && (
                    <span style={styles.error}>{errors.company}</span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div style={styles.actionRow}>
                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <div style={styles.loadingSpinner}>
                      <span
                        style={{ ...styles.loadingDot, animationDelay: "0s" }}
                      ></span>
                      <span
                        style={{ ...styles.loadingDot, animationDelay: "0.2s" }}
                      ></span>
                      <span
                        style={{ ...styles.loadingDot, animationDelay: "0.4s" }}
                      ></span>
                    </div>
                  ) : (
                    <>
                      <img
                        src="/assets/doc.png"
                        alt="save"
                        style={styles.savebtn}
                      />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    ...styles.cancelButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>

                {isSuccess && (
                  <span style={styles.successMessage}>
                    ✓ Profile updated successfully!
                  </span>
                )}
              </div>
            </form>
          </>
        );
      case "Change Password":
        return (
          <div style={styles.passwordContainer}>
            <h2 style={styles.passwordTitle}>Set Password</h2>
            <p style={styles.passwordSubtitle}>
              Create a password for additional sign-in options
            </p>

            <form onSubmit={handlePasswordSubmit} style={styles.passwordForm}>
              {/* Old Password Field */}
              <div style={styles.passwordFieldGroup}>
                <label style={styles.passwordLabel}>Current Password</label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    style={{
                      ...styles.passwordInput,
                      borderColor: passwordErrors.oldPassword
                        ? "#dc2626"
                        : "#d1d5db",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={styles.eyeButton}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ color: "#6b7280" }}
                    >
                      {showOldPassword ? (
                        <>
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="1"
                            y1="1"
                            x2="23"
                            y2="23"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      ) : (
                        <>
                          <path
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <span style={styles.passwordError}>
                    {passwordErrors.oldPassword}
                  </span>
                )}
              </div>

              {/* New Password Field */}
              <div style={styles.passwordFieldGroup}>
                <label style={styles.passwordLabel}>Enter New Password</label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter a new password"
                    style={{
                      ...styles.passwordInput,
                      borderColor: passwordErrors.newPassword
                        ? "#dc2626"
                        : "#d1d5db",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeButton}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ color: "#6b7280" }}
                    >
                      {showNewPassword ? (
                        <>
                          <path
                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="1"
                            y1="1"
                            x2="23"
                            y2="23"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      ) : (
                        <>
                          <path
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span style={styles.passwordError}>
                    {passwordErrors.newPassword}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={styles.passwordActionRow}>
                <button
                  type="submit"
                  style={styles.passwordSaveButton}
                  disabled={loading}
                >
                  {loading ? (
                    <div style={styles.loadingSpinner}>
                      <span
                        style={{ ...styles.loadingDot, animationDelay: "0s" }}
                      ></span>
                      <span
                        style={{ ...styles.loadingDot, animationDelay: "0.2s" }}
                      ></span>
                      <span
                        style={{ ...styles.loadingDot, animationDelay: "0.4s" }}
                      ></span>
                    </div>
                  ) : (
                    <>
                      <img
                        src="/assets/doc.png"
                        alt="save"
                        style={styles.savebtn}
                      />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  style={styles.passwordCancelButton}
                >
                  Cancel
                </button>
              </div>

              {/* Success Message */}
              {isPasswordSuccess && (
                <div
                  style={{
                    marginTop: "16px",
                    textAlign: "center",
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#ecfdf5",
                    borderRadius: "6px",
                    border: "1px solid #d1fae5",
                  }}
                >
                  <span
                    style={{
                      color: "#10B981",
                      fontWeight: 500,
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                        fill="#10B981"
                      />
                    </svg>
                    Password changed successfully!
                  </span>
                </div>
              )}
            </form>
          </div>
        );

      case "Additional Settings":
        return (
          <div style={styles.additionalSettingsContainer}>
            {/* API Key Setup Section */}
            <div style={styles.apiKeySection}>
              <h2 style={styles.apiKeyTitle}>API Key Setup</h2>

              <div style={styles.apiKeyForm}>
                {/* AI Type */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>AI Type</label>
                  <select
                    name="aiType"
                    value={apiKeyData.aiType || "rag"}
                    onChange={handleApiKeyChange}
                    style={styles.apiKeySelect}
                  >
                    <option value="rag">
                      Retrieval Augmented Generation (RAG)
                    </option>
                    <option value="chat">Chat Completion</option>
                    <option value="embedding">Text Embedding</option>
                  </select>
                </div>

                {/* AI Provider */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>AI Provider</label>
                  <select
                    name="aiProvider"
                    value={apiKeyData.aiProvider}
                    onChange={handleApiKeyChange}
                    style={styles.apiKeySelect}
                    onFocus={() => {
                      console.log(
                        "Current provider value:",
                        apiKeyData.aiProvider,
                      );
                      console.log("Full apiKeyData:", apiKeyData);
                    }}
                  >
                    <option value="openai">Open AI</option>
                    <option value="google">Google</option>
                  </select>
                </div>

                {/* AI Model */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>AI Model</label>
                  <select
                    name="aiModel"
                    value={apiKeyData.aiModel || "gpt-4"}
                    onChange={handleApiKeyChange}
                    style={styles.apiKeySelect}
                  >
                    {apiKeyData.aiProvider === "openai" && (
                      <>
                        <option value="gpt-4">GPT - 4</option>
                        <option value="gpt-3.5-turbo">GPT - 3.5 Turbo</option>
                        <option value="gpt-4o">GPT - 4o</option>
                        <option value="gpt-4-turbo">GPT - 4 Turbo</option>
                      </>
                    )}
                    {apiKeyData.aiProvider === "google" && (
                      <>
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-ultra">Gemini Ultra</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Open AI API Key */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>Open AI (API Key)</label>
                  <input
                    type="text"
                    name="openaiApiKey"
                    value={apiKeyData.openaiApiKey || ""}
                    onChange={handleApiKeyChange}
                    style={{
                      ...styles.apiKeyInput,
                      opacity: apiKeyData.aiProvider === "openai" ? 1 : 0.5,
                    }}
                    placeholder="Enter your OpenAI API key"
                    disabled={apiKeyData.aiProvider !== "openai"}
                  />
                </div>

                {/* Google Gemini API Key */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>
                    Google Gemini (API Key)
                  </label>
                  <input
                    type="text"
                    name="geminiApiKey"
                    value={apiKeyData.geminiApiKey || ""}
                    onChange={handleApiKeyChange}
                    style={{
                      ...styles.apiKeyInput,
                      opacity: apiKeyData.aiProvider === "google" ? 1 : 0.5,
                    }}
                    placeholder="Enter your Google Gemini API key"
                    disabled={apiKeyData.aiProvider !== "google"}
                  />
                </div>

                {/* Temperature */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>Temperature</label>
                  <input
                    type="number"
                    name="temperature"
                    value={apiKeyData.temperature}
                    onChange={handleApiKeyChange}
                    min="0"
                    max="1"
                    step="0.1"
                    style={styles.apiKeyInput}
                    placeholder="Temperature (0.0-1.0)"
                  />
                </div>

                {/* Max Tokens */}
                <div style={styles.apiKeyFieldGroup}>
                  <label style={styles.apiKeyLabel}>Max Tokens</label>
                  <input
                    type="number"
                    name="max_tokens"
                    value={apiKeyData.max_tokens}
                    onChange={handleApiKeyChange}
                    min="1"
                    max="8192"
                    style={styles.apiKeyInput}
                    placeholder="Maximum token count"
                  />
                </div>

                {/* Action Buttons */}
                <div style={styles.apiKeyActionRow}>
                  <button
                    style={styles.saveConnectButton}
                    onClick={handleSaveAndConnect}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save & Connect"}
                  </button>
                  <button
                    style={styles.testConnectionButton}
                    onClick={handleTestConnection}
                    disabled={loading}
                  >
                    {loading ? "Testing..." : "Test Connection"}
                  </button>
                </div>

                {/* Connection Status */}
                {connectionStatus.isConnected && (
                  <div style={styles.connectionStatus}>
                    <div style={styles.statusIcon}>
                      <img
                        src="/assets/bot.png"
                        alt="save"
                        style={styles.statusIcon}
                      />
                    </div>
                    <span style={styles.statusText}>AI Integration Status</span>

                    <div style={styles.statusConnected}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13.3334 4L6.00008 11.3333L2.66675 8"
                          stroke="#16A34A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span style={styles.connectedText}>Connected</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Integrations Section */}
            <div style={styles.integrationsSection}>
              <h2 style={styles.integrationsTitle}>Integrations</h2>
              <p style={styles.integrationsSubtitle}>Connect Your Accounts</p>

              <div style={styles.integrationsList}>
                {/* Hotjar Integration */}
                <div style={styles.integrationItem}>
                  <div style={styles.integrationHeader}>
                    <div style={styles.integrationInfo}>
                      <div style={styles.hotjarIcon}>
                        <span style={styles.hotjarText}>
                          <img
                            src="/assets/hotjar.png"
                            alt="save"
                            style={styles.hotjarIcon}
                          />
                        </span>
                      </div>
                      <div>
                        <h3 style={styles.integrationName}>Hotjar</h3>
                        <p style={styles.integrationDescription}>
                          Track user behavior and heatmaps.
                        </p>
                      </div>
                    </div>
                    {integrations.hotjar ? (
                      <div style={styles.connectedStatus}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M13.3334 4L6.00008 11.3333L2.66675 8"
                            stroke="#16A34A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span style={styles.connectedText}>Connected</span>
                      </div>
                    ) : (
                      <button
                        style={styles.connectButton}
                        onClick={() => handleConnect("hotjar")}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Shopify Integration */}
                <div style={styles.integrationItem}>
                  <div style={styles.integrationHeader}>
                    <div style={styles.integrationInfo}>
                      <div style={styles.shopifyIcon}>
                        <img
                          src="/assets/shopify.png"
                          alt="save"
                          style={styles.shopifyIcon}
                        />
                      </div>
                      <div>
                        <h3 style={styles.integrationName}>Shopify</h3>
                        <p style={styles.integrationDescription}>
                          Sync store performance and product data.
                        </p>
                      </div>
                    </div>
                    {integrations.shopify ? (
                      <div style={styles.connectedStatus}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M13.3334 4L6.00008 11.3333L2.66675 8"
                            stroke="#16A34A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span style={styles.connectedText}>Connected</span>
                      </div>
                    ) : (
                      <button
                        style={styles.connectButton}
                        onClick={() => handleConnect("shopify")}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Google Analytics Integration */}
                <div style={styles.integrationItem}>
                  <div style={styles.integrationHeader}>
                    <div style={styles.integrationInfo}>
                      <div style={styles.googleIcon}>
                        <img
                          src="/assets/google.png"
                          alt="save"
                          style={styles.googleIcon}
                        />
                      </div>
                      <div>
                        <h3 style={styles.integrationName}>Google Analytics</h3>
                        <p style={styles.integrationDescription}>
                          Import website traffic and conversion data.
                        </p>
                      </div>
                    </div>
                    {integrations.googleAnalytics ? (
                      <div style={styles.connectedStatus}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M13.3334 4L6.00008 11.3333L2.66675 8"
                            stroke="#16A34A"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span style={styles.connectedText}>Connected</span>
                      </div>
                    ) : (
                      <button
                        style={styles.connectButton}
                        onClick={() => handleConnect("googleAnalytics")}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );
  React.useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // const isTablet = windowWidth <= 1024;
  const isMobile = windowWidth <= 768;

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.wrapper}>
        <header style={{ ...styles.header, gap: isMobile ? 12 : 20 }}>
          <img
            src="/assets/settinggradient.png"
            alt="logo"
            style={styles.logo}
          />
          <div>
            <h1 style={styles.title}>User Settings</h1>
          </div>
        </header>

        {/* Tabs */}
        <div style={styles.settingsHeader}>
          <nav style={styles.tabs}>
            {["Profile Settings", "Change Password", "Additional Settings"].map(
              (tab) => (
                <button
                  key={tab}
                  style={activeTab === tab ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {activeTab === tab && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: -7,
                        left: 0,
                        width: "100%",
                        height: 3,
                        borderRadius: 2,
                        background: "linear-gradient(90deg, #2F46BC, #E43D54)",
                      }}
                    />
                  )}
                </button>
              ),
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <main
          style={{ ...styles.main, padding: isMobile ? "16px" : "30px 40px" }}
        >
          <section
            style={{ ...styles.card, marginLeft: isMobile ? "0" : "286px" }}
          >
            {renderTabContent()}
          </section>
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    width: "100vw",
    justifyContent: "center",
  },
  wrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    borderBottom: "1px solid #e5e7eb",
    height: "90px",
  },
  logo: { width: 50, height: 50, marginLeft: "30px" },
  title: { margin: 0, fontSize: 24, fontWeight: "600", color: "#111827" },

  settingsHeader: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e7eb",
    marginLeft: "3px",
    marginTop: "1px",
    height: "50px",
  },
  tabs: {
    display: "flex",
    gap: 30, // space between tabs
    marginLeft: "50px",
    fontSize: 16,
    fontWeight: 500,
    position: "relative",
  },
  tab: {
    border: "none",
    background: "none",
    color: "#6b7280",
    cursor: "pointer",
    position: "relative",
    marginTop: "18px",
    fontSize: 16,
    fontWeight: 500,
  },
  activeTab: {
    border: "none",
    background: "none",
    fontSize: 16,
    fontWeight: 500,
    color: "#111827",
    cursor: "pointer",
    position: "relative",
    marginTop: "18px",
  },
  main: {
    padding: "30px 40px",
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    width: "796px",
    minHeight: "auto",
    marginLeft: "286px",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
    color: "#111827",
  },
  personalinfo: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
    color: "#1E293B",
    fontFamily: "Inter",
  },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },
  uploadImage: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    objectFit: "cover",
  },
  uploadButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    color: "#161515",
    border: "1px solid #ADAEBC",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    background: "transparent",
  },
  arrowupload: { width: 18, height: 18 },
  uploadNote: { fontSize: 14, color: "#64748B", marginTop: 6 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
    fontFamily: "Inter",
  },
  formGroup: { display: "flex", flexDirection: "column" },
  label: { fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#334155" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    color: "#111827",
    height: 50,
  },
  actionRow: { display: "flex", alignItems: "center", gap: "12px" },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter",
  },
  savebtn: { width: 18, height: 18 },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#E5E7EB",
    color: "#475569",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter",
  },
  error: { fontSize: 12, color: "red", marginTop: 4 },

  // Additional Settings Styles
  additionalSettingsContainer: { maxWidth: "100%" },

  // API Key Setup Styles
  apiKeySection: {
    marginBottom: 40,
    paddingBottom: 32,
    borderBottom: "1px solid #f1f5f9",
  },
  apiKeyTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 24,
    marginLeft: "4px",
  },
  apiKeyForm: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  apiKeyFieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  apiKeyLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },
  apiKeySelect: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#111827",
    cursor: "pointer",
  },
  apiKeyInput: {
    padding: "12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  apiKeyActionRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  saveConnectButton: {
    padding: "12px 24px",
    background: "linear-gradient(90deg, #2F46BC, #E43D54)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
  },
  testConnectionButton: {
    padding: "12px 24px",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: 8,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
  },
  connectionStatus: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    padding: "12px 16px",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  statusIcon: {
    height: 24,
    width: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 500,
    flex: 1,
  },
  statusConnected: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  connectedText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: 500,
  },

  // Section Styles
  settingsSection: {
    marginBottom: 40,
    paddingBottom: 32,
    borderBottom: "1px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 8,
    marginLeft: "4px",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 24,
    marginLeft: "2px",
  },

  // Settings List Styles
  settingsList: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  settingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    minHeight: "80px",
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: 500,
    color: "#111827",
    margin: "0 0 4px 0",
  },
  settingDescription: {
    fontSize: 14,
    color: "#4B5563",
    margin: 0,
    lineHeight: "20px",
    fontWeight: 400,
  },

  // Toggle Switch Styles
  toggleSwitch: {
    position: "relative",
    display: "inline-block",
    width: 52,
    height: 28,
    cursor: "pointer",
  },
  toggleSlider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#cbd5e1",
    borderRadius: 28,
    transition: "0.3s",
    "&::before": {
      position: "absolute",
      content: '""',
      height: 20,
      width: 20,
      left: 4,
      bottom: 4,
      backgroundColor: "white",
      borderRadius: "50%",
      transition: "0.3s",
    },
  },

  // Button Styles
  enableButton: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
  },
  manageButton: {
    padding: "8px 16px",
    background: "transparent",
    color: "#2F46BC",
    border: "1px solid #2F46BC",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
  },
  resetButton: {
    padding: "8px 16px",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
  },

  // Select Dropdown Styles
  selectDropdown: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#111827",
    cursor: "pointer",
    minWidth: 120,
  },

  // Integrations Section Styles
  integrationsSection: {
    marginBottom: 40,
    paddingBottom: 32,
  },
  integrationsTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 8,
    marginLeft: "4px",
  },
  integrationsSubtitle: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 24,
    marginLeft: "2px",
  },

  // Integrations List Styles
  integrationsList: { display: "flex", flexDirection: "column", gap: 16 },
  integrationItem: {
    padding: 20,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    minHeight: "80px",
  },
  integrationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  integrationInfo: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: 500,
    color: "#111827",
    margin: "0 0 4px 0",
  },
  integrationDescription: {
    fontSize: 14,
    color: "#4B5563",
    margin: 0,
    lineHeight: "20px",
    fontWeight: 400,
  },

  // Integration Icons
  hotjarIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#fd3a69",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  hotjarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  shopifyIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#96bf48",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#4285f4",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  googleText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Connection Status
  connectedStatus: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  // Buttons
  connectButton: {
    padding: "8px 20px",
    background: "linear-gradient(90deg, #2F46BC, #E43D54)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  connectedButton: {
    padding: "8px 16px",
    background: "transparent",
    color: "#16A34A",
    border: "1px solid #16A34A",
    borderRadius: 6,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  tickIcon: {
    width: 16,
    height: 16,
  },
  iconinteg: { width: 48, height: 48 },

  // Password Change Styles
  passwordContainer: { maxWidth: "100%" },
  passwordTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 8,
    marginLeft: "4px",
  },
  passwordSubtitle: {
    fontSize: 18,
    color: "#000000",
    fontWeight: 400,
    marginBottom: 24,
    marginLeft: "2px",
    paddingBottom: 16,
    borderBottom: "1px solid #E5E7EB",
  },
  passwordForm: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  passwordFieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  passwordInputContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "12px 48px 12px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
    "&:focus": {
      outline: "none",
      borderColor: "#2F46BC",
      boxShadow: "0 0 0 3px rgba(47, 70, 188, 0.1)",
    },
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  passwordError: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 4,
  },
  passwordActionRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  passwordSaveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
  },
  lockIcon: {
    width: 18,
    height: 18,
  },
  passwordCancelButton: {
    padding: "12px 20px",
    backgroundColor: "transparent",
    color: "#6b7280",
    border: "none",
    borderRadius: 8,
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
  },
  successMessage: {
    color: "#10B981",
    fontWeight: 500,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    background: "#ecfdf5",
    padding: "8px 16px",
    borderRadius: "6px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #d1fae5",
  },
  loadingSpinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    backgroundColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animationName: "dotPulse",
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    animationDelay: "0s",
  },
};

// Add keyframes animation for loading dots
if (typeof window !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = `
  @keyframes dotPulse {
    0%, 20% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.4); }
    100% { opacity: 0.3; transform: scale(1); }
  }
  `;
  document.head.appendChild(styleElement);
}

export default SettingsPage;
