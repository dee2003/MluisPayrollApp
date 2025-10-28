// import React, { useState, useEffect } from "react";
// import TimesheetForm from "./TimesheetForm";
// import axios from "axios";
// import "./application.css";

// const API_URL = "http://127.0.0.1:8000/api";

// export default function ApplicationAdminPage() {
//     const [showForm, setShowForm] = useState(false);
//     const [timesheets, setTimesheets] = useState([]);
//     const [mappings, setMappings] = useState({});
//     const [loadingMappings, setLoadingMappings] = useState({});
//     const [error, setError] = useState("");
//     const [expandedCardId, setExpandedCardId] = useState(null); // <-- New state for expanded card

//     const fetchTimesheets = async () => {
//         try {
//             const res = await axios.get(`${API_URL}/timesheets/`);
//             setTimesheets(res.data);
//         } catch (err) {
//             setError("Could not fetch timesheets");
//         }
//     };

//     const fetchMapping = async (foremanId) => {
//         if (!foremanId || mappings[foremanId] || loadingMappings[foremanId]) return;

//         try {
//             setLoadingMappings(prev => ({ ...prev, [foremanId]: true }));
//             const res = await axios.get(`${API_URL}/crew-mapping/by-foreman/${foremanId}`);
//             setMappings(prev => ({ ...prev, [foremanId]: res.data }));
//         } catch (err) {
//             console.error(`Error fetching mapping for foreman ID ${foremanId}:`, err.response ? err.response.data : err.message);
//         } finally {
//             setLoadingMappings(prev => ({ ...prev, [foremanId]: false }));
//         }
//     };

//     // --- New handler for clicking on a card ---
//     const handleCardClick = (timesheet) => {
//         const { id, foreman_id } = timesheet;
//         if (expandedCardId === id) {
//             // If card is already expanded, collapse it
//             setExpandedCardId(null);
//         } else {
//             // Otherwise, expand this card
//             setExpandedCardId(id);
//             // And fetch its crew details if we haven't already
//             fetchMapping(foreman_id);
//         }
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('authToken');
//         window.location.reload();
//     };

//     useEffect(() => {
//         fetchTimesheets();
//     }, []);

//     return (
//         <div className="admin-page-container">
//             <header className="admin-header">
//                 <h1>Admin Dashboard</h1>
//                 <div className="header-buttons">
//                     <button className="btn btn-secondary" onClick={handleLogout}>
//                         Logout
//                     </button>
//                     <button onClick={() => setShowForm(true)} className="btn btn-primary">
//                         + Create Timesheet
//                     </button>
//                 </div>
//             </header>

//             {showForm && <TimesheetForm onClose={() => { setShowForm(false); fetchTimesheets(); }} />}

//             {error && <p className="error-message">{error}</p>}

//             <section className="timesheet-grid">
//                 {timesheets.length ? (
//                     timesheets.map(ts => {
//                         const mapping = mappings[ts.foreman_id];
//                         return (
//                             <article
//                                 key={ts.id}
//                                 className="timesheet-card"
//                                 aria-label={`Timesheet: ${ts.timesheet_name}`}
//                                 onClick={() => handleCardClick(ts)} // <-- Add onClick handler here
//                             >
//                                 <div className="card-header">
//                                     <h2>{ts.timesheet_name}</h2>
//                                     <time dateTime={ts.date}>
//                                         {new Date(ts.date).toLocaleDateString()}
//                                     </time>
//                                 </div>
//                                 <div className="card-details">
//                                     <p>
//                                         <strong>Foreman:</strong>{" "}
//                                         {/* This will now display the name from the API */}
//                                         <span className="foreman-link">{ts.foreman_name}</span>
//                                     </p>

//                                     {/* --- Conditionally render details only for the expanded card --- */}
//                                     {expandedCardId === ts.id && (
//                                         <>
//                                             {loadingMappings[ts.foreman_id] && <p>Loading crew details...</p>}
//                                             {mapping && (
//                                                 <div className="crew-details-box">
//                                                     <p><strong>Employees:</strong> {mapping.employees?.map(e => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p>
//                                                     <p><strong>Equipment:</strong> {mapping.equipment?.map(eq => eq.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Materials:</strong> {mapping.materials?.map(mat => mat.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Vendors:</strong> {mapping.vendors?.map(ven => ven.name).join(", ") || "N/A"}</p>
//                                                 </div>
//                                             )}
//                                         </>
//                                     )}

