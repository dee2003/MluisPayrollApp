





// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import CrewMappingManager from './CrewMappingManager';
// import "./CrewMapping.css";
// // Corrected: Cleaned up imports and added icons for sidebar toggle
// import { FaUser, FaHardHat, FaTasks, FaBox, FaBriefcase, FaUsers, FaTrash, FaBars, FaTimes } from 'react-icons/fa';
// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
// const API_URL = "http://127.0.0.1:8000/api";

// // --- Reusable Modal Component (Unchanged) ---
// const Modal = ({ title, children, onClose, size = "medium" }) => (
//     <div className="modal">
//         <div className={`modal-content ${size}`}>
//             <div className="modal-header">
//                 <h3>{title}</h3>
//                 <button onClick={onClose} className="btn-sm btn-outline">×</button>
//             </div>
//             <div className="modal-body-scrollable">{children}</div>
//         </div>
//     </div>
// );

// // --- Notification & Confirmation Modals (Unchanged) ---
// const NotificationModal = ({ message, onClose }) => (
//     <div className="modal">
//         <div className="modal-content small">
//             <div className="modal-header">
//                 <h3>Notification</h3>
//                 <button onClick={onClose} className="btn-sm btn-outline">×</button>
//             </div>
//             <div className="modal-body"><p>{message}</p></div>
//             <div className="modal-actions" style={{ justifyContent: 'center' }}>
//                 <button onClick={onClose} className="btn btn-primary">OK</button>
//             </div>
//         </div>
//     </div>
// );

// const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
//     <div className="modal">
//         <div className="modal-content small">
//             <div className="modal-header">
//                 <h3>Confirmation</h3>
//                 <button onClick={onCancel} className="btn-sm btn-outline">×</button>
//             </div>
//             <div className="modal-body"><p>{message}</p></div>
//             <div className="modal-actions">
//                 <button onClick={onCancel} className="btn btn-outline">Cancel</button>
//                 <button onClick={onConfirm} className="btn btn-danger">Confirm</button>
//             </div>
//         </div>
//     </div>
// );

// const getIconForSection = (sec) => {
//     switch(sec) {
//         case "users": return <FaUser />;
//         case "employees": return <FaUser />;
//         case "equipment": return <FaHardHat />;
//         case "job_phases": return <FaTasks />;
//         case "materials": return <FaBox />;
//         case "vendors": return <FaBriefcase />;
//         case "crewMapping": return <FaUsers />;
//         case "dumping_sites": return <FaTrash />;
//         default: return <FaTasks />;
//     }
// };

// // --- Generic Form Component (Unchanged) ---
// const GenericForm = ({ fields, onSubmit, defaultValues, errorMessage }) => {
//     const [values, setValues] = useState(() => {
//         const initialValues = { ...defaultValues };
//         fields.forEach(field => {
//             if (initialValues[field.name] === undefined && field.defaultValue !== undefined) {
//                 initialValues[field.name] = field.defaultValue;
//             }
//         });
//         return initialValues;
//     });
//     const [errors, setErrors] = useState({});

//     const validateField = (name, value) => {
//         let error = "";
//         const field = fields.find(f => f.name === name);
//         if (field?.required && !value) {
//             error = `${field.label} is required.`;
//         }
//         setErrors(prev => ({ ...prev, [name]: error }));
//         return error;
//     };

//     const handleChange = e => {
//         const { name, value } = e.target;
//         setValues(prev => ({ ...prev, [name]: value }));
//         validateField(name, value);
//     };

//     const handleSubmit = e => {
//         e.preventDefault();
//         let newErrors = {};
//         fields.forEach(f => {
//             const error = validateField(f.name, values[f.name]);
//             if (error) newErrors[f.name] = error;
//         });
//         setErrors(newErrors);
//         if (Object.keys(newErrors).length === 0) onSubmit(values);
//     };

//     return (
//         <form onSubmit={handleSubmit}>
//             {errorMessage && (<div className="form-error-top">{errorMessage}</div>)}
//             {fields.map(field => (
//                 <div className="form-group" key={field.name}>
//                     <label className="form-label">{field.label}</label>
//                     {field.type === "select" ? (
//                         <select name={field.name} className="form-control" value={values[field.name] || ""} onChange={handleChange}>
//                             {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                         </select>
//                     ) : (
//                         <input
//                             type={field.type || "text"}
//                             name={field.name}
//                             className="form-control"
//                             value={values[field.name] || ""}
//                             onChange={handleChange}
//                             required={field.required}
//                             autoComplete={field.type === "password" ? "new-password" : "off"}
//                         />
//                     )}
//                     {errors[field.name] && <small style={{ color: "red", fontSize: "12px" }}>{errors[field.name]}</small>}
//                 </div>
//             ))}
//             <div className="modal-actions">
//                 <button type="submit" className="btn btn-primary">Save</button>
//             </div>
//         </form>
//     );
// };

// // --- Job & Phases Components (Unchanged) ---
// const JobPhasesTable = ({ phases, onEdit, onDelete }) => (
//     <table className="data-table">
//         <thead><tr><th>Phase Code</th><th>Actions</th></tr></thead>
//         <tbody>
//             {phases.map((p, i) => (
//                 <tr key={`${p.phase_code}-${i}`}>
//                     <td>{p.phase_code}</td>
//                     <td>
//                         <button onClick={() => onEdit(i)} className="btn btn-sm">Edit</button>
//                         <button onClick={() => onDelete(i)} className="btn btn-sm btn-outline">Delete</button>
//                     </td>
//                 </tr>
//             ))}
//         </tbody>
//     </table>
// );

// const JobWithPhasesModal = ({ mode, job, onSave, onClose, showNotification }) => {
//     const [jobCode, setJobCode] = useState(job?.job_code || "");
//     const [contractNo, setContractNo] = useState(job?.contract_no || "");
//     const [jobDescription, setJobDescription] = useState(job?.job_description || "");
//     const [projectEngineer, setProjectEngineer] = useState(job?.project_engineer || "");
//     const [jurisdiction, setJurisdiction] = useState(job?.jurisdiction || "");
//     const [status, setStatus] = useState(job?.status || "Active");
//     const [phaseCode, setPhaseCode] = useState("");
//     const [phases, setPhases] = useState(job?.phases || []);
//     const [editIdx, setEditIdx] = useState(null);
//     const fixedPhases = ["Admin", "S&SL", "Vacation"];

//     const handleAddPhase = () => {
//         if (!phaseCode.trim()) return showNotification("Please enter a phase code.");
//         if (phases.some((p, idx) => p.phase_code === phaseCode.trim() && idx !== editIdx))
//             return showNotification("This phase code already exists.");
//         if (editIdx !== null) {
//             setPhases(phases.map((p, i) => (i === editIdx ? { phase_code: phaseCode.trim() } : p)));
//             setEditIdx(null);
//         } else {
//             setPhases([...phases, { phase_code: phaseCode.trim() }]);
//         }
//         setPhaseCode("");
//     };

//     const handleEditPhase = (idx) => {
//         setPhaseCode(phases[idx].phase_code);
//         setEditIdx(idx);
//     };

//     const handleDeletePhase = (idx) => {
//         setPhases(phases.filter((_, i) => i !== idx));
//     };

