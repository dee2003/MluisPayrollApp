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





import React, { useState, useEffect } from "react";
import TimesheetForm from "./TimesheetForm";
import axios from "axios";
import "./application.css";
const API_URL = "http://127.0.0.1:8000/api";
export default function ApplicationAdminPage() {
    const [showForm, setShowForm] = useState(false);
    const [timesheets, setTimesheets] = useState([]);
    const [mappings, setMappings] = useState({});
    const [loadingMappings, setLoadingMappings] = useState({});
    const [error, setError] = useState("");
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    // Fetch all timesheets
    const fetchTimesheets = async () => {
        try {
            const res = await axios.get(`${API_URL}/timesheets/`);
            setTimesheets(res.data);
        } catch (err) {
            setError("Could not fetch timesheets");
        }
    };
    // Fetch crew mapping for a foreman (omitted for brevity)
    const fetchMapping = async (foremanId) => {
        if (!foremanId || mappings[foremanId] || loadingMappings[foremanId]) return;
        try {
            setLoadingMappings(prev => ({ ...prev, [foremanId]: true }));
            const res = await axios.get(`${API_URL}/crew-mapping/by-foreman/${foremanId}`);
            setMappings(prev => ({ ...prev, [foremanId]: res.data }));
        } catch (err) {
            console.error(`Error fetching mapping for foreman ID ${foremanId}:`, err.response ? err.response.data : err.message);
        } finally {
            setLoadingMappings(prev => ({ ...prev, [foremanId]: false }));
        }
    };
    const handleCardClick = (timesheet) => {
        const { id, foreman_id } = timesheet;
        if (expandedCardId === id) {
            setExpandedCardId(null);
        } else {
            setExpandedCardId(id);
            fetchMapping(foreman_id);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        window.location.reload();
    };
    const toggleViewMode = () => {
        setViewMode(prevMode => (prevMode === 'grid' ? 'list' : 'grid'));
    };
    useEffect(() => {
        fetchTimesheets();
    }, []);
    const isGridView = viewMode === 'grid';
    const nextViewIcon = isGridView ? '' : '';
    const nextViewText = isGridView ? 'Switch to List View' : 'Switch to Grid View';
    const timesheetGridClass = isGridView ? 'timesheet-grid' : 'timesheet-list';
    return (
        <div className="admin-page-container">
            {/* Header with Buttons */}
            <header className="admin-header">
                <h1>Application Admin Portal</h1>
                <div className="header-actions"> {/* NEW CONTAINER */}
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        + Create Timesheet
                    </button>
                    <button className="btn btn-icon-link" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>
            {/* Controls Section */}
            <div className="dashboard-controls-bar"> {/* NEW CONTAINER for controls */}
                {/* Switch View Button */}
                <div className="timesheet-controls">
                    <button
                        className="btn btn-toggle"
                        onClick={toggleViewMode}
                        aria-pressed={!isGridView}
                        aria-label={nextViewText}
                    >
                        {nextViewIcon} {nextViewText}
                    </button>
                </div>
            </div>
            {/* Show Timesheet Form */}
            {showForm && (
                <TimesheetForm onClose={() => { setShowForm(false); fetchTimesheets(); }} />
            )}
            {error && <p className="error-message">{error}</p>}
            {/* Timesheet Grid/List (Omitted for brevity, no changes needed here) */}
             <section className={timesheetGridClass}>
                 {/* ... timesheet mapping logic remains the same ... */}
                 {timesheets.length ? (
                    timesheets.map(ts => {
                        const mapping = mappings[ts.foreman_id];
                        const cardClass = `timesheet-card ${expandedCardId === ts.id ? 'expanded' : ''}`;
                        return (
                            <article
                                key={ts.id}
                                className={cardClass}
                                aria-label={`Timesheet: ${ts.timesheet_name}`}
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
                                                    <p><strong>Employees:</strong> {mapping.employees?.map(e => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p>
                                                    <p><strong>Equipment:</strong> {mapping.equipment?.map(eq => eq.name).join(", ") || "N/A"}</p>
                                                    <p><strong>Materials and Trucking:</strong> {mapping.materials?.map(mat => mat.name).join(", ") || "N/A"}</p>
                                                    <p><strong>Work Performed:</strong> {mapping.vendors?.map(ven => ven.name).join(", ") || "N/A"}</p>
                                                    <p><strong>Dumping Sites:</strong> {mapping.dumping_sites?.map(site => site.name).join(", ") || "N/A"}</p>

                                                </div>
                                            )}
                                        </>
                                    )}
                                    <p><strong>Job Code:</strong> {ts.data?.job?.job_code || "N/A"}</p>
                                    <p><strong>Phases:</strong> {ts.data?.job?.phase_codes?.join(", ") || "N/A"}</p>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <p className="empty-message">No timesheets available.</p>
                )}
             </section>
        </div>
    );
}