//                                     <p><strong>Job Code:</strong> {ts.data?.job?.job_code || "N/A"}</p>
//                                     <p><strong>Phases:</strong> {ts.data?.job?.phase_codes?.join(", ") || "N/A"}</p>
//                                 </div>
//                             </article>
//                         );
//                     })
//                 ) : (
//                     <p className="empty-message">No timesheets available.</p>
//                 )}
//             </section>
//         </div>
//     );
// }




// import React, { useState, useEffect } from "react";
// import TimesheetForm from "./TimesheetForm";
// import axios from "axios";
// import "./application.css";
// const API_URL = "http://127.0.0.1:8000/api";
// export default function ApplicationAdminPage() {
//     const [showForm, setShowForm] = useState(false);
//     const [timesheets, setTimesheets] = useState([]);
//     const [mappings, setMappings] = useState({});
//     const [loadingMappings, setLoadingMappings] = useState({});
//     const [error, setError] = useState("");
//     const [expandedCardId, setExpandedCardId] = useState(null);
//     const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
//     // Fetch all timesheets
//     const fetchTimesheets = async () => {
//         try {
//             const res = await axios.get(`${API_URL}/timesheets/`);
//             setTimesheets(res.data);
//         } catch (err) {
//             setError("Could not fetch timesheets");
//         }
//     };
//     // Fetch crew mapping for a foreman (omitted for brevity)
//     const fetchMapping = async (foremanId) => {
//         if (!foremanId || mappings[foremanId] || loadingMappings[foremanId]) return;
//         try {
//             setLoadingMappings(prev => ({ ...prev, [foremanId]: true }));
//             const res = await axios.get(`${API_URL}/crew-mapping/by-foreman/${foremanId}`);
//             setMappings(prev => ({ ...prev, [foremanId]: res.data }));
//         } catch (err) {
//             console.error(`Error fetching mapping for foreman ID ${foremanId}:`, err.response ? err.response.data : err.message);
//         } finally {
//             setLoadingMappings(prev => ({ ...prev, [foremanId]: false }));
//         }
//     };
//     const handleCardClick = (timesheet) => {
//         const { id, foreman_id } = timesheet;
//         if (expandedCardId === id) {
//             setExpandedCardId(null);
//         } else {
//             setExpandedCardId(id);
//             fetchMapping(foreman_id);
//         }
//     };
//     const handleLogout = () => {
//         localStorage.removeItem('authToken');
//         window.location.reload();
//     };
//     const toggleViewMode = () => {
//         setViewMode(prevMode => (prevMode === 'grid' ? 'list' : 'grid'));
//     };
//     useEffect(() => {
//         fetchTimesheets();
//     }, []);
//     const isGridView = viewMode === 'grid';
//     const nextViewIcon = isGridView ? ':clipboard:' : ':card_index_dividers:';
//     const nextViewText = isGridView ? 'Switch to List View' : 'Switch to Grid View';
//     const timesheetGridClass = isGridView ? 'timesheet-grid' : 'timesheet-list';
//     return (
//         <div className="admin-page-container">
//             {/* Header with Buttons */}
//             <header className="admin-header">
//                 <h1>Application Admin Portal</h1>
//                 <div className="header-actions"> {/* NEW CONTAINER */}
//                     <button className="btn btn-primary" onClick={() => setShowForm(true)}>
//                         + Create Timesheet
//                     </button>
//                     <button className="btn btn-icon-link" onClick={handleLogout}>
//                         Logout
//                     </button>
//                 </div>
//             </header>
//             {/* Controls Section */}
//             <div className="dashboard-controls-bar"> {/* NEW CONTAINER for controls */}
//                 {/* Switch View Button */}
//                 <div className="timesheet-controls">
//                     <button
//                         className="btn btn-toggle"
//                         onClick={toggleViewMode}
//                         aria-pressed={!isGridView}
//                         aria-label={nextViewText}
//                     >
//                         {nextViewIcon} {nextViewText}
//                     </button>
//                 </div>
//             </div>
//             {/* Show Timesheet Form */}
//             {showForm && (
//                 <TimesheetForm onClose={() => { setShowForm(false); fetchTimesheets(); }} />
//             )}
//             {error && <p className="error-message">{error}</p>}
//             {/* Timesheet Grid/List (Omitted for brevity, no changes needed here) */}
//              <section className={timesheetGridClass}>
//                  {/* ... timesheet mapping logic remains the same ... */}
//                  {timesheets.length ? (
//                     timesheets.map(ts => {
//                         const mapping = mappings[ts.foreman_id];
//                         const cardClass = `timesheet-card ${expandedCardId === ts.id ? 'expanded' : ''}`;
//                         return (
//                             <article
//                                 key={ts.id}
//                                 className={cardClass}
//                                 aria-label={`Timesheet: ${ts.timesheet_name}`}
//                                 onClick={() => handleCardClick(ts)}
//                             >
//                                 <div className="card-header">
//                                     <h2>{ts.timesheet_name}</h2>
//                                     <time dateTime={ts.date}>
//                                         {new Date(ts.date).toLocaleDateString()}
//                                     </time>
//                                 </div>
//                                 <div className="card-details">
//                                     <p>
//                                         <strong>Foreman:</strong>{" "}
//                                         <span className="foreman-link">{ts.foreman_name}</span>
//                                     </p>
//                                     {expandedCardId === ts.id && (
//                                         <>
//                                             {loadingMappings[ts.foreman_id] && <p>Loading crew details...</p>}
//                                             {mapping && (
//                                                 <div className="crew-details-box">
//                                                     <p><strong>Employees:</strong> {mapping.employees?.map(e => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p>
//                                                     <p><strong>Equipment:</strong> {mapping.equipment?.map(eq => eq.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Materials:</strong> {mapping.materials?.map(mat => mat.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Vendors:</strong> {mapping.vendors?.map(ven => ven.name).join(", ") || "N/A"}</p>
//                                                 </div>
//                                             )}
//                                         </>
//                                     )}
//                                     <p><strong>Job Code:</strong> {ts.data?.job?.job_code || "N/A"}</p>
//                                     <p><strong>Phases:</strong> {ts.data?.job?.phase_codes?.join(", ") || "N/A"}</p>
//                                 </div>
//                             </article>
//                         );
//                     })
//                 ) : (
//                     <p className="empty-message">No timesheets available.</p>
//                 )}
//              </section>
//         </div>
//     );
// }