//     const handleSubmit = () => {
//         if (!jobCode.trim()) return showNotification("Job code is a required field.");
//         const finalPhaseCodes = [...new Set([...phases.map(p => p.phase_code), ...fixedPhases])];
//         const jobData = { job_code: jobCode.trim(), contract_no: contractNo.trim(), job_description: jobDescription.trim(), project_engineer: projectEngineer.trim(), jurisdiction: jurisdiction.trim(), status, phases: finalPhaseCodes };
//         onSave(jobData);
//     };

//     return (
//         <Modal title={mode === "edit" ? "Edit Job & Phases" : "Create Job & Phases"} onClose={onClose} size="large">
//             <div className="form-grid">
//                 <div className="form-group"><label>Job Code</label><input type="text" value={jobCode} onChange={(e) => setJobCode(e.target.value)} disabled={mode === "edit"} className="form-control" required /></div>
//                 <div className="form-group"><label>Contract No.</label><input type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="form-control" /></div>
//                 <div className="form-group"><label>Project Engineer</label><input type="text" value={projectEngineer} onChange={(e) => setProjectEngineer(e.target.value)} className="form-control" /></div>
//                 <div className="form-group"><label>Jurisdiction</label><input type="text" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="form-control" /></div>
//                 <div className="form-group full-width"><label>Job Description</label><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-control" rows="3"></textarea></div>
//                 <div className="form-group"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
//             </div>
//             <hr style={{ margin: "16px 0" }} />
//             <h4>Editable Phases</h4>
//             <div className="phases-table-wrapper"><JobPhasesTable phases={phases} onEdit={handleEditPhase} onDelete={handleDeletePhase} /></div>
//             <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
//                 <input type="text" value={phaseCode} onChange={(e) => setPhaseCode(e.target.value)} placeholder="New Phase Code" className="form-control" />
//                 <button type="button" onClick={handleAddPhase} className="btn">{editIdx !== null ? "Update" : "Add"}</button>
//                 {editIdx !== null && (<button type="button" onClick={() => { setEditIdx(null); setPhaseCode(""); }} className="btn btn-outline">Cancel</button>)}
//             </div>
//             <div style={{ marginTop: "16px" }}><h4>Fixed Phases</h4><ul className="fixed-phases-list">{fixedPhases.map(p => <li key={p}>{p}</li>)}</ul></div>
//             <div className="modal-actions"><button onClick={handleSubmit} className="btn btn-primary">Save Job</button></div>
//         </Modal>
//     );
// };

// const JobPhasesViewModal = ({ job, onClose }) => (
//     <Modal title={`Phases for ${job.job_code}`} onClose={onClose}>
//         <table className="data-table">
//             <thead><tr><th>Phase Code</th></tr></thead>
//             <tbody>{(job.phase_codes || []).map((phase, idx) => (<tr key={idx}><td>{phase}</td></tr>))}</tbody>
//         </table>
//     </Modal>
// );

// // --- Main Admin Dashboard Component ---
// const AdminDashboard = ({ data: initialData, onLogout }) => {
//     // MODIFIED: Robust state initialization to guarantee all keys exist.
//     const [data, setData] = useState(() => {
//         const defaults = {
//             users: [], employees: [], equipment: [], job_phases: [], 
//             materials: [], vendors: [], dumping_sites: []
//         };
//         return { ...defaults, ...(initialData || {}) };
//     });

//     const [activeSection, setActiveSection] = useState("users");
//     const [modal, setModal] = useState({ shown: false, type: "", title: "", mode: "add", item: null });
//     const [jobModal, setJobModal] = useState({ shown: false, mode: "", job: null });
//     const [viewPhasesJob, setViewPhasesJob] = useState(null);
//     const [notification, setNotification] = useState({ shown: false, message: "" });
//     const [confirmation, setConfirmation] = useState({ shown: false, message: "", onConfirm: () => {} });
//     const [formError, setFormError] = useState("");
//     const [isLoading, setIsLoading] = useState(true);
//     const [fetchError, setFetchError] = useState(null);
//     const showNotification = (message) => setNotification({ shown: true, message });
//     const showConfirmation = (message, onConfirmAction) => setConfirmation({ shown: true, message, onConfirm: () => {
//         onConfirmAction();
//         setConfirmation({ shown: false, message: "", onConfirm: () => {} });
//     }});

//     const closeMainModal = () => {
//         setModal({ shown: false, type: "", title: "", mode: "add", item: null });
//         setFormError("");
//     };
// const API_ENDPOINTS = [
//         "users", "employees", "equipment", "materials", 
//         "vendors", "dumping_sites", "job-phases"
//     ];
//     const [sidebarWidth, setSidebarWidth] = useState(220);
//     const [isResizing, setIsResizing] = useState(false);
//     const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//     const [currentDate, setCurrentDate] = useState("");
// useEffect(() => {
//         const fetchData = async () => {
//             setIsLoading(true);
//             setFetchError(null);
//             const newData = {};
//             let hasError = false;

//             for (const endpoint of API_ENDPOINTS) {
//                 try {
//                     const response = await axios.get(`${API_URL}/${endpoint}`);
//                     // Map job-phases back to job_phases key for state consistency
//                     const key = endpoint === 'job-phases' ? 'job_phases' : endpoint;
//                     newData[key] = response.data;
//                 } catch (error) {
//                     // Log the error but continue trying to fetch other data
//                     console.error(`Error fetching ${endpoint}:`, error);
//                     setFetchError(`Failed to load data for ${endpoint}.`);
//                     hasError = true;
//                 }
//             }

//             if (!hasError) {
//                 setData(newData); // Replace initial state with fetched data
//             }
//             setIsLoading(false);
//         };
        
//         fetchData();
//     }, []);

//     useEffect(() => {
//         const now = new Date();
//         const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
//         setCurrentDate(now.toLocaleDateString(undefined, options));
//     }, []);

//     useEffect(() => {
//         const handleMouseMove = (e) => {
//             if (isResizing) {
//                 const newWidth = Math.max(60, Math.min(e.clientX, 400));
//                 setSidebarWidth(newWidth);
//             }
//         };
//         const handleMouseUp = () => { if (isResizing) setIsResizing(false); };
//         window.addEventListener("mousemove", handleMouseMove);
//         window.addEventListener("mouseup", handleMouseUp);
//         return () => {
//             window.removeEventListener("mousemove", handleMouseMove);
//             window.removeEventListener("mouseup", handleMouseUp);
//         };
//     }, [isResizing]);

//     const typeToStateKey = { user: "users", employee: "employees", equipment: "equipment", job_phase: "job_phases", material: "materials", vendor: "vendors", dumping_site: "dumping_sites" };

//     const onUpdate = (key, newList) => setData(prev => ({ ...prev, [key]: newList }));

//     const handleSaveJob = async (jobData) => {
//         const { job_code, phases, ...otherJobData } = jobData;
//         const payload = { ...otherJobData, job_code, phase_codes: phases };
//         const isEditMode = jobModal.mode === 'edit';
//         const url = isEditMode ? `${API_URL}/job-phases/${encodeURIComponent(job_code)}` : `${API_URL}/job-phases/`;
//         const apiCall = isEditMode ? axios.put : axios.post;
//         try {
//             const response = await apiCall(url, payload);
//             setData(prev => {
//                 const updatedJobs = [...(prev.job_phases || [])];
//                 const existingIndex = updatedJobs.findIndex(j => j.job_code === job_code);
//                 if (existingIndex !== -1) updatedJobs[existingIndex] = response.data;
//                 else updatedJobs.push(response.data);
//                 return { ...prev, job_phases: updatedJobs };
//             });
//             setJobModal({ shown: false, mode: "", job: null });
//         } catch (err) {
//             const errorMessage = err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message;
//             showNotification(`Error saving job: ${errorMessage}`);
//         }
//     };

