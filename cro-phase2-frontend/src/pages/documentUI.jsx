import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import "../pages/DocumentUI.css";
import { getAllReports, getReportFile } from "../api/api";

const Document = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const [sortBy, setSortBy] = useState("newest");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [processingFile, setProcessingFile] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [reportData, setReportData] = useState({
    comprehensive_reports: [],
    individual_reports: [],
    csvs: { all_files: [] },
  });
  // Effect for window resize
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Effect for API call
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          console.error("Authentication token not found");
          setLoading(false);
          return;
        }

        const response = await getAllReports(accessToken);
        console.log("API Response:", response.data);

        if (!response.data || !response.data.comprehensive_reports) {
          setError("Invalid data format received from server.");
          setReportData({
            comprehensive_reports: [],
            individual_reports: [],
            csvs: { all_files: [] },
          });
        } else {
          setReportData(response.data);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        setError(
          error.response?.data?.message ||
            "Failed to load reports. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // isMobile is defined at the top now

  // Transform comprehensive reports to reportFiles format
  const reportFiles = reportData.comprehensive_reports?.length
    ? reportData.comprehensive_reports.map((report, index) => ({
        id: report.report_id,
        name: `CRO Report #${report.report_id}`,
        type: "txt",
        // Stagger dates to demonstrate sorting (temporary until real dates come from API)
        time:
          index % 4 === 0
            ? "1 day ago"
            : index % 4 === 1
              ? "3 days ago"
              : index % 4 === 2
                ? "1 week ago"
                : "2 weeks ago",
        generated: true,
        content: report.report,
      }))
    : [];

  // Calculate appropriate grid columns based on window width
  const getGridColumns = () => {
    if (isMobile) return "repeat(auto-fill, minmax(160px, 1fr))";
    if (isTablet) return "repeat(auto-fill, minmax(200px, 1fr))";
    return "repeat(auto-fill, minmax(240px, 1fr))";
  };

  // Transform CSV files to uploadFiles format
  const uploadFiles = reportData.csvs?.all_files?.length
    ? reportData.csvs.all_files.map((file, index) => {
        return {
          id: file.id,
          name: file.name,
          type: file.name.split(".").pop().toLowerCase() || "csv", // Get file extension
          // Stagger dates to demonstrate sorting (temporary until real dates come from API)
          time:
            index % 5 === 0
              ? "Just now"
              : index % 5 === 1
                ? "2 days ago"
                : index % 5 === 2
                  ? "5 days ago"
                  : index % 5 === 3
                    ? "2 weeks ago"
                    : "1 month ago",
        };
      })
    : [];

  // Convert human-readable time (e.g., "5 days ago", "2 weeks ago", "1 month ago") to age in days
  const getAgeInDays = (relative) => {
    if (!relative) return Number.MAX_SAFE_INTEGER;
    const lower = String(relative).toLowerCase();

    // Handle special cases first
    if (lower === "just now") return 0;
    if (lower === "yesterday") return 1;

    // Handle relative time formats with numbers
    const match = lower.match(
      /(\d+)\s*(day|week|month|year|hour|minute|second)s?\s*ago/,
    );
    if (!match) return Number.MAX_SAFE_INTEGER;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "second":
        return value / 86400; // Convert seconds to days
      case "minute":
        return value / 1440; // Convert minutes to days
      case "hour":
        return value / 24; // Convert hours to days
      case "day":
        return value;
      case "week":
        return value * 7;
      case "month":
        return value * 30;
      case "year":
        return value * 365;
      default:
        return Number.MAX_SAFE_INTEGER;
    }
  };

  // Function to sort files by age
  const sortFiles = (files, sortType) => {
    return [...files].sort((a, b) => {
      const ageA = getAgeInDays(a.time);
      const ageB = getAgeInDays(b.time);

      if (sortType === "newest") {
        // smaller age means newer
        return ageA - ageB;
      }
      // oldest first
      return ageB - ageA;
    });
  };

  // Function to handle file actions
  const handleFileAction = async (action, file, event) => {
    event.stopPropagation();
    // Close the dropdown after action
    setActiveDropdown(null);

    // Set processing state
    setProcessingFile(file.id);
    setActionType(action);

    const userToken = localStorage.getItem("accessToken");
    if (!userToken) {
      alert("Authentication token not found. Please log in again.");
      setProcessingFile(null);
      setActionType(null);
      return;
    }

    try {
      // Determine if this is a comprehensive report or CSV file
      const isComprehensiveReport = activeTab === "reports";
      const requestData = {
        report_id: file.id,
        user_token: userToken,
        report_type: isComprehensiveReport ? "comprehensive" : "csv",
        is_delete: action === "delete",
      };

      // Add report_name for CSV files
      if (!isComprehensiveReport && file.name) {
        requestData.report_name = file.name;
      }

      if (action === "delete") {
        // Show confirmation dialog before deleting
        if (
          !window.confirm(`Are you sure you want to delete "${file.name}"?`)
        ) {
          setProcessingFile(null);
          setActionType(null);
          return;
        }

        const response = await getReportFile(requestData);

        // If deletion was successful, refresh the report list
        if (response.data && response.data.success) {
          // alert("File deleted successfully");
          // Refresh reports after deletion
          const refreshResponse = await getAllReports(userToken);
          setReportData(refreshResponse.data);
        } else {
          alert("Failed to delete file");
        }
      } else if (action === "download") {
        // For download, set responseType to 'blob' (handled in API function)
        const response = await getReportFile(requestData);

        // Create a download link for the file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        // Set appropriate filename
        const filename = file.name || `CRO_Report_${file.id}.txt`;
        link.setAttribute("download", filename);

        // Trigger the download
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(`Error during ${action} operation:`, error);
      alert(`Failed to ${action} file. Please try again later.`);
    } finally {
      // Clear processing state
      setProcessingFile(null);
      setActionType(null);
    }
  };

  // Handle dropdown toggle
  const toggleDropdown = (index, event) => {
    event.stopPropagation();
    event.preventDefault();
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Handle card hover
  const handleCardHover = (index) => {
    // Update hovered card state
    setHoveredCard(index);

    // If hovering a different card than the one with active dropdown, close the dropdown
    if (activeDropdown !== null && activeDropdown !== index) {
      setActiveDropdown(null);
    }
  };

  // Handle mouse leaving a card
  const handleCardLeave = (index) => {
    if (hoveredCard === index) {
      setHoveredCard(null);
    }
  };

  // Handle mouse leaving the files grid
  const handleMouseLeaveGrid = () => {
    // Close any open dropdown when mouse leaves the grid area
    if (activeDropdown !== null) {
      setActiveDropdown(null);
    }
    setHoveredCard(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside all dropdowns
      if (activeDropdown !== null) {
        // Don't close if clicking on a dropdown menu item
        if (event.target.closest(".dropdown-menu")) {
          return;
        }
        // Don't close if clicking on the three dots that opened the menu
        if (event.target.closest(".threedot")) {
          return;
        }
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  // Pick files for the active tab and sort according to dropdown
  const currentFiles = activeTab === "reports" ? reportFiles : uploadFiles;
  const sortedFiles = sortFiles(currentFiles, sortBy);

  // Reference to the main container for scrolling behavior
  const fileContentRef = useRef(null);

  return (
    <div className="document-container">
      <Sidebar />
      <div className="file-container" style={{ width: "100%" }}>
        <div className="file-header">
          <div className="file-left">
            <img src="/assets/colordoc.png" alt="logo" className="logo-img" />
            <h2 className="file-title">Files Manager</h2>
          </div>
        </div>

        <div
          ref={fileContentRef}
          className="file-content"
          style={{
            padding: isMobile ? "16px 8px" : "20px 16px",
            height: isMobile ? "calc(100vh - 100px)" : "calc(100vh - 110px)",
          }}
        >
          <div className="tabs">
            <button
              className={`tab ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              Generated Reports
            </button>
            <button
              className={`tab ${activeTab === "uploads" ? "active" : ""}`}
              onClick={() => setActiveTab("uploads")}
            >
              Uploads
            </button>
          </div>

          <div className="file-controls">
            <div className="sort-dropdown">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                }}
                disabled={loading || sortedFiles.length === 0}
              >
                <option value="newest">Most recent</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            {loading && <div className="loading-indicator">Loading...</div>}
          </div>

          <div
            className="files-grid"
            style={{
              gridTemplateColumns: getGridColumns(),
              gap: isMobile ? "12px" : "20px",
            }}
            onMouseLeave={handleMouseLeaveGrid}
          >
            {loading ? (
              <div className="loading-message">Loading reports...</div>
            ) : error ? (
              <div className="no-files-message error-message">{error}</div>
            ) : sortedFiles.length === 0 ? (
              <div className="no-files-message">No files available</div>
            ) : (
              sortedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`file-card ${processingFile === file.id ? "processing" : ""}`}
                  style={{
                    height: isMobile ? "200px" : "220px",
                    maxWidth: isMobile ? "180px" : isTablet ? "220px" : "240px",
                    padding: isMobile ? "12px" : "16px",
                  }}
                  onClick={() => console.log(`File selected: ${file.id}`)}
                  onMouseEnter={() => handleCardHover(index)}
                  onMouseLeave={() => handleCardLeave(index)}
                >
                  <div
                    className="file-card-file"
                    style={{
                      maxWidth: "100%",
                      height: isMobile ? "110px" : "128px",
                    }}
                  >
                    <div className="file-card-header">
                      {activeTab === "reports" && (
                        <span className="generated-badge">Generated</span>
                      )}
                      {activeTab === "uploads" && (
                        <span className="generated-upload">Uploaded</span>
                      )}
                      <div className="file-options">
                        <img
                          src="/assets/threedot.png"
                          alt="options"
                          className="threedot"
                          onClick={(e) => toggleDropdown(index, e)}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        {activeDropdown === index && (
                          <div
                            className="dropdown-menu"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              className="dropdown-item download-item"
                              onClick={(e) =>
                                handleFileAction("download", file, e)
                              }
                              disabled={processingFile === file.id}
                            >
                              {processingFile === file.id &&
                              actionType === "download" ? (
                                <span className="loading-spinner-sm">⟳</span>
                              ) : (
                                <span className="download-icon">📥</span>
                              )}{" "}
                              Download
                            </button>
                            <button
                              className="dropdown-item delete-item"
                              onClick={(e) =>
                                handleFileAction("delete", file, e)
                              }
                              disabled={processingFile === file.id}
                            >
                              {processingFile === file.id &&
                              actionType === "delete" ? (
                                <span className="loading-spinner-sm">⟳</span>
                              ) : (
                                <span className="delete-icon">🗑️</span>
                              )}{" "}
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="file-icon-large">
                      {file.type === "xlsx" && (
                        <div className="excel-icon">📊</div>
                      )}
                      {file.type === "png" && (
                        <div className="image-icon">🖼️</div>
                      )}
                      {file.type === "csv" && (
                        <div className="csv-icon">📊</div>
                      )}
                      {file.type === "txt" && (
                        <div className="txt-icon">📝</div>
                      )}
                      {!["xlsx", "png", "csv", "txt"].includes(file.type) && (
                        <div className="default-icon">📄</div>
                      )}
                    </div>
                  </div>
                  <div className="file-info" style={{ width: "100%" }}>
                    <div
                      className="file-name"
                      title={file.name}
                      style={{
                        maxWidth: "100%",
                        fontSize: isMobile ? "14px" : "16px",
                        marginTop: isMobile ? "12px" : "20px",
                      }}
                    >
                      {file.name}
                    </div>
                    <div
                      className="file-time"
                      style={{ fontSize: isMobile ? "12px" : "14px" }}
                    >
                      {file.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Document;