// import React, { useState, useEffect } from "react";
// import TimesheetForm from "./TimesheetForm";
// import axios from "axios";
// import "./application.css";
// const API_URL = "http://127.0.0.1:8000/api";
// export default function ApplicationAdminPage() {
//     const [showForm, setShowForm] = useState(false);
//     const [timesheets, setTimesheets] = useState([]);
//     const [mappings, setMappings] = useState({});
//     const [loadingMappings, setLoadingMappings] = useState({});
//     const [error, setError] = useState("");
//     const [expandedCardId, setExpandedCardId] = useState(null);
//     const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
//     // Fetch all timesheets
//     const fetchTimesheets = async () => {
//         try {
//             const res = await axios.get(`${API_URL}/timesheets/`);
//             setTimesheets(res.data);
//         } catch (err) {
//             setError("Could not fetch timesheets");
//         }
//     };
//     // Fetch crew mapping for a foreman (omitted for brevity)
//     const fetchMapping = async (foremanId) => {
//         if (!foremanId || mappings[foremanId] || loadingMappings[foremanId]) return;
//         try {
//             setLoadingMappings(prev => ({ ...prev, [foremanId]: true }));
//             const res = await axios.get(`${API_URL}/crew-mapping/by-foreman/${foremanId}`);
//             setMappings(prev => ({ ...prev, [foremanId]: res.data }));
//         } catch (err) {
//             console.error(`Error fetching mapping for foreman ID ${foremanId}:`, err.response ? err.response.data : err.message);
//         } finally {
//             setLoadingMappings(prev => ({ ...prev, [foremanId]: false }));
//         }
//     };
//     const handleCardClick = (timesheet) => {
//         const { id, foreman_id } = timesheet;
//         if (expandedCardId === id) {
//             setExpandedCardId(null);
//         } else {
//             setExpandedCardId(id);
//             fetchMapping(foreman_id);
//         }
//     };
//     const handleLogout = () => {
//         localStorage.removeItem('authToken');
//         window.location.reload();
//     };
//     const toggleViewMode = () => {
//         setViewMode(prevMode => (prevMode === 'grid' ? 'list' : 'grid'));
//     };
//     useEffect(() => {
//         fetchTimesheets();
//     }, []);
//     const isGridView = viewMode === 'grid';
//     const nextViewIcon = isGridView ? '' : '';
//     const nextViewText = isGridView ? 'Switch to List View' : 'Switch to Grid View';
//     const timesheetGridClass = isGridView ? 'timesheet-grid' : 'timesheet-list';
//     return (
//         <div className="admin-page-container">
//             {/* Header with Buttons */}
//             <header className="admin-header">
//                 <h1>Application Admin Portal</h1>
//                 <div className="header-actions"> {/* NEW CONTAINER */}
//                     <button className="btn btn-primary" onClick={() => setShowForm(true)}>
//                         + Create Timesheet
//                     </button>
//                     <button className="btn btn-icon-link" onClick={handleLogout}>
//                         Logout
//                     </button>
//                 </div>
//             </header>
//             {/* Controls Section */}
//             <div className="dashboard-controls-bar"> {/* NEW CONTAINER for controls */}
//                 {/* Switch View Button */}
//                 <div className="timesheet-controls">
//                     <button
//                         className="btn btn-toggle"
//                         onClick={toggleViewMode}
//                         aria-pressed={!isGridView}
//                         aria-label={nextViewText}
//                     >
//                         {nextViewIcon} {nextViewText}
//                     </button>
//                 </div>
//             </div>
//             {/* Show Timesheet Form */}
//             {showForm && (
//                 <TimesheetForm onClose={() => { setShowForm(false); fetchTimesheets(); }} />
//             )}
//             {error && <p className="error-message">{error}</p>}
//             {/* Timesheet Grid/List (Omitted for brevity, no changes needed here) */}
//              <section className={timesheetGridClass}>
//                  {/* ... timesheet mapping logic remains the same ... */}
//                  {timesheets.length ? (
//                     timesheets.map(ts => {
//                         const mapping = mappings[ts.foreman_id];
//                         const cardClass = `timesheet-card ${expandedCardId === ts.id ? 'expanded' : ''}`;
//                         return (
//                             <article
//                                 key={ts.id}
//                                 className={cardClass}
//                                 aria-label={`Timesheet: ${ts.timesheet_name}`}
//                                 onClick={() => handleCardClick(ts)}
//                             >
//                                 <div className="card-header">
//                                     <h2>{ts.timesheet_name}</h2>
//                                     <time dateTime={ts.date}>
//                                         {new Date(ts.date).toLocaleDateString()}
//                                     </time>
//                                 </div>
//                                 <div className="card-details">
//                                     <p>
//                                         <strong>Foreman:</strong>{" "}
//                                         <span className="foreman-link">{ts.foreman_name}</span>
//                                     </p>
//                                     {expandedCardId === ts.id && (
//                                         <>
//                                             {loadingMappings[ts.foreman_id] && <p>Loading crew details...</p>}
//                                             {mapping && (
//                                                 <div className="crew-details-box">
//                                                     <p><strong>Employees:</strong> {mapping.employees?.map(e => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p>
//                                                     <p><strong>Equipment:</strong> {mapping.equipment?.map(eq => eq.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Materials and Trucking:</strong> {mapping.materials?.map(mat => mat.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Work Performed:</strong> {mapping.vendors?.map(ven => ven.name).join(", ") || "N/A"}</p>
//                                                     <p><strong>Dumping Sites:</strong> {mapping.dumping_sites?.map(site => site.name).join(", ") || "N/A"}</p>

