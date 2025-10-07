import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import {
  sendChatMessage,
  getCurrentChatThread,
  generateCROAudit,
  getChatHistory,
} from "../api/api";

const BOT_WELCOME_MESSAGE = `Welcome to CRO AI! 👋
I’m here to help you unlock the full potential of your website. By analyzing performance metrics like bounce rates,
conversion funnels, and engagement patterns, I’ll identify exactly where users drop off and what’s holding back
conversions. You’ll receive clear, data-driven insights along with actionable recommendations to improve your product
pages, checkout flow, and overall user experience.`;

const ChatUI = () => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(true); // For typing indicator on initial load
  const [reportName, setReportName] = useState(null); // State to store report name
  const [showReportName, setShowReportName] = useState(false); // State to toggle report name visibility
  const [isSendingMessage, setIsSendingMessage] = useState(false); // State to track message sending status
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // State to track history loading
  const [hasSuggestionIcon, setHasSuggestionIcon] = useState(false); // Controls when to show the suggestion toggle
  const [userInteracted, setUserInteracted] = useState(false); // Track if user has interacted with chat
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const suggestions = [
    "How is my product page conversion rate?",
    "What's causing drop-offs in my checkout process?",
    "Weak funnel steps?",
    "How is my website performing overall?",
    "Bots/signups?",
    "Can you summarize my top conversion opportunities?",
    "Show me trends in my conversion rates.",
    "Mobile performance?",
    "How do I improve trust and credibility on my site?",
    "Success? Trends?",
    "What UX issues should I not miss?",
    "Is my CPA placement effective?",
    "What UX improvements can I make to increase engagement?",
  ];

  // Define message functions with useCallback
  const addBotMessage = useCallback(
    (text) => {
      setMessages((prev) => [...prev, { id: Date.now(), text, sender: "bot" }]);
    },
    [setMessages],
  );

  const addUserMessage = useCallback(
    (text) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text, sender: "user" },
      ]);
    },
    [setMessages],
  );

  // Function to load chat history
  const loadChatHistory = useCallback(
    async (chatId, userToken) => {
      if (!chatId || !userToken) return;

      try {
        setIsLoadingHistory(true);
        setMessages([]); // Clear current messages
        setIsTyping(true); // Show typing indicator while loading

        const response = await getChatHistory({
          user_token: userToken,
          chat_id: chatId,
        });

        if (
          response.data &&
          response.data.messages &&
          response.data.messages.length > 0
        ) {
          // Convert API message format to our app format
          const formattedMessages = response.data.messages.map((msg) => ({
            id: Date.now() + Math.random(), // Generate unique ID
            text: msg.message,
            sender: msg.sender.toLowerCase(), // Assuming API returns "USER", "BOT", etc.
          }));

          setMessages(formattedMessages);

          // Check if there's a report associated with this chat
          if (response.data.report_name) {
            const reportPart = response.data.report_name.split(" for ")[0];
            setReportName(reportPart);
            setShowReportName(true);
          }

          // Also update report_id if available
          if (response.data.report_id) {
            localStorage.setItem("report_id", response.data.report_id);
          }
        } else {
          // If no messages found for this chat, show welcome message
          setTimeout(() => {
            setIsTyping(false);
            addBotMessage(BOT_WELCOME_MESSAGE);
          }, 1000);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // Show welcome message if there was an error loading history
        setTimeout(() => {
          addBotMessage(BOT_WELCOME_MESSAGE);
        }, 1000);
      } finally {
        setIsTyping(false);
        setIsLoadingHistory(false);
      }
    },
    [
      setIsLoadingHistory,
      setMessages,
      setIsTyping,
      setReportName,
      setShowReportName,
      addBotMessage,
    ],
  );

  useEffect(() => {
    // On mount show typing indicator, after 2.5s show welcome message from bot on left side
    // Also make API call to send user_token and store chat_id in localStorage
    const initializeChat = async () => {
      try {
        const user_token = localStorage.getItem("accessToken");
        if (!user_token) {
          console.warn("User token not found in localStorage");
          return;
        }

        // Check if we have a chat_id in localStorage (might be from clicking a thread)
        const existingChatId = localStorage.getItem("chat_id");

        if (existingChatId) {
          // Load chat history for this chat_id
          await loadChatHistory(existingChatId, user_token);
        } else {
          // Get or create a new chat thread
          // Check if this is a fresh new chat (no chat_id in localStorage means new session)
          const response = await getCurrentChatThread({
            user_token,
            create_new: true, // Always create new chat when no existing chat_id
          });
          console.log(response.data);
          const { chat_id } = response.data || {};
          const { report_id } = response.data || {};
          if (chat_id) {
            localStorage.setItem("chat_id", chat_id);
          } else {
            console.warn("chat_id not found in response");
          }
          if (report_id) {
            localStorage.setItem("report_id", report_id);
          } else {
            console.warn("report_id not found in response");
          }

          // Show welcome message for new chats
          const timer = setTimeout(() => {
            setIsTyping(false);
            addBotMessage(BOT_WELCOME_MESSAGE);
          }, 2500);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setIsTyping(false);
      }
    };

    initializeChat();

    // Listen for chat selection events from sidebar
    const handleChatSelected = (event) => {
      const { chatId } = event.detail;
      if (chatId) {
        const user_token = localStorage.getItem("accessToken");
        loadChatHistory(chatId, user_token);
      }
    };

    // Listen for new chat created events
    const handleNewChatCreated = (event) => {
      const { chatId } = event.detail;
      if (chatId) {
        setMessages([]); // Clear existing messages
        setIsTyping(true); // Show typing indicator

        // Show welcome message for new chats
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(BOT_WELCOME_MESSAGE);
        }, 1500);
      }
    };

    window.addEventListener("chat-selected", handleChatSelected);
    window.addEventListener("new-chat-created", handleNewChatCreated);

    return () => {
      window.removeEventListener("chat-selected", handleChatSelected);
      window.removeEventListener("new-chat-created", handleNewChatCreated);
    };
  }, [loadChatHistory, addBotMessage]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Manage suggestions visibility based on message count and user interaction
    if (messages.length === 0) {
      // No messages, show suggestions and hide toggle
      setShowSuggestions(true);
      setHasSuggestionIcon(false);
    } else if (messages.length === 1 && !userInteracted) {
      // One welcome message, still show suggestions but prepare toggle
      setShowSuggestions(true);
      setHasSuggestionIcon(false);
    } else {
      // Multiple messages or user has interacted, hide suggestions by default and show toggle
      if (userInteracted || messages.length > 1) {
        setShowSuggestions(false);
      }
      setHasSuggestionIcon(true);
    }
  }, [messages, isTyping, isLoadingHistory, userInteracted]);

  // Function declarations are now moved above the useEffect where they're used

  // Function to send chat message to API
  const sendChatMessageToAPI = useCallback(
    async (question) => {
      try {
        setIsSendingMessage(true);
        const chat_id = localStorage.getItem("chat_id");
        const report_id = localStorage.getItem("report_id");
        const user_token = localStorage.getItem("accessToken");

        if (!user_token) {
          console.error("User token not found");
          return;
        }

        // If no chat_id is available, we need to create a new one
        let activeChatId = chat_id;
        if (!activeChatId) {
          try {
            const chatResponse = await getCurrentChatThread({
              user_token,
              create_new: true,
            });
            if (chatResponse.data && chatResponse.data.chat_id) {
              activeChatId = chatResponse.data.chat_id;
              localStorage.setItem("chat_id", activeChatId);
            }
          } catch (error) {
            console.error("Failed to create new chat thread:", error);
          }
        }

        const response = await sendChatMessage({
          question,
          chat_id: activeChatId,
          report_id,
          user_token,
        });

        const responseMessage =
          response.data.response ||
          "I'm sorry, I couldn't process that request.";
        addBotMessage(responseMessage);

        // Dispatch event to notify sidebar that chat has been updated
        const event = new CustomEvent("chat-updated");
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Failed to send message:", error);
        addBotMessage(
          "I'm sorry, there was an error processing your request. Please try again later.",
        );
      } finally {
        setIsSendingMessage(false);
      }
    },
    [addBotMessage],
  );

  const handleSuggestionClick = useCallback(
    (text) => {
      addUserMessage(text);
      setShowSuggestions(false);
      setUserInput("");
      // Set typing state to show indicator before sending
      setIsSendingMessage(true);
      // Set suggestion icon visible after user selects a suggestion
      setHasSuggestionIcon(true);
      // Mark that user has interacted
      setUserInteracted(true);
      // Send the suggestion to API
      sendChatMessageToAPI(text);
    },
    [addUserMessage, setShowSuggestions, setUserInput, sendChatMessageToAPI],
  );

  const handleSendClick = useCallback(() => {
    const trimmed = userInput.trim();
    if (!trimmed) return;
    addUserMessage(trimmed);
    setUserInput("");
    setShowSuggestions(false);
    // Set typing state to show indicator before sending
    setIsSendingMessage(true);
    // Mark that user has interacted
    setUserInteracted(true);
    // Send the message to API
    sendChatMessageToAPI(trimmed);
  }, [
    userInput,
    addUserMessage,
    setUserInput,
    setShowSuggestions,
    sendChatMessageToAPI,
  ]);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setLoading(true);
      const formData = new FormData();
      for (const file of files) {
        formData.append("csv_files", file);
      }

      const accessToken = localStorage.getItem("accessToken");
      formData.append("accessToken", accessToken);
      try {
        const response = await generateCROAudit(formData, accessToken);
        const data = response.data;
        console.log("API response:", data);
        // Store report name from response
        if (data && data.report_name) {
          // Extract only the report part without the email address
          const fullReportName = data.report_name;
          const reportPart = fullReportName.split(" for ")[0];
          setReportName(reportPart);
          setShowReportName(true);
        }
        const report_id = data.report_id || null;
        if (report_id) {
          localStorage.setItem("report_id", report_id);
        } else {
          console.warn("report_id not found in response");
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100vw" }}>
      <Sidebar />

      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <img src="/assets/chatbot.png" alt="logo" style={styles.logo} />
            <div>
              <h1 style={styles.title}>AI CRO Chat</h1>
              <p style={styles.subtitle}>
                Your conversion optimization assistant
              </p>
            </div>
          </div>
          {showReportName && reportName && (
            <div style={styles.headerRight}>
              <span style={styles.reportName}>
                {reportName}
                <button
                  onClick={() => setShowReportName(false)}
                  style={styles.closeButton}
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </header>

        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div style={styles.spinner} />
            <p>Please wait, we are generating the final report...</p>
          </div>
        )}

        {/* Chat Area */}
        <section style={styles.chatArea}>
          <div style={styles.chatAreaInner}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    m.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    backgroundColor:
                      m.sender === "user" ? "#2563eb" : "#f0f0f0",
                    color: m.sender === "user" ? "#fff" : "#444",
                    textAlign: "left",
                  }}
                  className={m.sender === "bot" ? "bot-message" : ""}
                >
                  {m.sender === "bot" ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: m.text }}
                      style={{ margin: "0" }}
                    />
                  ) : (
                    m.text.split("\n").map((line, idx) => (
                      <p key={idx} style={{ margin: "4px 0" }}>
                        {line}
                      </p>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator from bot (left side) */}
            {(isTyping || isLoadingHistory) && messages.length === 0 && (
              <div
                style={{ ...styles.messageRow, justifyContent: "flex-start" }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    backgroundColor: "#f0f0f0",
                  }}
                >
                  {isLoadingHistory ? (
                    <div style={{ fontSize: "14px" }}>
                      Loading chat history...
                    </div>
                  ) : (
                    <TypingIndicator />
                  )}
                </div>
              </div>
            )}

            {/* Typing indicator when sending messages */}
            {isSendingMessage && (
              <div
                style={{ ...styles.messageRow, justifyContent: "flex-start" }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    backgroundColor: "#f0f0f0",
                    minWidth: "60px",
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Suggestions Section */}
        <div
          className="suggestion-container"
          style={{
            ...styles.suggestions,
            maxHeight: showSuggestions ? "300px" : "0",
            height: "auto",
            opacity: showSuggestions ? 1 : 0,
            padding: showSuggestions ? "20px 15px 15px" : "0px",
            marginBottom: showSuggestions ? "20px" : "0px",
            borderRadius: "12px",
            border: showSuggestions
              ? "1px solid rgba(229, 231, 235, 0.5)"
              : "none",
            transition: "all 0.3s ease-in-out",
            pointerEvents: showSuggestions ? "all" : "none",
            boxShadow: showSuggestions ? "0 4px 15px rgba(0,0,0,0.1)" : "none",
            position: "absolute",
            zIndex: 100,
            width: "calc(75.85% - 16px)",
            maxWidth: "1380px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(245, 247, 250, 0.92)",
            backdropFilter: "blur(10px)",
            overflowY: showSuggestions ? "auto" : "hidden",
            bottom: "75px",
            top: "auto",
          }}
        >
          {/* Close button for suggestion box - always positioned relative to the input */}
          {showSuggestions && (
            <button
              onClick={() => setShowSuggestions(false)}
              style={styles.closeSuggestionsButton}
              title="Close suggestions"
              className="close-suggestions-btn"
            >
              ×
            </button>
          )}
          <div style={styles.suggestionHeading}></div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              style={styles.suggestionButton}
              onClick={() => handleSuggestionClick(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Suggestions toggle button - only shown when we have multiple messages */}
        {hasSuggestionIcon && (
          <div
            onClick={() => setShowSuggestions(!showSuggestions)}
            title={"Show suggestions"}
            className="suggestions-toggle-button"
            style={{
              ...styles.suggestionsToggle,
              zIndex: 101,
              marginTop: "0",
              position: "absolute",
              bottom: "90px",
              left: "50%",
              transform: "translateX(-50%)",
              opacity: hasSuggestionIcon && !showSuggestions ? 1 : 0,
              pointerEvents:
                hasSuggestionIcon && !showSuggestions ? "all" : "none",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              style={styles.toggleIcon}
            >
              <path
                fill="currentColor"
                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
              />
            </svg>
            <span style={styles.toggleText}>Show suggestions</span>
          </div>
        )}

        {/* Chat Footer */}
        <footer style={styles.chatFooter}>
          <div style={styles.chatFooterInner}>
            <div style={styles.iconsLeft}>
              <button style={styles.iconButton} onClick={handleFileClick}>
                <img
                  src="/assets/pin.png"
                  alt="attach"
                  style={styles.iconImg}
                />
              </button>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple
                onChange={handleFileChange}
              />

              <button style={styles.iconButton}>
                <img
                  src="/assets/microphone.png"
                  alt="mic"
                  style={styles.iconImg}
                />
              </button>
            </div>

            <div style={styles.inputWrapper}>
              <input
                type="text"
                placeholder={
                  messages.length === 0
                    ? "Choose a suggestion above or type your own question..."
                    : "Type your message..."
                }
                style={styles.input}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !isSendingMessage &&
                    !isLoadingHistory
                  ) {
                    e.preventDefault();
                    handleSendClick();
                  }
                }}
              />
              <button
                style={{
                  ...styles.sendButton,
                  opacity: isSendingMessage ? 0.6 : 1,
                  cursor: isSendingMessage ? "not-allowed" : "pointer",
                }}
                onClick={handleSendClick}
                disabled={isSendingMessage || isLoadingHistory}
              >
                ↑
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const TypingIndicator = () => {
  return (
    <div style={styles.typingIndicator}>
      <span style={{ ...styles.dot, animationDelay: "0s" }}></span>
      <span style={{ ...styles.dot, animationDelay: "0.2s" }}></span>
      <span style={{ ...styles.dot, animationDelay: "0.4s" }}></span>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
    position: "relative",
    flex: 1,
    padding: "0 40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px",
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    boxSizing: "border-box",
    position: "relative",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  headerRight: {
    marginLeft: "auto",
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  reportName: {
    fontWeight: "500",
    fontSize: 16,
    color: "#2563eb",
    padding: "5px 12px",
    borderRadius: "4px",
    backgroundColor: "#f0f7ff",
    border: "1px solid #d1e3ff",
    display: "flex",
    alignItems: "center",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "#777",
  },

  chatArea: {
    flexGrow: 1,
    overflowY: "auto",
    paddingTop: 30,
    paddingBottom: 40,
    maxWidth: 1920,
    marginTop: 30,
    marginBottom: 20,
    display: "flex",
    justifyContent: "center",
  },
  messageRow: {
    display: "flex",
    marginBottom: 14,
  },
  messageBubble: {
    maxWidth: "60%",
    borderRadius: 18,
    padding: "12px 18px",
    fontSize: 16,
    lineHeight: "22px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    whiteSpace: "pre-wrap",
  },

  toggleButton: {
    position: "fixed",
    bottom: "120px",
    right: "40px",
    background: "linear-gradient(90deg, #2F46BC, #E43D54)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "55px",
    height: "55px",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
    transition: "transform 0.2s ease",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
    width: "100%",
    margin: "0",
    position: "relative",
    backgroundColor: "rgba(245, 247, 250, 0.92)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    border: "none", // We'll control this with inline styles
    boxSizing: "border-box",
    alignContent: "flex-start",
    maxWidth: 1380, // Match chat area width
    paddingTop: "35px",
  },
  suggestionButton: {
    border: "1px solid #2563eb",
    color: "#2563eb",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: "10px 16px",
    fontSize: 13.5,
    cursor: "pointer",
    transition: "all 0.2s ease",
    margin: "8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxShadow: "0 2px 5px rgba(37, 99, 235, 0.1)",
    fontWeight: "400",
  },
  closeSuggestionsButton: {
    position: "absolute",
    top: "10px",
    right: "15px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.08)",
    color: "#666",
    fontSize: "20px",
    lineHeight: "20px",
    fontWeight: "300",
    padding: "0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    zIndex: 102,
  },
  suggestionHeading: {
    position: "absolute",
    top: "10px",
    left: "15px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#666",
    marginBottom: "10px",
  },
  chatFooter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingTop: 30,
    marginTop: "auto",
    paddingBottom: 20,
    maxWidth: 1800,
  },
  iconsLeft: {
    display: "flex",
    gap: 8,
  },
  iconButton: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
  },
  iconImg: {
    width: 20,
    height: 20,
    objectFit: "contain",
  },
  inputWrapper: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
    width: "100%",
    maxWidth: 1380,
    margin: "0 auto",
  },
  input: {
    width: "100%",
    border: "1.08px solid #D8D8D8",
    borderRadius: 25,
    padding: "10px 50px 10px 16px",
    fontSize: 14,
    outline: "none",
    height: "64px",
  },
  sendButton: {
    position: "absolute",
    right: "6px",
    background: "linear-gradient(90deg, #2F46BC, #E43D54)",
    border: "none",
    color: "#fff",
    width: 34,
    height: 34,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  typingIndicator: {
    display: "flex",
    gap: 5,
    alignItems: "center",
    height: 24,
  },
  chatAreaInner: {
    width: "100%",
    maxWidth: 1380,
    paddingLeft: 100,
    paddingRight: 100,
    boxSizing: "border-box",
    margin: "0 auto", // add margin auto for horizontal centering
    position: "relative",
    paddingBottom: "30px",
  },
  chatFooterInner: {
    width: "100%",
    maxWidth: 1380,
    display: "flex",
    justifyContent: "space-between",
    paddingLeft: 100,
    paddingRight: 100,
    boxSizing: "border-box",
    alignItems: "center",
    margin: "0 auto", // add margin auto for horizontal centering
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: "#999",
    borderRadius: "50%",
    display: "inline-block",
    animationName: "typingDot",
    animationDuration: "1.2s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },

  // Keyframes for typing dots animation added as inline styles below via <style> injection

  // Spinner styles
  spinner: {
    margin: "16px auto",
    width: 40,
    height: 40,
    border: "4px solid #ccc",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animationName: "spin",
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  suggestionsToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "20px",
    marginBottom: "0",
    transition: "all 0.2s ease",
    backgroundColor: "#f5f7fa",
    border: "1px solid #eaecef",
    width: "auto",
    minWidth: "150px",
    maxWidth: "200px",
    margin: "0 auto",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    position: "relative",
    zIndex: 50,
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "#e9ecef",
      boxShadow: "0 3px 6px rgba(0,0,0,0.08)",
    },
  },
  toggleIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    opacity: 0.7,
    color: "#666",
  },
  toggleText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
};

// Add keyframes animation and hover styles by injecting into document head
if (typeof window !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = `
/* Styles for HTML content in bot messages */
.bot-message h2 {
  margin-top: 12px;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.bot-message p {
  margin: 8px 0;
  line-height: 1.5;
}

.bot-message ul, .bot-message ol {
  margin: 8px 0;
  padding-left: 24px;
}

.bot-message li {
  margin-bottom: 4px;
}

.bot-message strong {
  font-weight: 600;
}
  @keyframes typingDot {
    0%, 20% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.4); }
    100% { opacity: 0.3; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .suggestion-container button {
    transition: all 0.2s ease !important;
  }
  .suggestion-container button:hover {
    background-color: #f0f7ff !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2) !important;
  }
  .suggestions-toggle-button:hover {
    background-color: #e9ecef !important;
    box-shadow: 0 3px 6px rgba(0,0,0,0.08) !important;
  }
  .suggestion-container {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
  .suggestion-container::-webkit-scrollbar {
    width: 6px;
  }
  .suggestion-container::-webkit-scrollbar-track {
    background: transparent;
  }
  .suggestion-container::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 6px;
    border: 3px solid transparent;
  }
  .suggestions-toggle-button {
    transition: all 0.3s ease !important;
  }
  .close-suggestions-btn:hover {
    background-color: rgba(0,0,0,0.15) !important;
    transform: none !important;
    box-shadow: none !important;
    color: #333 !important;
  }
  `;
  document.head.appendChild(styleElement);
}

export default ChatUI;