//     // MODIFIED: Re-applied the critical safety check `|| []`
//     const handleAddOrUpdateItem = async (type, itemData, mode, existingItem = null) => {
//         const stateKey = typeToStateKey[type];
//         setFormError("");

//         if (mode === "add") {
//             const idKey = (type === 'user') ? 'username' : 'id';
//             const newItemId = itemData[idKey];
//             // THIS IS THE FIX: Always use a fallback empty array.
//             if ((data[stateKey] || []).some(item => item[idKey] === newItemId)) {
//                 const itemType = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
//                 setFormError(`${itemType} with ID '${newItemId}' already exists.`);
//                 return;
//             }
//         }

//         try {
//             let response;
//             if (mode === "edit" && existingItem) {
//                 const itemId = existingItem.id;
//                 response = await axios.put(`${API_URL}/${stateKey}/${encodeURIComponent(itemId)}`, itemData);
//                 onUpdate(stateKey, (data[stateKey] || []).map(it => it.id === itemId ? response.data : it));
//             } else {
//                 response = await axios.post(`${API_URL}/${stateKey}/`, itemData);
//                 onUpdate(stateKey, [response.data, ...(data[stateKey] || [])]);
//             }
//             closeMainModal();
//         } catch (error) {
//             const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : "An unexpected error occurred.";
//             setFormError(`Error: ${errorMessage}`);
//         }
//     };
//     // ✅ Toggle Active / Inactive status
// const handleToggleStatus = async (type, item) => {
//   const stateKey = typeToStateKey[type];
//   const newStatus = item.status === "Active" ? "Inactive" : "Active";
//   const updatedItem = { ...item, status: newStatus };

//   try {
//     const response = await axios.put(
//       `${API_URL}/${stateKey}/${encodeURIComponent(item.id)}`,
//       updatedItem
//     );

//     // Update the local state
//     onUpdate(
//       stateKey,
//       (data[stateKey] || []).map((it) =>
//         it.id === item.id ? response.data : it
//       )
//     );
//   } catch (error) {
//     console.error("Error toggling status:", error);
//     const errorMessage = error.response?.data
//       ? JSON.stringify(error.response.data)
//       : "An unexpected error occurred.";
//     alert(`Error updating status: ${errorMessage}`);
//   }
// };



//     const handleDeleteItem = async (type, itemId) => {
//         const deleteAction = async () => {
//             const urlKey = type === 'job_phase' ? 'job-phases' : typeToStateKey[type];
//             const dataKey = type === 'job_phase' ? 'job_phases' : typeToStateKey[type];
//             try {
//                 const url = `${API_URL}/${urlKey}/${encodeURIComponent(itemId)}`;
//                 await axios.delete(url);
//                 const idKey = type === 'job_phase' ? 'job_code' : 'id';
//                 onUpdate(dataKey, (data[dataKey] || []).filter(item => item[idKey] !== itemId));
//             } catch (error) {
//                 const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
//                 showNotification(`Error deleting ${type}: ${errorMessage}`);
//             }
//         };
//         const itemLabel = type.replace('_', ' ');
//         showConfirmation(`Are you sure you want to delete this ${itemLabel}?`, deleteAction);
//     };

//     // Corrected: Fixed misplaced case statement
//     const getFormFields = (type) => {
//         switch (type) {
//             case "user": return [ { name: "username", label: "Username", required: true }, { name: "first_name", label: "First Name", required: true }, { name: "middle_name", label: "Middle Name" }, { name: "last_name", label: "Last Name", required: true }, { name: "email", label: "Email", required: true, type: "email" }, { name: "password", label: "Password", type: "password", required: true }, { name: "role", label: "Role", type: "select", options: [ { value: "foreman", label: "Foreman" }, { value: "supervisor", label: "Supervisor" }, { value: "project_engineer", label: "Project Engineer" }, { value: "admin", label: "Accountant" } ], required: true, defaultValue: "admin" } ];
//             case "employee": return [ { name: "id", label: "Employee ID", required: true }, { name: "first_name", label: "First Name", required: true }, { name: "middle_name", label: "Middle Name" }, { name: "last_name", label: "Last Name", required: true }, { name: "class_1", label: "Class Code 1" }, { name: "class_2", label: "Class Code 2" }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//             case "equipment": return [ { name: "id", label: "Equipment ID", required: true }, { name: "name", label: "Equipment Name", required: true }, { name: "type", label: "Category Name" }, { name: "department", label: "Department", required: true }, { name: "category_number", label: "Category Number", required: true }, { name: "vin_number", label: "VIN Number" }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//             case "vendor": return [ { name: "name", label: "Work Performed Name", required: true }, { name: "unit", label: "Unit", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//             case "material": return [ { name: "name", label: "Material/Trucking Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//             case "dumping_site": return [ { name: "id", label: "Site ID", required: true }, { name: "name", label: "Site Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//             default: return [];
//         }
//     };

//     const prepareJobForEditModal = (job) => {
//         const fixedPhases = ["Admin", "S&SL", "Vacation"];
//         const phaseCodes = job.phase_codes || [];
//         return { ...job, phases: phaseCodes.filter(p => !fixedPhases.includes(p)).map(p => ({ phase_code: p })) };
//     };
// const formatRole = (role) => {
//         if (!role) return "";
//         return role
//             .split('_') 
//             .map(word => 
//                 word.charAt(0).toUpperCase() + word.slice(1)
//             )
//             .join(' ');
//     };
//     const renderSection = () => {
//         const makeTable = (type, title, headers, rowRender, itemLabel) => {
//             const label = itemLabel || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
//             const key = typeToStateKey[type];
//             return (<DataTableSection title={title} headers={headers} data={data[key] || []} renderRow={(item) => <>{rowRender(item)}</>} onAdd={() => setModal({ shown: true, type, title: `Add ${label}`, mode: "add", item: null })} onEdit={item => setModal({ shown: true, type, title: `Edit ${label}`, mode: "edit", item })} onDelete={id => handleDeleteItem(type, id)} />);
//         };
//         switch (activeSection) {
//             case "users": 
//                 return makeTable(
//                     "user", 
//                     "User Management", 
//                     ["Username", "First Name", "Last Name", "Role"], 
//                     u => (
//                         <>
//                             <td key={u.username}>{u.username}</td>
//                             <td key={u.first_name}>{u.first_name}</td>
//                             <td key={u.last_name}>{u.last_name}</td>
//                             {/* 🎯 MODIFIED: Apply formatting to the role here */}
//                             <td key={u.role}>{formatRole(u.role)}</td>
//                         </>
//                     )
//                 );
//             case "employees": 
//     return makeTable("employee", "Employee Management", ["ID", "Name", "Class", "Status"], e => {
//         // Construct the full name: First Name [Middle Name ] Last Name
//         const fullName = `${e.first_name} ${e.middle_name ? e.middle_name + ' ' : ''}${e.last_name}`;
        
