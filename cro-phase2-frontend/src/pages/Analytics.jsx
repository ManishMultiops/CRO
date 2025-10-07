import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
);

const ChatUI = () => {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Evaluation");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isTablet = windowWidth <= 1024;
  const isMobile = windowWidth <= 768;

  const handleFileClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) console.log("Selected file:", file.name);
  };

  const handleSend = () => {
    if (inputValue.trim() === "") return;
    setMessages([...messages, { sender: "user", text: inputValue }]);
    setInputValue("");
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100vw" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={styles.dashboard}>
        {/* Header */}
        <header style={styles.header}>
          <img src="/assets/chatbot.png" alt="logo" style={styles.logo} />
          <div>
            <h1 style={styles.title}>AI Analytics Details</h1>
          </div>
        </header>

        {/* Tabs */}
        <nav
          style={{
            ...styles.navTabs,
            marginBottom: isMobile ? 16 : 30,
            height: isMobile ? 44 : 50,
          }}
        >
          {["Evaluation", "Charts", "Usage"].map((tab) => (
            <button
              key={tab}
              style={activeTab === tab ? styles.navActive : styles.navTab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {activeTab === tab && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -9,
                    left: 0,
                    width: "100%",
                    height: 3,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #2F46BC, #E43D54)",
                  }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        {activeTab === "Evaluation" && (
          <>
            {/* Metric Cards */}
            <div
              style={{
                ...styles.metricsRow,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                    ? "repeat(2,1fr)"
                    : "repeat(4,1fr)",
                margin: isMobile ? "0 16px 20px 16px" : "0 40px 30px 40px",
                gap: isMobile ? 12 : 20,
              }}
            >
              {[
                {
                  label: "Conversion Rate",
                  value: "3.2%",
                  change: "+0.3% vs last month",
                  positive: true,
                },
                {
                  label: "Avg Order Value",
                  value: "$127",
                  change: "+$12 vs last month",
                  positive: true,
                },
                {
                  label: "Bounce Rate",
                  value: "42%",
                  change: "-5% vs last month",
                  positive: false,
                },
                {
                  label: "Active Users",
                  value: "12.5K",
                  change: "+1.2K vs last month",
                  positive: true,
                },
              ].map((card, i) => (
                <div key={i} style={styles.metricCard}>
                  <div style={styles.metricLabel}>{card.label}</div>
                  <div style={styles.metricValue}>{card.value}</div>
                  <div
                    style={{
                      color: card.positive ? "#16a34a" : "#dc2626",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {card.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts + Opportunities */}
            <div
              style={{
                ...styles.chartsRow,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : isTablet
                    ? "1.5fr 1fr"
                    : "2fr 1fr",
                margin: isMobile ? "0 16px 24px 16px" : "0 40px 30px 40px",
                gap: isMobile ? 12 : 20,
              }}
            >
              <div style={{ ...styles.chartCard, padding: isMobile ? 12 : 20 }}>
                <h3 style={styles.cardTitle}>Conversion Funnel</h3>
                <div style={styles.chartPlaceholder}></div>
              </div>

              <div style={{ ...styles.chartCard, padding: isMobile ? 12 : 20 }}>
                <h3 style={styles.cardTitle}>Top Opportunities</h3>

                <div style={styles.opportunityItem("high")}>
                  <strong>Optimize checkout flow</strong>
                  <p style={styles.opText}>Reduce form fields by 40%</p>
                </div>
                <div style={styles.opportunityItem("medium")}>
                  <strong>Mobile page speed</strong>
                  <p style={styles.opText}>Improve loading time by 2.3s</p>
                </div>
                <div style={styles.opportunityItem("low")}>
                  <strong>Product page CTA</strong>
                  <p style={styles.opText}>A/B test button colors</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Charts Tab */}
        {activeTab === "Charts" && (
          <div
            style={{
              margin: isMobile ? "0 16px 20px 16px" : "0 40px 30px 40px",
              display: "grid",
              gap: isMobile ? 12 : 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? 12 : 20,
              }}
            >
              <div style={{ ...styles.chartCard, padding: isMobile ? 12 : 20 }}>
                <h3 style={styles.cardTitle}>Traffic Sources Distribution</h3>
                <div style={{ height: 240 }}>
                  <Doughnut
                    data={{
                      labels: [
                        "Organic Search",
                        "Paid Ads",
                        "Social Media",
                        "Direct",
                      ],
                      datasets: [
                        {
                          data: [320, 95, 68, 210],
                          backgroundColor: [
                            "#10b981",
                            "#f59e0b",
                            "#3b82f6",
                            "#ef4444",
                          ],
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom" } },
                    }}
                  />
                </div>
              </div>
              <div style={{ ...styles.chartCard, padding: isMobile ? 12 : 20 }}>
                <h3 style={styles.cardTitle}>Session Duration Analysis</h3>
                <div style={{ height: 240 }}>
                  <Bar
                    data={{
                      labels: ["0–30s", "30s–1m", "1–2m", "2–5m", "5m+"],
                      datasets: [
                        {
                          label: "User Sessions",
                          data: [1100, 2900, 2000, 1300, 700],
                          backgroundColor: "#3b82f6",
                          borderRadius: 8,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { ticks: { stepSize: 500 } } },
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ ...styles.chartCard, padding: isMobile ? 12 : 20 }}>
              <h3 style={styles.cardTitle}>Performance Trends Over Time</h3>
              <div style={{ height: 280 }}>
                <Line
                  data={{
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
                    datasets: [
                      {
                        label: "Conversion Rate (%)",
                        data: [3.2, 3.6, 3.7, 4.2, 4.0, 4.6, 4.9],
                        borderColor: "#ef4444",
                        backgroundColor: "#ef4444",
                        tension: 0.3,
                        yAxisID: "y",
                      },
                      {
                        label: "Revenue ($K)",
                        data: [60, 75, 90, 105, 98, 120, 140],
                        borderColor: "#10b981",
                        backgroundColor: "#10b981",
                        tension: 0.3,
                        yAxisID: "y1",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                    scales: {
                      y: {
                        type: "linear",
                        position: "left",
                        ticks: { callback: (v) => `${v}` },
                      },
                      y1: {
                        type: "linear",
                        position: "right",
                        grid: { drawOnChartArea: false },
                        ticks: { callback: (v) => `${v}` },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "Chat" && (
          <div style={styles.chatTab}>
            <div style={styles.chatMessages}>
              {messages.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  Start a conversation with your AI assistant...
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.message,
                      alignSelf:
                        msg.sender === "user" ? "flex-end" : "flex-start",
                      background: msg.sender === "user" ? "#2563eb" : "#f3f4f6",
                      color: msg.sender === "user" ? "#fff" : "#111827",
                    }}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            {/* Chat Footer Input */}
            <footer style={styles.chatFooter}>
              <button onClick={handleFileClick} style={styles.iconBtn}>
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button style={styles.iconBtn}>🎤</button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                style={styles.chatInput}
              />
              <button onClick={handleSend} style={styles.sendBtn}>
                ➤
              </button>
            </footer>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === "Usage" && (
          <div style={{ margin: "0 40px 30px 40px" }}>
            {/* Summary Card */}
            <div style={styles.usageSummary}>
              <div style={styles.usageSummaryLeft}>
                <div style={styles.usageTitle}>Total Tokens Used</div>
                <div style={styles.usageTotal}>847,293</div>
                <div style={styles.usageSub}>This month</div>
              </div>
              <div style={styles.usageIconCard}>
                <span style={{ fontSize: 22 }}>🪙</span>
              </div>
            </div>

            {/* Usage History Table */}
            <div style={styles.tableCard}>
              <div style={styles.tableHeaderRow}>
                <div style={{ ...styles.tableCell, flex: 1 }}>DATE</div>
                <div style={{ ...styles.tableCell, flex: 1 }}>TIME</div>
                <div style={{ ...styles.tableCell, flex: 1 }}>TOKEN TYPE</div>
                <div style={{ ...styles.tableCell, flex: 1 }}>TOKENS USED</div>
              </div>

              {[
                {
                  d: "2024-01-15",
                  t: "14:32:15",
                  type: "API Request",
                  tokens: "1,247",
                  badge: "danger",
                },
                {
                  d: "2024-01-15",
                  t: "13:18:42",
                  type: "Analysis",
                  tokens: "892",
                  badge: "info",
                },
                {
                  d: "2024-01-15",
                  t: "11:45:23",
                  type: "Report",
                  tokens: "2,156",
                  badge: "success",
                },
                {
                  d: "2024-01-14",
                  t: "16:22:08",
                  type: "API Request",
                  tokens: "3,421",
                  badge: "danger",
                },
                {
                  d: "2024-01-14",
                  t: "14:07:31",
                  type: "Analysis",
                  tokens: "1,789",
                  badge: "info",
                },
                {
                  d: "2024-01-14",
                  t: "09:33:17",
                  type: "Report",
                  tokens: "967",
                  badge: "success",
                },
              ].map((row, i) => (
                <div key={i} style={styles.tableRow}>
                  <div style={{ ...styles.tableCell, flex: 1 }}>{row.d}</div>
                  <div style={{ ...styles.tableCell, flex: 1 }}>{row.t}</div>
                  <div style={{ ...styles.tableCell, flex: 1 }}>
                    <span style={styles.badge(row.badge)}>{row.type}</span>
                  </div>
                  <div
                    style={{ ...styles.tableCell, flex: 1, fontWeight: 600 }}
                  >
                    {row.tokens}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: "flex",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  },
  dashboard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "20px 0px",
    background: "#f9fafb",
    minHeight: "100vh",
  },

  /* ---------- Header ---------- */
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: "1px solid #e5e7eb",
    height: "90px",
    marginTop: "-20px",
  },
  logo: { width: 50, height: 50, marginLeft: "30px" },
  title: { margin: 0, fontSize: 24, fontWeight: "600", color: "#111827" },
  subtitle: { margin: 0, fontSize: 14, color: "#6B7280" },

  /* ---------- Tabs ---------- */
  navTabs: {
    gap: 20,
    marginBottom: 30,
    borderBottom: "1px solid #e5e7eb",
    height: "50px",
  },
  navTab: {
    border: "none",
    background: "none",
    fontSize: 14,
    color: "#6b7280",
    cursor: "pointer",
    position: "relative",
    marginLeft: "40px",
    marginTop: "18px",
  },
  navActive: {
    border: "none",
    background: "none",
    fontSize: 16,
    fontWeight: 500,
    color: "#111827",
    cursor: "pointer",
    position: "relative",
    marginLeft: "40px",
  },

  /* ---------- Evaluation Cards ---------- */
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 20,
    marginBottom: 30,
    margin: "0 40px 30px 40px",
  },
  metricCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  },
  metricLabel: { fontSize: 14, color: "#6b7280" },
  metricValue: { fontSize: 24, fontWeight: "700", margin: "4px 0" },

  chartsRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    marginBottom: 40,
    margin: "0 40px 30px 40px",
  },
  chartCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  chartPlaceholder: {
    backgroundImage: "url('/assets/funnel.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    border: "none",
    height: "300px",
  },

  opportunityItem: (level) => ({
    background:
      level === "high" ? "#fee2e2" : level === "medium" ? "#fef3c7" : "#dbeafe",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: "#111827",
  }),
  opText: { margin: "4px 0 0", fontSize: 13, color: "#374151" },

  /* ---------- Chat Tab ---------- */
  chatTab: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  },
  chatMessages: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
  },
  message: { padding: 10, borderRadius: 8, maxWidth: "70%" },
  chatFooter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    background: "#fff",
  },
  chatInput: {
    flex: 1,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
    outline: "none",
  },
  iconBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 18,
  },
  sendBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "50%",
    width: 36,
    height: 36,
    cursor: "pointer",
  },

  /* ---------- Usage Tab (Summary + Table) ---------- */
  usageSummary: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  usageSummaryLeft: {},
  usageTitle: { fontSize: 16, color: "#111827", marginBottom: 4 },
  usageTotal: {
    fontSize: 32,
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: 4,
  },
  usageSub: { fontSize: 12, color: "#6b7280" },
  usageIconCard: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  tableCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeaderRow: {
    display: "flex",
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
  },
  tableRow: {
    display: "flex",
    padding: "14px 16px",
    borderTop: "1px solid #f3f4f6",
    alignItems: "center",
    fontSize: 14,
    color: "#111827",
    background: "#fff",
  },
  tableCell: { minWidth: 0 },
  badge: (variant) => ({
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color:
      variant === "danger"
        ? "#b91c1c"
        : variant === "info"
          ? "#1d4ed8"
          : "#166534",
    background:
      variant === "danger"
        ? "#fee2e2"
        : variant === "info"
          ? "#dbeafe"
          : "#dcfce7",
  }),
};

export default ChatUI;