//                                                 </div>
//                                             )}
//                                         </>
//                                     )}
//                                     <p><strong>Job Code:</strong> {ts.data?.job?.job_code || "N/A"}</p>
//                                     <p><strong>Phases:</strong> {ts.data?.job?.phase_codes?.join(", ") || "N/A"}</p>
//                                 </div>
//                             </article>
//                         );
//                     })
//                 ) : (
//                     <p className="empty-message">No timesheets available.</p>
//                 )}
//              </section>
//         </div>
//     );
// }


import React, { useState, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaRegEdit,
  FaClipboardList,
} from "react-icons/fa";
import TimesheetForm from "./TimesheetForm.jsx";
import axios from "axios";
const API_URL = "http://127.0.0.1:8000/api";
export default function ApplicationAdmin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("projects");
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const [timesheets, setTimesheets] = useState([]);
  const [mappings, setMappings] = useState({});
  const [loadingMappings, setLoadingMappings] = useState({});
  const [error, setError] = useState("");
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.reload();
  };
  const sections = ["createTimesheet", "viewTimesheets"];
  const getIconForSection = (section) => {
    switch (section) {
      case "createTimesheet":
        return <FaRegEdit className="icon" />;
      case "viewTimesheets":
        return <FaClipboardList className="icon" />;
      default:
        return <FaRegEdit className="icon" />;
    }
  };
  const handleSectionClick = (sec) => {
    setActiveSection(sec);
  };
  // --- Fetch all timesheets ---
  // --- Fetch all timesheets ---