//         return (<> 
//             <td key={e.id}>{e.id}</td> 
//             {/* 🎯 FIX APPLIED HERE */}
//             <td key={fullName}>{fullName}</td> 
//             <td key={e.class_1}>{`${e.class_1 || ""}${e.class_2 ? " / " + e.class_2 : ""}`}</td> 
//             <td key={e.status}>{e.status}</td> 
//         </>);
//     });
//             case "equipment": return makeTable("equipment", "Equipment Management", ["ID", "Name", "Category Name", "Department", "Category No.", "VIN No.", "Status"], e => (<> <td key={e.id}>{e.id}</td> <td key={e.name}>{e.name}</td> <td key={e.type}>{e.type}</td> <td key={e.department}>{e.department}</td> <td key={e.category_number}>{e.category_number}</td> <td key={e.vin_number}>{e.vin_number}</td> <td key={e.status}>{e.status}</td> </>));
//             case "vendors": return makeTable("vendor", "Work Performed", ["Name", "Unit", "Status"], v => <><td key={v.name}>{v.name}</td><td key={v.unit}>{v.unit}</td><td key={v.status}>{v.status}</td></>, "Work Performed");
//             case "materials": return makeTable("material", "Materials and Trucking", ["Name", "Status"], m => <><td key={m.name}>{m.name}</td><td key={m.status}>{m.status}</td></>, "Material and Trucking");
//             case "job_phases": return (<DataTableSection title="Jobs & Phases Management" headers={["Job Code", "Description", "Project Engineer", "Status"]} data={data.job_phases || []} renderRow={job => (<> <td>{job.job_code}</td> <td>{job.job_description}</td> <td>{job.project_engineer}</td> <td>{job.status}</td> </>)} onAdd={() => setJobModal({ shown: true, mode: "add", job: null })} onEdit={(job) => setJobModal({ shown: true, mode: "edit", job: prepareJobForEditModal(job) })} onDelete={(job_code) => handleDeleteItem("job_phase", job_code)} extraActions={(job) => (<button className="btn btn-view btn-sm" onClick={() => setViewPhasesJob(job)}> View Phases </button>)} />);
//             case "dumping_sites": return makeTable("dumping_site", "Dumping Site Management", ["Site ID", "Site Name", "Status"], ds => (<><td key={ds.id}>{ds.id}</td><td key={ds.name}>{ds.name}</td><td key={ds.status}>{ds.status}</td></>), "Dumping Site");
//             case "crewMapping": 
//                 const allResources = { 
//                     users: data.users || [], employees: data.employees || [], equipment: data.equipment || [], 
//                     materials: data.materials || [], vendors: data.vendors || [], dumping_sites: data.dumping_sites || []
//                 }; 
//                 return <CrewMappingManager allResources={allResources} />;
//             default: return <div>Section not implemented.</div>;
//         }
//     };

//     return (
//         <div className="admin-layout">
//             {notification.shown && <NotificationModal message={notification.message} onClose={() => setNotification({ shown: false, message: "" })} />}
//             {confirmation.shown && <ConfirmationModal message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation({ shown: false, message: "", onConfirm: () => {} })} />}

//             {modal.shown && (
//                 <Modal title={modal.title} onClose={closeMainModal}>
//                     <GenericForm
//                         fields={getFormFields(modal.type)}
//                         defaultValues={modal.item || {}}
//                         onSubmit={(formData) => handleAddOrUpdateItem(modal.type, formData, modal.mode, modal.item)}
//                         errorMessage={formError}
//                     />
//                 </Modal>
//             )}

//             {viewPhasesJob && <JobPhasesViewModal job={viewPhasesJob} onClose={() => setViewPhasesJob(null)} />}
//             {jobModal.shown && <JobWithPhasesModal mode={jobModal.mode} job={jobModal.job} onSave={handleSaveJob} onClose={() => setJobModal({ shown: false, mode: "", job: null })} showNotification={showNotification} />}

            

// {/* 🎯 MODIFIED: Sidebar Structure with Standard Toggle Button */}
// <nav
//   className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
//   style={{ width: sidebarCollapsed ? 60 : sidebarWidth }}
// >
//   {/* 🔝 Top-right toggle button */}
//   <div className="sidebar-top">
//     <button
//       onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
//       className="btn btn-outline btn-sm toggle-sidebar"
//       title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
//     >
//       {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
//     </button>
//   </div>
// <div className="sidebar-header">
//     {/* Sidebar title (visible only when expanded) */}
//     {!sidebarCollapsed && <h3 className="sidebar-title">ADMIN PORTAL</h3>}
     
//     {/* Date & Logout (visible only when expanded) */}
//     {!sidebarCollapsed && (
//       <>
//         <div className="current-date">{currentDate}</div>
//         <button
//           onClick={onLogout}
//           className="btn btn-outline btn-sm logout-btn"
//         >
//           Logout
//         </button>
//       </>
//     )}
//   </div>

//   {/* Navigation List */}
//   <ul className="sidebar-nav">
//     {[
//       "users",
//       "employees",
//       "equipment",
//       "job_phases",
//       "materials",
//       "vendors",
//       "dumping_sites",
//       "crewMapping",
//     ].map((sec) => (
//       <li key={sec}>
//         <button
//           onClick={() => setActiveSection(sec)}
//           className={activeSection === sec ? "active" : ""}
//         >
//           <span className="icon">{getIconForSection(sec)}</span>
//           {!sidebarCollapsed && (
//             <span className="label">
//               {sec === "job_phases"
//                 ? "Jobs & Phases"
//                 : sec === "crewMapping"
//                 ? "Crew Mapping"
//                 : sec === "vendors"
//                 ? "Work Performed"
//                 : sec === "materials"
//                 ? "Materials & Trucking"
//                 : sec === "dumping_sites"
//                 ? "Dumping Sites"
//                 : sec.charAt(0).toUpperCase() + sec.slice(1)}
//             </span>
//           )}
//         </button>
//       </li>
//     ))}
//   </ul>



//                 {/* Resizer is still visible only when not collapsed */}
//                 {!sidebarCollapsed && (<div className="sidebar-resizer" onMouseDown={() => setIsResizing(true)}/>)}
//             </nav>
//            <main
//   className="admin-content"
//   style={{ marginLeft: sidebarCollapsed ? 0 : sidebarWidth - 220 }}
// >
//   {renderSection()}
// </main>

//             {/* <main className="admin-content" style={{ marginLeft: sidebarCollapsed ? 60 : sidebarWidth }}>{renderSection()}</main> */}
//         </div>
//     );
// };

// // Data Table Component is unchanged
// const DataTableSection = ({ title, headers, data = [], renderRow, onDelete, onAdd, onEdit, extraActions }) => (
//     <div className="data-table-container">
//         <div className="section-header"><h2>{title}</h2>{onAdd && <button onClick={onAdd} className="btn btn-primary">Add New</button>}</div>
//         <table className="data-table">
//             <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th>Actions</th></tr></thead>
//             <tbody>
//                 {data.map(item => (
//                     <tr key={item.id || item.job_code || item.username}>
//                         {renderRow(item)}
//                         <td>
//                             {onEdit && <button onClick={() => onEdit(item)} className="btn-edit btn-sm">Edit</button>}
// {item.status && (
//   <button
//     onClick={() => handleToggleStatus(activeSection, item)}
//     className={`btn-sm ${
//       item.status === "Active" ? "btn-outline-danger" : "btn-outline-success"
//     }`}
//   >
//     {item.status === "Active" ? "Deactivate" : "Activate"}
//   </button>
// )}
//                             {extraActions && extraActions(item)}
//                         </td>
//                     </tr>
//                 ))}
//             </tbody>
//         </table>
//     </div>
// );

