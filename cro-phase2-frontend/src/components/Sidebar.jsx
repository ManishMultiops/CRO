import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getChatThreads, getCurrentChatThread, userProfile } from "../api/api";
import { API_BASE_URL } from "../api/api";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "Alex Johnson",
    avatar: "https://i.pravatar.cc/40?img=3",
  });

  const navItems = [
    {
      key: "AI Chat",
      path: "/initalchat",
      icon1: "/assets/Group.png",
      icon2: "/assets/aichatlinear.png",
    },
    {
      key: "Analytics",
      path: "/analytics",
      icon1: "/assets/bot.png",
      icon2: "/assets/chatbot.png",
    },
    {
      key: "Files",
      path: "/document",
      icon1: "/assets/Documents.png",
      icon2: "/assets/Documents.png",
    },
  ];

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch chat threads when component mounts
  // Track window width for responsive display
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load user profile data
  // Function to fetch user profile - can be called from anywhere
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await userProfile({
        user_token: token,
      });

      if (response.data) {
        const user = response.data;
        console.log("Sidebar: received profile data:", user);

        // Handle profile picture
        let avatarUrl = "https://i.pravatar.cc/40?img=3"; // Default
        if (user.profile_picture) {
          // Check if it's a full URL or a relative path
          let fullImageUrl = user.profile_picture;
          if (!fullImageUrl.startsWith("http")) {
            // It's a relative path, add the base URL
            fullImageUrl = API_BASE_URL + fullImageUrl;
          }
          // Add cache-busting parameter for server-side images
          avatarUrl = `${fullImageUrl}?t=${new Date().getTime()}`;
          console.log("Sidebar: using avatar URL:", avatarUrl);
        }

        setUserData({
          name: user.full_name || "User",
          avatar: avatarUrl,
        });
      }
    } catch (error) {
      console.error("Failed to fetch user profile for sidebar:", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUserProfile();

    // Set up interval to refresh profile every 5 minutes
    const intervalId = setInterval(
      () => {
        fetchUserProfile();
      },
      5 * 60 * 1000,
    );

    // Listen for profile updates from Settings page
    const handleProfileUpdate = (event) => {
      console.log("Sidebar: received profile update event", event.detail);
      const { name, profileImage } = event.detail;

      if (name || profileImage) {
        setUserData((prevData) => ({
          name: name || prevData.name,
          avatar: profileImage || prevData.avatar,
        }));
      } else {
        // If no specific details provided, fetch the full profile
        fetchUserProfile();
      }
    };

    // Add event listeners
    window.addEventListener("profile-updated", handleProfileUpdate);

    // Clean up interval and event listener on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  // Function to handle creating a new chat
  const handleNewChat = async () => {
    try {
      // Clear existing chat_id from localStorage
      localStorage.removeItem("chat_id");

      // Create a new thread on the server with create_new parameter
      const userToken = localStorage.getItem("accessToken");
      if (userToken) {
        const response = await getCurrentChatThread({
          user_token: userToken,
          create_new: true,
        });
        if (response.data && response.data.chat_id) {
          localStorage.setItem("chat_id", response.data.chat_id);

          // Dispatch a custom event to trigger chat initialization
          const event = new CustomEvent("new-chat-created", {
            detail: { chatId: response.data.chat_id },
          });
          window.dispatchEvent(event);
        }
      }

      // Navigate to chat page (it will be blank)
      navigate("/initalchat");

      // Refresh thread list
      fetchChatThreads();
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  // Function to handle selecting a chat thread
  const handleChatSelect = (chatId) => {
    localStorage.setItem("chat_id", chatId);

    // You could also dispatch a custom event to notify other components
    const event = new CustomEvent("chat-selected", { detail: { chatId } });
    window.dispatchEvent(event);

    // Navigate to chat page
    navigate("/initalchat");
  };

  // Function to fetch chat threads
  const fetchChatThreads = async () => {
    try {
      setIsLoading(true);
      const userToken = localStorage.getItem("accessToken");
      if (!userToken) {
        console.warn("User token not found in localStorage");
        setIsLoading(false);
        return;
      }

      const response = await getChatThreads({ user_token: userToken });
      if (response.data && response.data.threads) {
        setChatThreads(response.data.threads);
      }
    } catch (error) {
      console.error("Failed to fetch chat threads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatThreads();

    // Set up event listener for chat updates
    const handleChatUpdate = () => {
      fetchChatThreads();
    };

    window.addEventListener("chat-updated", handleChatUpdate);

    return () => {
      window.removeEventListener("chat-updated", handleChatUpdate);
    };
  }, []);

  // Function to format timestamp to relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 172800) {
      return "Yesterday";
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
  };

  const sidebarStyle = {
    ...styles.sidebar,
    width:
      window.innerWidth <= 1024 ? (isMobileOpen ? "280px" : "72px") : "320px",
    padding:
      window.innerWidth <= 1024 ? (isMobileOpen ? "20px" : "16px 8px") : "20px",
  };

  return (
    <aside style={sidebarStyle}>
      <header style={styles.header}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={styles.logo}></div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: 8,
            }}
            aria-label="Toggle sidebar"
          ></button>
        </div>
      </header>

      <nav
        style={{
          ...styles.nav,
          alignItems:
            isMobileOpen || window.innerWidth > 1024 ? "stretch" : "center",
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navLink,
                ...(isActive ? styles.activeNavLink : {}),
                justifyContent:
                  isMobileOpen || window.innerWidth > 1024
                    ? "flex-start"
                    : "center",
              }}
            >
              <img
                src={isActive ? item.icon2 : item.icon1}
                alt={item.key}
                style={styles.navIcon}
              />
              {(isMobileOpen || window.innerWidth > 1024) && (
                <span
                  style={{
                    ...styles.navText,
                    background: isActive
                      ? "linear-gradient(90deg, #2F46BC, #E43D54)"
                      : "none",
                    WebkitBackgroundClip: isActive ? "text" : "unset",
                    backgroundClip: isActive ? "text" : "unset",
                    color: isActive ? "transparent" : "#333",
                  }}
                >
                  {item.key}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {(isMobileOpen || window.innerWidth > 1024) && (
        <section style={styles.recentChatsSection}>
          <div style={styles.recentChatsHeader}>
            <h3 style={styles.recentChatsTitle}>Recent Chats</h3>
            <button
              style={styles.newChatButton}
              onClick={() => handleNewChat()}
            >
              <span style={styles.newChatIcon}>+</span>
              <span>New Chat</span>
            </button>
          </div>
          {isLoading ? (
            <div style={styles.loadingState}>Loading chats...</div>
          ) : chatThreads.length > 0 ? (
            <ul style={styles.chatList}>
              {chatThreads.map((thread) => (
                <li
                  key={thread.chat_id}
                  style={styles.chatItem}
                  onClick={() => handleChatSelect(thread.chat_id)}
                >
                  <div style={styles.chatTitle}>
                    {thread.last_message
                      ? windowWidth <= 768
                        ? thread.chat_id.substring(0, 8)
                        : thread.last_message.substring(
                            0,
                            Math.min(40, thread.last_message.length),
                          ) + (thread.last_message.length > 40 ? "..." : "")
                      : windowWidth <= 768
                        ? thread.chat_id.substring(0, 8)
                        : "Unnamed Chat"}
                  </div>
                  <div style={styles.chatTime}>
                    {windowWidth <= 768
                      ? formatRelativeTime(thread.last_updated).replace(
                          / ago$/,
                          "",
                        )
                      : formatRelativeTime(thread.last_updated)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.emptyState}>No chat history found</div>
          )}
        </section>
      )}

      {(isMobileOpen || window.innerWidth > 1024) && (
        <button style={styles.upgradeButton}>✨ Upgrade Now</button>
      )}

      <footer style={styles.footer}>
        <img
          src={userData.avatar}
          alt="User Avatar"
          style={{ ...styles.avatar, objectFit: "cover" }}
        />
        <div style={styles.userInfo}>
          <div style={styles.userName}>{userData.name}</div>
          {/* <div style={styles.userPlan}>Free Plan</div>*/}
        </div>

        <div style={{ position: "relative" }}>
          {/* Dropdown Arrow Button */}
          <button
            style={styles.dropdownToggle}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img
              src="/assets/dropdown.png"
              alt="Dropdown"
              style={{
                ...styles.dropdownArrow,
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div style={styles.dropdownMenu}>
              <button
                style={styles.dropdownItem}
                onClick={() => navigate("/setting")}
              >
                Account Settings
              </button>
              <button
                style={styles.dropdownItem}
                onClick={() => navigate("/help-support")}
              >
                Help & Support
              </button>
              <button
                style={{ ...styles.dropdownItem, color: "red" }}
                onClick={() => {
                  // Clear ALL items from localStorage
                  localStorage.clear();

                  // Redirect to login page
                  navigate("/login");
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </footer>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: "320px",
    height: "100vh",
    backgroundColor: "#fff",
    borderRight: "1px solid #ddd",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    left: 0,
    zIndex: 100,
  },
  header: {
    marginBottom: 20,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 20,
  },
  logo: {
    backgroundImage: "url('/assets/crologoblack.png')",
    width: "189px",
    height: "69px",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    marginBottom: "-19px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 30,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 16,
    color: "#333",
    transition: "all 0.3s ease",
  },
  activeNavLink: {
    background: "linear-gradient(90deg, #ECEDFA, #FBDDE3)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navText: {
    userSelect: "none",
    fontSize: "16px",
    fontStyle: "normal",
  },
  recentChatsSection: {
    flexGrow: 1,
    overflowY: "auto",
    marginBottom: 30,
    maxHeight: "calc(100vh - 220px)",
  },
  recentChatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  chatList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  chatItem: {
    padding: "12px 8px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    transition: "background 0.2s ease",
    borderRadius: "6px",
    "&:hover": {
      background: "#f7f7f7",
    },
  },
  chatTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
    marginBottom: "2px",
  },
  chatTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: "4px",
  },
  messagePreview: {
    fontSize: 12,
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  loadingState: {
    padding: "20px 0",
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
  emptyState: {
    padding: "20px 0",
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
  recentChatsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  newChatButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 8px",
    backgroundColor: "#f0f7ff",
    border: "1px solid #d1e3ff",
    borderRadius: "6px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  newChatIcon: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  upgradeButton: {
    background: "linear-gradient(90deg, #2F46BC, #E43D54)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 0",
    fontWeight: "700",
    fontSize: 16,
    cursor: "pointer",
    marginBottom: 20,
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "#f3f4f6",
  },
  userInfo: {
    flexGrow: 1,
  },
  userName: {
    fontWeight: "700",
    fontSize: 14,
    color: "#333",
  },
  userPlan: {
    fontSize: 12,
    color: "#999",
  },
  menuButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    width: 24,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    backgroundColor: "#333",
    margin: "2px auto",
  },
  dropdown: {
    position: "absolute",
    bottom: "40px",
    right: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 8,
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    zIndex: 100,
    minWidth: 160,
  },

  dropdownToggle: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownArrow: {
    width: 18,
    height: 18,
  },
  dropdownMenu: {
    position: "absolute",
    bottom: "40px",
    right: 0,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 100,
    minWidth: 180,
    overflow: "hidden",
  },
  dropdownItem: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 14,
    color: "#333",
    fontWeight: 500,
    transition: "background 0.2s",
  },

  dropdownText: {
    fontSize: 14,
    color: "#333",
    fontWeight: 500,
  },
  settingsIcon: { width: 20, height: 20 },
  logoutIcon: { width: 20, height: 20 },
};

export default Sidebar;