const fetchTimesheets = async () => {
  try {
    const res = await axios.get(`${API_URL}/timesheets/`);
    const sorted = res.data.sort(
      (a, b) => new Date(b.date) - new Date(a.date)  // Newest (today) first
    );
    setTimesheets(sorted);
  } catch (err) {
    setError("Could not fetch timesheets");
  }
};
  // --- Fetch crew mapping for a foreman ---
  const fetchMapping = async (foremanId) => {
    if (!foremanId || mappings[foremanId] || loadingMappings[foremanId]) return;
    try {
      setLoadingMappings((prev) => ({ ...prev, [foremanId]: true }));
      const res = await axios.get(`${API_URL}/crew-mapping/by-foreman/${foremanId}`);
      setMappings((prev) => ({ ...prev, [foremanId]: res.data }));
    } catch (err) {
      console.error(
        `Error fetching mapping for foreman ID ${foremanId}:`,
        err.response ? err.response.data : err.message
      );
    } finally {
      setLoadingMappings((prev) => ({ ...prev, [foremanId]: false }));
    }
  };
  const handleCardClick = (ts) => {
    if (expandedCardId === ts.id) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(ts.id);
      fetchMapping(ts.foreman_id);
    }
  };
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  };
  useEffect(() => {
    if (activeSection === "viewTimesheets") {
      fetchTimesheets();
    }
  }, [activeSection]);
  return (
    <div className="admin-layout">
      <nav
        className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{ width: sidebarCollapsed ? 60 : 250 }}
      >
        <div className="sidebar-top">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn btn-outline btn-sm toggle-sidebar"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <div className="sidebar-header">
          {!sidebarCollapsed && <h3 className="sidebar-title">APPLICATION ADMIN</h3>}
          {!sidebarCollapsed && (
            <>
              <div className="current-date">{currentDate}</div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
        <ul className="sidebar-nav">
          {sections.map((sec) => (
            <li key={sec}>
              <button
                onClick={() => handleSectionClick(sec)}
                className={activeSection === sec ? "active" : ""}
              >
                {getIconForSection(sec)}
                {!sidebarCollapsed && (
                  <span className="label">
                    {sec === "createTimesheet"
                      ? "Create Timesheet"
                      : sec === "viewTimesheets"
                      ? "View Timesheets"
                      : sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="admin-content" style={{ marginLeft: sidebarCollapsed ? 60 : 0 }}>
        {activeSection === "createTimesheet" && (
          <div className="timesheet-page-content">
            <TimesheetForm onClose={() => setActiveSection("projects")} />
          </div>
        )}
        {activeSection === "viewTimesheets" && (
          <div className="timesheet-page-content">
            <div className="timesheet-controls">
              <button className="btn btn-toggle" onClick={toggleViewMode}>
                {viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
            <section className={viewMode === "grid" ? "timesheet-grid" : "timesheet-list"}>
              {timesheets.length ? (
                timesheets.map((ts) => {
                  const mapping = mappings[ts.foreman_id];
                  return (
                    <article
                      key={ts.id}
                      className={`timesheet-card ${expandedCardId === ts.id ? "expanded" : ""}`}
                      onClick={() => handleCardClick(ts)}
                    >
                      <div className="card-header">
                        <h2>{ts.timesheet_name}</h2>
                        <time dateTime={ts.date}>
                          {new Date(ts.date).toLocaleDateString()}
                        </time>
                      </div>
                      <div className="card-details">
                        <p>
                          <strong>Foreman:</strong>{" "}
                          <span className="foreman-link">{ts.foreman_name}</span>
                        </p>
                        {expandedCardId === ts.id && (
                          <>
                            {loadingMappings[ts.foreman_id] && <p>Loading crew details...</p>}
                            {mapping && (
                              <div className="crew-details-box">
                                <p>
                                  <strong>Employees:</strong>{" "}
                                  {mapping.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}
                                </p>
                                <p>
                                  <strong>Equipment:</strong>{" "}
                                  {mapping.equipment?.map((eq) => eq.name).join(", ") || "N/A"}
                                </p>
                                <p>
                                  <strong>Materials and Trucking:</strong>{" "}
                                  {mapping.materials?.map((mat) => mat.name).join(", ") || "N/A"}
                                </p>
                                <p>
                                  <strong>Work Performed:</strong>{" "}
                                  {mapping.vendors?.map((ven) => ven.name).join(", ") || "N/A"}
                                </p>
                                <p>
                                  <strong>Dumping Sites:</strong>{" "}
                                  {mapping.dumping_sites?.map((site) => site.name).join(", ") || "N/A"}
                                </p>
                                <p><strong>Job Code:</strong> {ts.data?.job?.job_code || "N/A"}</p>
                                <p><strong>Phases:</strong> {ts.data?.job?.phase_codes?.join(", ") || "N/A"}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="empty-message">No timesheets available.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}