// export default AdminDashboard;




import React, { useState, useEffect } from "react";
import axios from "axios";
import CrewMappingManager from './CrewMappingManager';
import "./CrewMapping.css";
// Corrected: Cleaned up imports and added icons for sidebar toggle
import { FaUser, FaHardHat, FaTasks, FaBox, FaBriefcase, FaUsers, FaTrash, FaBars, FaTimes } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const API_URL = "http://127.0.0.1:8000/api";

// --- Reusable Modal Component (Unchanged) ---
const Modal = ({ title, children, onClose, size = "medium" }) => (
    <div className="modal">
        <div className={`modal-content ${size}`}>
            <div className="modal-header">
                <h3>{title}</h3>
                <button onClick={onClose} className="btn-sm btn-outline">×</button>
            </div>
            <div className="modal-body-scrollable">{children}</div>
        </div>
    </div>
);

// --- Notification & Confirmation Modals (Unchanged) ---
const NotificationModal = ({ message, onClose }) => (
    <div className="modal">
        <div className="modal-content small">
            <div className="modal-header">
                <h3>Notification</h3>
                <button onClick={onClose} className="btn-sm btn-outline">×</button>
            </div>
            <div className="modal-body"><p>{message}</p></div>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button onClick={onClose} className="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
);

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <div className="modal">
        <div className="modal-content small">
            <div className="modal-header">
                <h3>Confirmation</h3>
                <button onClick={onCancel} className="btn-sm btn-outline">×</button>
            </div>
            <div className="modal-body"><p>{message}</p></div>
            <div className="modal-actions">
                <button onClick={onCancel} className="btn btn-outline">Cancel</button>
                <button onClick={onConfirm} className="btn btn-danger">Confirm</button>
            </div>
        </div>
    </div>
);

const getIconForSection = (sec) => {
    switch(sec) {
        case "users": return <FaUser />;
        case "employees": return <FaUser />;
        case "equipment": return <FaHardHat />;
        case "job_phases": return <FaTasks />;
        case "materials": return <FaBox />;
        case "vendors": return <FaBriefcase />;
        case "crewMapping": return <FaUsers />;
        case "dumping_sites": return <FaTrash />;
        default: return <FaTasks />;
    }
};

// --- Generic Form Component (Unchanged) ---
const GenericForm = ({ fields, onSubmit, defaultValues, errorMessage }) => {
    const [values, setValues] = useState(() => {
        const initialValues = { ...defaultValues };
        fields.forEach(field => {
            if (initialValues[field.name] === undefined && field.defaultValue !== undefined) {
                initialValues[field.name] = field.defaultValue;
            }
        });
        return initialValues;
    });
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        let error = "";
        const field = fields.find(f => f.name === name);
        if (field?.required && !value) {
            error = `${field.label} is required.`;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleSubmit = e => {
        e.preventDefault();
        let newErrors = {};
        fields.forEach(f => {
            const error = validateField(f.name, values[f.name]);
            if (error) newErrors[f.name] = error;
        });
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit}>
            {errorMessage && (<div className="form-error-top">{errorMessage}</div>)}
            {fields.map(field => (
                <div className="form-group" key={field.name}>
                    <label className="form-label">{field.label}</label>
                    {field.type === "select" ? (
                        <select name={field.name} className="form-control" value={values[field.name] || ""} onChange={handleChange}>
                            {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                        <input
                            type={field.type || "text"}
                            name={field.name}
                            className="form-control"
                            value={values[field.name] || ""}
                            onChange={handleChange}
                            required={field.required}
                            autoComplete={field.type === "password" ? "new-password" : "off"}
                        />
                    )}
                    {errors[field.name] && <small style={{ color: "red", fontSize: "12px" }}>{errors[field.name]}</small>}
                </div>
            ))}
            <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
            </div>
        </form>
    );
};

// --- Job & Phases Components (Unchanged) ---
const JobPhasesTable = ({ phases, onEdit, onDelete }) => (
    <table className="data-table">
        <thead><tr><th>Phase Code</th><th>Actions</th></tr></thead>
        <tbody>
            {phases.map((p, i) => (
                <tr key={`${p.phase_code}-${i}`}>
                    <td>{p.phase_code}</td>
                    <td>
                        <button onClick={() => onEdit(i)} className="btn btn-sm">Edit</button>
                        <button onClick={() => onDelete(i)} className="btn btn-sm btn-outline">Delete</button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

// In AdminDashboard.js

const JobWithPhasesModal = ({ mode, job, onSave, onClose, showNotification }) => {
    const [jobCode, setJobCode] = useState(job?.job_code || "");
    const [contractNo, setContractNo] = useState(job?.contract_no || "");
    const [jobDescription, setJobDescription] = useState(job?.job_description || "");
    const [projectEngineer, setProjectEngineer] = useState(job?.project_engineer || "");
    const [jurisdiction, setJurisdiction] = useState(job?.jurisdiction || "");
const [projectEngineerId, setProjectEngineerId] = useState('');

    // ✅ FIX: Ensure status is always handled in lowercase for the backend
    const [status, setStatus] = useState(job?.status?.toLowerCase() || "active"); 
    
    const [phaseCode, setPhaseCode] = useState("");
    const [phases, setPhases] = useState(job?.phases || []);
    const [editIdx, setEditIdx] = useState(null);
    const fixedPhases = ["Admin", "S&SL", "Vacation"];
 const [engineers, setEngineers] = useState([]);

useEffect(() => {
  fetch("http://localhost:8000/api/users?role=Project%20Engineer")
    .then((res) => res.json())
    .then((data) => setEngineers(data))
    .catch((err) => console.error("Error fetching engineers:", err));
}, []);

    // ... (Your handleAddPhase, handleEditPhase, handleDeletePhase functions remain the same)
    const handleAddPhase = () => {
      if (!phaseCode.trim()) return showNotification("Please enter a phase code.");
      if (phases.some((p, idx) => p.phase_code === phaseCode.trim() && idx !== editIdx))
        return showNotification("This phase code already exists.");
      if (editIdx !== null) {
        setPhases(phases.map((p, i) => (i === editIdx ? { phase_code: phaseCode.trim() } : p)));
        setEditIdx(null);
      } else {
        setPhases([...phases, { phase_code: phaseCode.trim() }]);
      }
      setPhaseCode("");
    };

    const handleEditPhase = (idx) => {
      setPhaseCode(phases[idx].phase_code);
      setEditIdx(idx);
    };

    const handleDeletePhase = (idx) => {
      setPhases(phases.filter((_, i) => i !== idx));
    };


    const handleSubmit = () => {
        if (!jobCode.trim()) return showNotification("Job code is a required field.");

        // 1. Get a clean list of all phase code strings
        const finalPhaseStrings = [...new Set([...phases.map(p => p.phase_code), ...fixedPhases])];

        // ✅ FIX: Construct the payload with the EXACT field names the backend expects
        const payload = {
            job_code: jobCode.trim(),
            contract_no: contractNo.trim(),
            job_description: jobDescription.trim(),
            project_engineer: projectEngineer.trim(),
            project_engineer_id: projectEngineerId,  // id

            jurisdiction: jurisdiction.trim(),
            status: status, // This is now guaranteed to be lowercase
            phase_codes: finalPhaseStrings // The key is now 'phase_codes'
        };
        
        onSave(payload);
    };

    return (
        <Modal title={mode === "edit" ? "Edit Job & Phases" : "Create Job & Phases"} onClose={onClose} size="large">
            <div className="form-grid">
                <div className="form-group"><label>Job Code</label><input type="text" value={jobCode} onChange={(e) => setJobCode(e.target.value)} disabled={mode === "edit"} className="form-control" required /></div>
                <div className="form-group"><label>Contract No.</label><input type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="form-control" /></div>
<div className="form-group">
  <label>Project Engineer</label>
  <select
    value={projectEngineerId || ''}   // use the engineer ID for selection
    onChange={(e) => {
      const selectedId = e.target.value;
      const selectedEngineer = engineers.find(
        (eng) => eng.id === parseInt(selectedId)
      );

      // store both ID and name in state
      setProjectEngineerId(selectedId);
      setProjectEngineer(
        selectedEngineer
          ? `${selectedEngineer.first_name} ${selectedEngineer.last_name}`
          : ''
      );
    }}
    className="form-control"
  >
    <option value="">Select Project Engineer</option>
    {engineers.map((eng) => (
      <option key={eng.id} value={eng.id}>
        {eng.first_name} {eng.last_name}
      </option>
    ))}
  </select>
</div>

                <div className="form-group"><label>Jurisdiction</label><input type="text" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="form-control" /></div>
                <div className="form-group full-width"><label>Job Description</label><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-control" rows="3"></textarea></div>
                
                {/* ✅ FIX: The select now correctly uses lowercase values */}
                <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <hr style={{ margin: "16px 0" }} />
            <h4>Editable Phases</h4>
            <div className="phases-table-wrapper"><JobPhasesTable phases={phases} onEdit={handleEditPhase} onDelete={handleDeletePhase} /></div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input type="text" value={phaseCode} onChange={(e) => setPhaseCode(e.target.value)} placeholder="New Phase Code" className="form-control" />
                <button type="button" onClick={handleAddPhase} className="btn">{editIdx !== null ? "Update" : "Add"}</button>
                {editIdx !== null && (<button type="button" onClick={() => { setEditIdx(null); setPhaseCode(""); }} className="btn btn-outline">Cancel</button>)}
            </div>
            <div style={{ marginTop: "16px" }}><h4>Fixed Phases</h4><ul className="fixed-phases-list">{fixedPhases.map(p => <li key={p}>{p}</li>)}</ul></div>
            <div className="modal-actions"><button onClick={handleSubmit} className="btn btn-primary">Save Job</button></div>
        </Modal>
    );
};


// In AdminDashboard.js
// In AdminDashboard.js

const JobPhasesViewModal = ({ job, onClose }) => (
    <Modal title={`Phases for ${job.job_code}`} onClose={onClose}>
        <table className="data-table">
            <thead>
                <tr>
                    <th>Phase Code</th>
                    {/* It's helpful to also show the description */}
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {(job.phase_codes || []).map((phaseObject) => (
                    // ✅ FIX: Use the unique 'id' for the key for better performance
                    <tr key={phaseObject.id}>
                        {/* ✅ FIX: Access the 'code' property of the phase object */}
                        <td>{phaseObject.code}</td>
                        <td>{phaseObject.description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Modal>
);



// --- Main Admin Dashboard Component ---
const AdminDashboard = ({ data: initialData, onLogout }) => {
    // MODIFIED: Robust state initialization to guarantee all keys exist.
    const [data, setData] = useState(() => {
        const defaults = {
            users: [], employees: [], equipment: [], job_phases: [], 
            materials: [], vendors: [], dumping_sites: []
        };
        return { ...defaults, ...(initialData || {}) };
    });

    const [activeSection, setActiveSection] = useState("users");
    const [modal, setModal] = useState({ shown: false, type: "", title: "", mode: "add", item: null });
    const [jobModal, setJobModal] = useState({ shown: false, mode: "", job: null });
    const [viewPhasesJob, setViewPhasesJob] = useState(null);
    const [notification, setNotification] = useState({ shown: false, message: "" });
    const [confirmation, setConfirmation] = useState({ shown: false, message: "", onConfirm: () => {} });
    const [formError, setFormError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const showNotification = (message) => setNotification({ shown: true, message });
    const showConfirmation = (message, onConfirmAction) => setConfirmation({ shown: true, message, onConfirm: () => {
        onConfirmAction();
        setConfirmation({ shown: false, message: "", onConfirm: () => {} });
    }});

    const closeMainModal = () => {
        setModal({ shown: false, type: "", title: "", mode: "add", item: null });
        setFormError("");
    };
    
    const API_ENDPOINTS = [
        "users", "employees", "equipment", "materials", 
        "vendors", "dumping_sites", "job-phases"
    ];
    
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentDate, setCurrentDate] = useState("");


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setFetchError(null);
            const newData = {};
            let hasError = false;

            for (const endpoint of API_ENDPOINTS) {
                try {
                    const response = await axios.get(`${API_URL}/${endpoint}`);
                    // Map job-phases back to job_phases key for state consistency
                    const key = endpoint === 'job-phases' ? 'job_phases' : endpoint;
                    newData[key] = response.data;
                } catch (error) {
                    // Log the error but continue trying to fetch other data
                    console.error(`Error fetching ${endpoint}:`, error);
                    setFetchError(`Failed to load data for ${endpoint}.`);
                    hasError = true;
                }
            }

            if (!hasError) {
                setData(newData); // Replace initial state with fetched data
            }
            setIsLoading(false);
        };
        
        fetchData();
    }, []);

    useEffect(() => {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        setCurrentDate(now.toLocaleDateString(undefined, options));
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                const newWidth = Math.max(60, Math.min(e.clientX, 400));
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => { if (isResizing) setIsResizing(false); };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    const typeToStateKey = { user: "users", employee: "employees", equipment: "equipment", job_phase: "job_phases", material: "materials", vendor: "vendors", dumping_site: "dumping_sites" };

    const onUpdate = (key, newList) => setData(prev => ({ ...prev, [key]: newList }));

// In AdminDashboard.js

const handleSaveJob = async (jobData) => {
    // `jobData` is the payload coming directly from the modal. It's already correct.
    const isEditMode = jobModal.mode === 'edit';
    const url = isEditMode 
        ? `${API_URL}/job-phases/${encodeURIComponent(jobData.job_code)}` 
        : `${API_URL}/job-phases/`;
    const apiCall = isEditMode ? axios.put : axios.post;

    try {
        // ✅ FIX: Send the `jobData` object directly. No need to modify it.
        const response = await apiCall(url, jobData);
        
        setData(prev => {
            const updatedJobs = [...(prev.job_phases || [])];
            const existingIndex = updatedJobs.findIndex(j => j.job_code === jobData.job_code);
            
            if (existingIndex !== -1) {
                updatedJobs[existingIndex] = response.data;
            } else {
                updatedJobs.push(response.data);
            }
            return { ...prev, job_phases: updatedJobs };
        });
        
        setJobModal({ shown: false, mode: "", job: null });
        showNotification(`Job '${jobData.job_code}' was saved successfully!`);

    } catch (err) {
        const errorMessage = err.response?.data?.detail 
            ? JSON.stringify(err.response.data.detail) 
            : err.message;
        showNotification(`Error saving job: ${errorMessage}`);
    }
};


const handleAddOrUpdateItem = async (type, itemData, mode, existingItem = null) => {
  const stateKey = typeToStateKey[type];
  setFormError("");

  // ✅ Normalize status to lowercase before sending to backend
  if (itemData.status) {
    itemData.status = itemData.status.toLowerCase();
  }

  if (mode === "add") {
    const idKey = type === "user" ? "username" : "id";
    const newItemId = itemData[idKey];
    if ((data[stateKey] || []).some(item => item[idKey] === newItemId)) {
      const itemType = type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      setFormError(`${itemType} with ID '${newItemId}' already exists.`);
      return;
    }
  }

try {
    let response;
    const cleanData = { ...itemData };

    // Remove type for equipment
    if (type === "equipment") {
        delete cleanData.type;
    }

    if (mode === "edit" && existingItem) {
        const itemId = existingItem.id;
        response = await axios.put(`${API_URL}/${stateKey}/${encodeURIComponent(itemId)}`, cleanData);
        onUpdate(stateKey, (data[stateKey] || []).map(it => it.id === itemId ? response.data : it));
    } else {
        response = await axios.post(`${API_URL}/${stateKey}/`, cleanData);
        onUpdate(stateKey, [response.data, ...(data[stateKey] || [])]);
    }
    closeMainModal();
} 
catch (error) {
    const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : "An unexpected error occurred.";
    setFormError(`Error: ${errorMessage}`);
  }
};

// ✅ Toggle handler that uses lowercase values for backend
const handleToggleStatus = async (type, item) => {
  const stateKey = typeToStateKey[type];

  // Convert to lowercase for backend
  const currentStatus = item.status?.toLowerCase();
  const newStatus = currentStatus === "active" ? "inactive" : "active";

  const updatedItem = { ...item, status: newStatus };

  try {
    const response = await axios.put(
      `${API_URL}/${stateKey}/${encodeURIComponent(item.id)}`,
      updatedItem
    );

    onUpdate(
      stateKey,
      (data[stateKey] || []).map(it =>
        it.id === item.id ? response.data : it
      )
    );
  } catch (error) {
    console.error("Error toggling status:", error);
    const errorMessage = error.response?.data
      ? JSON.stringify(error.response.data)
      : "An unexpected error occurred.";
    alert(`Error updating status: ${errorMessage}`);
  }
};


    const handleDeleteItem = async (type, itemId) => {
        const deleteAction = async () => {
            const urlKey = type === 'job_phase' ? 'job-phases' : typeToStateKey[type];
            const dataKey = type === 'job_phase' ? 'job_phases' : typeToStateKey[type];
            try {
                const url = `${API_URL}/${urlKey}/${encodeURIComponent(itemId)}`;
                await axios.delete(url);
                const idKey = type === 'job_phase' ? 'job_code' : 'id';
                onUpdate(dataKey, (data[dataKey] || []).filter(item => item[idKey] !== itemId));
            } catch (error) {
                const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                showNotification(`Error deleting ${type}: ${errorMessage}`);
            }
        };
        const itemLabel = type.replace('_', ' ');
        showConfirmation(`Are you sure you want to delete this ${itemLabel}?`, deleteAction);
    };

    const getFormFields = (type) => {
        switch (type) {
            case "user": return [ { name: "username", label: "Username", required: true }, { name: "first_name", label: "First Name", required: true }, { name: "middle_name", label: "Middle Name" }, { name: "last_name", label: "Last Name", required: true }, { name: "email", label: "Email", required: true, type: "email" }, { name: "password", label: "Password", type: "password", required: true }, { name: "role", label: "Role", type: "select", options: [ { value: "foreman", label: "Foreman" }, { value: "supervisor", label: "Supervisor" }, { value: "project_engineer", label: "Project Engineer" }, { value: "admin", label: "Accountant" } ], required: true, defaultValue: "admin" } ];
            case "employee": return [ { name: "id", label: "Employee ID", required: true }, { name: "first_name", label: "First Name", required: true }, { name: "middle_name", label: "Middle Name" }, { name: "last_name", label: "Last Name", required: true }, { name: "class_1", label: "Class Code 1" }, { name: "class_2", label: "Class Code 2" }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
 case "equipment":
            return [
                { name: "id", label: "Equipment ID", required: true },
                { name: "name", label: "Equipment Name", required: true },
                { name: "category", label: "Category Name" }, // Changed from "type" to "category"
                { name: "department", label: "Department", required: true },
                { name: "category_number", label: "Category Number", required: true },
                { name: "vin_number", label: "VIN Number" },
                { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" }
            ];            case "vendor": return [ { name: "name", label: "Work Performed Name", required: true }, { name: "unit", label: "Unit", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
            case "material": return [ { name: "name", label: "Material/Trucking Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
            case "dumping_site": return [ { name: "id", label: "Site ID", required: true }, { name: "name", label: "Site Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
            default: return [];
        }
    };

// In AdminDashboard.js

const prepareJobForEditModal = (job) => {
    const fixedPhases = ["Admin", "S&SL", "Vacation"];
    // 'job.phase_codes' is now an array of objects: [{ id: 1, code: 'PC-01', ... }]
    const phaseCodeObjects = job.phase_codes || [];

    // ✅ FIX: Filter the objects by accessing their 'code' property
    const editablePhaseObjects = phaseCodeObjects.filter(
        p_obj => !fixedPhases.includes(p_obj.code)
    );
    
    // ✅ FIX: Map the objects to the structure the modal's state expects: { phase_code: 'string' }
    const phasesForModal = editablePhaseObjects.map(p_obj => ({ phase_code: p_obj.code }));

    // Return the job data, overwriting 'phases' with the correctly prepared array
    return { ...job, phases: phasesForModal };
};


    const formatRole = (role) => {
        if (!role) return "";
        return role
            .split('_') 
            .map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    };

    const renderSection = () => {
        const makeTable = (type, title, headers, rowRender, itemLabel) => {
            const label = itemLabel || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const key = typeToStateKey[type];
            return (<DataTableSection 
                        title={title} 
                        headers={headers} 
                        data={data[key] || []} 
                        renderRow={(item) => <>{rowRender(item)}</>} 
                        onAdd={() => setModal({ shown: true, type, title: `Add ${label}`, mode: "add", item: null })} 
                        onEdit={item => setModal({ shown: true, type, title: `Edit ${label}`, mode: "edit", item })} 
                        onDelete={id => handleDeleteItem(type, id)}
                        // ✅ FIX: Pass props to DataTableSection
                        handleToggleStatus={handleToggleStatus}
                        activeSection={type}
                    />);
        };
        switch (activeSection) {
            case "users": 
                return makeTable(
                    "user", 
                    "User Management", 
                    ["Username", "First Name", "Last Name", "Role"], 
                    u => (
                        <>
                            <td key={u.username}>{u.username}</td>
                            <td key={u.first_name}>{u.first_name}</td>
                            <td key={u.last_name}>{u.last_name}</td>
                            <td key={u.role}>{formatRole(u.role)}</td>
                        </>
                    )
                );
            case "employees": 
                return makeTable("employee", "Employee Management", ["ID", "Name", "Class", "Status"], e => {
                    const fullName = `${e.first_name} ${e.middle_name ? e.middle_name + ' ' : ''}${e.last_name}`;
                    return (<> 
                        <td key={e.id}>{e.id}</td> 
                        <td key={fullName}>{fullName}</td> 
                        <td key={e.class_1}>{`${e.class_1 || ""}${e.class_2 ? " / " + e.class_2 : ""}`}</td> 
                        <td key={e.status}>{e.status}</td> 
                    </>);
                });
// Inside the renderSection function...
// In AdminDashboard.js, inside renderSection...
case "equipment": 
    return makeTable(
        "equipment", 
        "Equipment Management", 
        ["ID", "Name", "Category Name", "Department", "Category No.", "VIN No.", "Status"], 
        e => (<> 
            <td key={e.id}>{e.id}</td> 
            <td key={e.name}>{e.name}</td> 
            <td key={e.category}>{e.category}</td> {/* <--- CORRECTED */}
            <td key={e.department}>{e.department}</td> 
            <td key={e.category_number}>{e.category_number}</td> 
            <td key={e.vin_number}>{e.vin_number}</td> 
            <td key={e.status}>{e.status}</td> 
        </>)
    );



            case "vendors": 
                return makeTable("vendor", "Work Performed", ["Name", "Unit", "Status"], v => <><td key={v.name}>{v.name}</td><td key={v.unit}>{v.unit}</td><td key={v.status}>{v.status}</td></>, "Work Performed");
            case "materials": 
                return makeTable("material", "Materials and Trucking", ["Name", "Status"], m => <><td key={m.name}>{m.name}</td><td key={m.status}>{m.status}</td></>, "Material and Trucking");
            case "job_phases": 
                return (<DataTableSection 
                            title="Jobs & Phases Management" 
                            headers={["Job Code", "Description", "Project Engineer", "Status"]} 
                            data={data.job_phases || []} 
                            renderRow={job => (<> <td>{job.job_code}</td> <td>{job.job_description}</td> <td>{job.project_engineer}</td> <td>{job.status}</td> </>)} 
                            onAdd={() => setJobModal({ shown: true, mode: "add", job: null })} 
                            onEdit={(job) => setJobModal({ shown: true, mode: "edit", job: prepareJobForEditModal(job) })} 
                            onDelete={(job_code) => handleDeleteItem("job_phase", job_code)} 
                            extraActions={(job) => (<button className="btn btn-view btn-sm" onClick={() => setViewPhasesJob(job)}> View Phases </button>)} 
                            // ✅ FIX: Pass props here as well
                            handleToggleStatus={handleToggleStatus}
                            activeSection="job_phase"
                        />);
            case "dumping_sites": 
                return makeTable("dumping_site", "Dumping Site Management", ["Site ID", "Site Name", "Status"], ds => (<><td key={ds.id}>{ds.id}</td><td key={ds.name}>{ds.name}</td><td key={ds.status}>{ds.status}</td></>), "Dumping Site");
            case "crewMapping": 
                const allResources = { 
                    users: data.users || [], employees: data.employees || [], equipment: data.equipment || [], 
                    materials: data.materials || [], vendors: data.vendors || [], dumping_sites: data.dumping_sites || []
                }; 
                return <CrewMappingManager allResources={allResources} />;
            default: return <div>Section not implemented.</div>;
        }
    };

    return (
        <div className="admin-layout">
            {notification.shown && <NotificationModal message={notification.message} onClose={() => setNotification({ shown: false, message: "" })} />}
            {confirmation.shown && <ConfirmationModal message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation({ shown: false, message: "", onConfirm: () => {} })} />}

            {modal.shown && (
                <Modal title={modal.title} onClose={closeMainModal}>
                    <GenericForm
                        fields={getFormFields(modal.type)}
                        defaultValues={modal.item || {}}
                        onSubmit={(formData) => handleAddOrUpdateItem(modal.type, formData, modal.mode, modal.item)}
                        errorMessage={formError}
                    />
                </Modal>
            )}

            {viewPhasesJob && <JobPhasesViewModal job={viewPhasesJob} onClose={() => setViewPhasesJob(null)} />}
            {jobModal.shown && <JobWithPhasesModal mode={jobModal.mode} job={jobModal.job} onSave={handleSaveJob} onClose={() => setJobModal({ shown: false, mode: "", job: null })} showNotification={showNotification} />}
            
            <nav
                className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
                style={{ width: sidebarCollapsed ? 60 : sidebarWidth }}
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
                    {!sidebarCollapsed && <h3 className="sidebar-title">ADMIN PORTAL</h3>}
                    {!sidebarCollapsed && (
                        <>
                            <div className="current-date">{currentDate}</div>
                            <button
                                onClick={onLogout}
                                className="btn btn-outline btn-sm logout-btn"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>

                <ul className="sidebar-nav">
                    {[
                        "users",
                        "employees",
                        "equipment",
                        "job_phases",
                        "materials",
                        "vendors",
                        "dumping_sites",
                        "crewMapping",
                    ].map((sec) => (
                        <li key={sec}>
                            <button
                                onClick={() => setActiveSection(sec)}
                                className={activeSection === sec ? "active" : ""}
                            >
                                <span className="icon">{getIconForSection(sec)}</span>
                                {!sidebarCollapsed && (
                                    <span className="label">
                                        {sec === "job_phases"
                                            ? "Jobs & Phases"
                                            : sec === "crewMapping"
                                            ? "Crew Mapping"
                                            : sec === "vendors"
                                            ? "Work Performed"
                                            : sec === "materials"
                                            ? "Materials & Trucking"
                                            : sec === "dumping_sites"
                                            ? "Dumping Sites"
                                            : sec.charAt(0).toUpperCase() + sec.slice(1)}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>

                {!sidebarCollapsed && (<div className="sidebar-resizer" onMouseDown={() => setIsResizing(true)}/>)}
            </nav>
            
            <main
                className="admin-content"
                style={{ marginLeft: sidebarCollapsed ? 60 : sidebarWidth -220 }}
            >
                {renderSection()}
            </main>
        </div>
    );
};


// ✅ FIX: Added handleToggleStatus and activeSection to props
const DataTableSection = ({ title, headers, data = [], renderRow, onDelete, onAdd, onEdit, extraActions, handleToggleStatus, activeSection }) => (
    <div className="data-table-container">
        <div className="section-header"><h2>{title}</h2>{onAdd && <button onClick={onAdd} className="btn btn-primary">Add New</button>}</div>
        <table className="data-table">
            <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th>Actions</th></tr></thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id || item.job_code || item.username}>
                        {renderRow(item)}
                        <td>
                            {onEdit && <button onClick={() => onEdit(item)} className="btn-edit btn-sm">Edit</button>}
                            {item.status && handleToggleStatus && ( // Check if handleToggleStatus is passed
                                <button
                                    onClick={() => handleToggleStatus(activeSection, item)}
                                    className={`btn-sm ${
                                        item.status === "Active" ? "btn-outline-danger" : "btn-outline-success"
                                    }`}
                                >
                                    {item.status === "Active" ? "Deactivate" : "Activate"}
                                </button>
                            )}
                            {extraActions && extraActions(item)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AdminDashboard;
