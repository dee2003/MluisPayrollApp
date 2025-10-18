


// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import CrewMappingManager from './CrewMappingManager'; // Assuming this is in the same directory
// import "./CrewMapping.css"; // The new CSS file
// const API_URL = "http://127.0.0.1:8000/api";
// // --- Reusable Modal Component ---
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
// // --- Generic Form Component ---
// const GenericForm = ({ fields, onSubmit, defaultValues }) => {
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
// // --- Job & Phases Specific Components ---
// const JobPhasesTable = ({ phases, onEdit, onDelete }) => (
//     <table className="data-table">
//         <thead>
//             <tr><th>Phase Code</th><th>Actions</th></tr>
//         </thead>
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
// const JobWithPhasesModal = ({ mode, job, onSave, onClose }) => {
//     // State for existing and new fields
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
//         if (!phaseCode.trim()) return alert("Enter phase code");
//         if (phases.some((p, idx) => p.phase_code === phaseCode.trim() && idx !== editIdx))
//             return alert("Phase code already exists");
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
//         if (!jobCode.trim()) return alert("Job code is required");
//         const finalPhaseCodes = [...new Set([...phases.map(p => p.phase_code), ...fixedPhases])];
//         // Bundle all data for saving
//         const jobData = {
//             job_code: jobCode.trim(),
//             contract_no: contractNo.trim(),
//             job_description: jobDescription.trim(),
//             project_engineer: projectEngineer.trim(),
//             jurisdiction: jurisdiction.trim(),
//             status,
//             phases: finalPhaseCodes,
//         };
//         onSave(jobData);
//     };
//     return (
//         <Modal
//             title={mode === "edit" ? "Edit Job & Phases" : "Create Job & Phases"}
//             onClose={onClose}
//             size="large"
//         >
//             <div className="form-grid">
//                  <div className="form-group">
//                     <label>Job Code</label>
//                     <input type="text" value={jobCode} onChange={(e) => setJobCode(e.target.value)} disabled={mode === "edit"} className="form-control" required />
//                 </div>
//                 <div className="form-group">
//                     <label>Contract No.</label>
//                     <input type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="form-control" />
//                 </div>
//                 <div className="form-group">
//                     <label>Project Engineer</label>
//                     <input type="text" value={projectEngineer} onChange={(e) => setProjectEngineer(e.target.value)} className="form-control" />
//                 </div>
//                  <div className="form-group">
//                     <label>Jurisdiction</label>
//                     <input type="text" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="form-control" />
//                 </div>
//                  <div className="form-group full-width">
//                     <label>Job Description</label>
//                     <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-control" rows="3"></textarea>
//                 </div>
//                 <div className="form-group">
//                     <label>Status</label>
//                     <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control">
//                         <option value="Active">Active</option>
//                         <option value="Inactive">Inactive</option>
//                     </select>
//                 </div>
//             </div>
//             <hr style={{ margin: "16px 0" }} />
//             <h4>Editable Phases</h4>
//             <div className="phases-table-wrapper">
//                 <JobPhasesTable phases={phases} onEdit={handleEditPhase} onDelete={handleDeletePhase} />
//             </div>
//             <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
//                 <input type="text" value={phaseCode} onChange={(e) => setPhaseCode(e.target.value)} placeholder="New Phase Code" className="form-control" />
//                 <button type="button" onClick={handleAddPhase} className="btn">
//                     {editIdx !== null ? "Update" : "Add"}
//                 </button>
//                 {editIdx !== null && (
//                     <button type="button" onClick={() => { setEditIdx(null); setPhaseCode(""); }} className="btn btn-outline">Cancel</button>
//                 )}
//             </div>
//             <div style={{ marginTop: "16px" }}>
//                 <h4>Fixed Phases</h4>
//                 <ul className="fixed-phases-list">{fixedPhases.map(p => <li key={p}>{p}</li>)}</ul>
//             </div>
//             <div className="modal-actions">
//                 <button onClick={handleSubmit} className="btn btn-primary">Save Job</button>
//             </div>
//         </Modal>
//     );
// };
// const JobPhasesViewModal = ({ job, onClose }) => (
//     <Modal title={`Phases for ${job.job_code}`} onClose={onClose}>
//         <table className="data-table">
//             <thead>
//                 <tr><th>Phase Code</th></tr>
//             </thead>
//             <tbody>
//                 {(job.phase_codes || []).map((phase, idx) => (
//                     <tr key={idx}>
//                         <td>{phase}</td>
//                     </tr>
//                 ))}
//             </tbody>
//         </table>
//     </Modal>
// );
// // --- Main Admin Dashboard Component ---
// const AdminDashboard = ({ data: initialData, onLogout }) => {
//     const [data, setData] = useState(initialData || { users: [], employees: [], equipment: [], job_phases: [], materials: [], vendors: [] });
//     const [activeSection, setActiveSection] = useState("users"); // no dashboard section
//     const [modal, setModal] = useState({ shown: false, type: "", title: "", mode: "add", item: null });
//     const [jobModal, setJobModal] = useState({ shown: false, mode: "", job: null });
//     const [viewPhasesJob, setViewPhasesJob] = useState(null);
//     // New state for showing date
//     const [currentDate, setCurrentDate] = useState("");
//     useEffect(() => {
//         const now = new Date();
//         const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
//         setCurrentDate(now.toLocaleDateString(undefined, options));
//     }, []);
//     const typeToStateKey = {
//         user: "users",
//         employee: "employees",
//         equipment: "equipment",
//         job_phase: "job_phases",
//         material: "materials",
//         vendor: "vendors",
//     };
//     const onUpdate = (key, newList) => setData(prev => ({ ...prev, [key]: newList }));
//     const handleSaveJob = async (jobData) => {
//         const { job_code, phases, ...otherJobData } = jobData;
//         const payload = {
//             ...otherJobData,
//             job_code: job_code,
//             phase_codes: phases,
//         };
//         const isEditMode = jobModal.mode === 'edit';
//         const url = isEditMode
//             ? `${API_URL}/job-phases/${encodeURIComponent(job_code)}`
//             : `${API_URL}/job-phases/`;
//         const apiCall = isEditMode ? axios.put : axios.post;
//         try {
//             const response = await apiCall(url, payload);
//             const savedJob = response.data;

// setData(prev => {
//                 const updatedJobs = [...(prev.job_phases || [])];
//                 const existingIndex = updatedJobs.findIndex(j => j.job_code === job_code);
//                 if (existingIndex !== -1) {
//                     updatedJobs[existingIndex] = savedJob;
//                 } else {
//                     updatedJobs.push(savedJob);
//                 }
//                 return { ...prev, job_phases: updatedJobs };
//             });
//             setJobModal({ shown: false, mode: "", job: null });
//         } catch (err) {
//             alert(`Error saving job: ${JSON.stringify(err.response?.data?.detail) || err.message}`);
//         }
//     };
//     const handleAddOrUpdateItem = async (type, itemData, mode, existingItem = null) => {
//         const stateKey = typeToStateKey[type];
//         try {
//             let response;
//             if (mode === "edit" && existingItem) {
//                 const itemId = existingItem.id;
//                 response = await axios.put(`${API_URL}/${stateKey}/${encodeURIComponent(itemId)}`, itemData);
//                 onUpdate(stateKey, data[stateKey].map(it => it.id === itemId ? response.data : it));
//             } else {
//                 response = await axios.post(`${API_URL}/${stateKey}/`, itemData);
//                 onUpdate(stateKey, [...data[stateKey], response.data]);
//             }
//             setModal({ shown: false });
//         } catch (error) {
//             alert(`Error ${mode === 'edit' ? 'updating' : 'adding'} ${type}: ${JSON.stringify(error.response?.data)}`);
//         }
//     };
//     const handleDeleteItem = async (type, itemId) => {
//         const urlKey = type === 'job_phase' ? 'job-phases' : typeToStateKey[type];
//         const dataKey = type === 'job_phase' ? 'job_phases' : typeToStateKey[type];
//         if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
//         try {
//             const url = `${API_URL}/${urlKey}/${encodeURIComponent(itemId)}`;
//             await axios.delete(url);
//             const idKey = type === 'job_phase' ? 'job_code' : 'id';
//             onUpdate(dataKey, data[dataKey].filter(item => item[idKey] !== itemId));
//         } catch (error) {
//             alert(`Error deleting ${type}: ${JSON.stringify(error.response?.data)}`);
//         }
//     };
//     const getFormFields = (type) => {
//         switch (type) {
//            case "user":
//              return [
//                 { name: "username", label: "Username", required: true },
//                 { name: "first_name", label: "First Name", required: true },
//                 { name: "middle_name", label: "Middle Name" },
//                 { name: "last_name", label: "Last Name", required: true },
//                 { name: "email", label: "Email", required: true, type: "email" },
//                 { name: "password", label: "Password", type: "password", required: true },
//                 {
//                     name: "role", label: "Role", type: "select",
//                     options: [
//                         { value: "admin", label: "Admin" },
//                         { value: "foreman", label: "Foreman" },
//                         { value: "project_engineer", label: "Project Engineer" },
//                         { value: "supervisor", label: "Supervisor" }
//                     ],
//                     required: true,
//                     defaultValue: "admin"
//                 }
//              ];
//             case "employee":
//              return [
//                { name: "id", label: "Employee ID", required: true },
//                { name: "first_name", label: "First Name", required: true },
//                { name: "middle_name", label: "Middle Name" },
//                { name: "last_name", label: "Last Name", required: true },
//                { name: "class_1", label: "Class Code 1" },
//                { name: "class_2", label: "Class Code 2" },
//                {
//                  name: "status",
//                  label: "Status",
//                  type: "select",
//                  options: [
//                    { value: "Active", label: "Active" },
//                    { value: "Inactive", label: "Inactive" }
//                  ],
//                  required: true,
//                  defaultValue: "Active"
//                }
//              ];
//             case "equipment":
//                 return [
//                     { name: "id", label: "Equipment ID", required: true },
//                     { name: "name", label: "Equipment Name", required: true },
//                     { name: "type", label: "Category Name" },
//                     { name: "department", label: "Department", required: true },
//                     { name: "category_number", label: "Category Number", required: true },
//                     { name: "vin_number", label: "VIN Number" },
//                     {
//                         name: "status",
//                         label: "Status",
//                         type: "select",
//                         options: [
//                             { value: "Active", label: "Active" },
//                             { value: "Inactive", label: "Inactive" }
//                         ],
//                         required: true,
//                         defaultValue: "Active"
//                     }
//                 ];
//                 case "vendor": return [ { name: "name", label: "Work Performed Name", required: true }, { name: "unit", label: "Unit", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//                 case "material": return [ { name: "name", label: "Material/Trucking Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
//                 default: return [];
//         }
//     };
//     const prepareJobForEditModal = (job) => {
//         const fixedPhases = ["Admin", "S&SL", "Vacation"];
//         const phaseCodes = job.phase_codes || [];
//         return {
//             ...job,
//             phases: phaseCodes
//                 .filter(p => !fixedPhases.includes(p))
//                 .map(p => ({ phase_code: p }))
//         };
//     };
// const renderSection = () => {
//         const makeTable = (type, title, headers, rowRender, itemLabel) => {
//             const label = itemLabel || (type.charAt(0).toUpperCase() + type.slice(1));
//             return (
//                 <DataTableSection
//                     title={title}
//                     headers={headers}
//                     data={data[typeToStateKey[type]] || []}
//                     renderRow={(item) => <>{rowRender(item)}</>}
//                     onAdd={() => setModal({ shown: true, type, title: `Add ${label}`, mode: "add", item: null })}
//                     onEdit={item => setModal({ shown: true, type, title: `Edit ${label}`, mode: "edit", item })}
//                     onDelete={id => handleDeleteItem(type, id)}
//                 />
//             );
//         };
//         switch (activeSection) {
//             case "users": return makeTable("user", "User Management", ["Username", "First Name", "Last Name", "Role"], u => <><td key={u.username}>{u.username}</td><td key={u.first_name}>{u.first_name}</td><td key={u.last_name}>{u.last_name}</td><td key={u.role}>{u.role}</td></>);
//             case "employees":
//               return makeTable(
//                 "employee",
//                 "Employee Management",
//                 ["ID", "Name", "Class", "Status"],
//                 e => (
//                   <>
//                     <td key={e.id}>{e.id}</td>
//                     <td key={`${e.first_name}-${e.last_name}`}>{`${e.first_name} ${e.last_name}`}</td>
//                     <td key={e.status}>{`${e.class_1 || ""}${e.class_2 ? " / " + e.class_2 : ""}`}</td>
//                     <td key={e.status}>{e.status}</td>
//                   </>
//                 )
//               );
//             case "equipment":
//                 return makeTable(
//                     "equipment",
//                     "Equipment Management",
//                     ["ID", "Name", "Category Name", "Department", "Category No.", "VIN No.", "Status"],
//                     e => (
//                         <>
//                             <td key={e.id}>{e.id}</td>
//                             <td key={e.name}>{e.name}</td>
//                             <td key={e.type}>{e.type}</td>
//                             <td key={e.department}>{e.department}</td>
//                             <td key={e.category_number}>{e.category_number}</td>
//                             <td key={e.vin_number}>{e.vin_number}</td>
//                             <td key={e.status}>{e.status}</td>
//                         </>
//                     )
//                 );
//             case "vendors": return makeTable("vendor", "Work Performed", ["Name", "Unit", "Status"], v => <><td key={v.name}>{v.name}</td><td key={v.unit}>{v.unit}</td><td key={v.status}>{v.status}</td></>, "Work Performed");
//             case "materials": return makeTable("material", "Materials and Trucking", ["Name", "Status"], m => <><td key={m.name}>{m.name}</td><td key={m.status}>{m.status}</td></>, "Material and Trucking");
//             case "job_phases":
//                 return (
//                     <DataTableSection
//                         title="Jobs & Phases Management"
//                         headers={["Job Code", "Description", "Project Engineer", "Status"]}
//                         data={data.job_phases || []}
//                         renderRow={job => (
//                             <>
//                                 <td>{job.job_code}</td>
//                                 <td>{job.job_description}</td>
//                                 <td>{job.project_engineer}</td>
//                                 <td>{job.status}</td>
//                             </>
//                         )}
//                         onAdd={() => setJobModal({ shown: true, mode: "add", job: null })}
//                         onEdit={(job) => setJobModal({ shown: true, mode: "edit", job: prepareJobForEditModal(job) })}
//                         onDelete={(job_code) => handleDeleteItem("job_phase", job_code)}
//                         extraActions={(job) => (
//                             <button className="btn btn-sm" onClick={() => setViewPhasesJob(job)}>View Phases</button>
//                         )}
//                     />
//                 );
//             case "crewMapping":
//                 const allResources = {
//                     users: data.users || [],
//                     employees: data.employees || [],
//                     equipment: data.equipment || [],
//                     materials: data.materials || [],
//                     vendors: data.vendors || [],
//                 };
//                 return <CrewMappingManager allResources={allResources} />;
//             default: return <div>Section not implemented.</div>;
//         }
//     };
//     return (
//         <div className="admin-layout">
//             {modal.shown && ( <Modal title={modal.title} onClose={() => setModal({ shown: false })}> <GenericForm fields={getFormFields(modal.type)} defaultValues={modal.item || {}} onSubmit={(formData) => handleAddOrUpdateItem(modal.type, formData, modal.mode, modal.item)} /> </Modal> )}
//             {viewPhasesJob && <JobPhasesViewModal job={viewPhasesJob} onClose={() => setViewPhasesJob(null)} />}
//             {jobModal.shown && <JobWithPhasesModal mode={jobModal.mode} job={jobModal.job} onSave={handleSaveJob} onClose={() => setJobModal({ shown: false, mode: "", job: null })} />}
//             <nav className="admin-sidebar">
//                 <div className="sidebar-header">
//         <h3>Admin Portal</h3>
//         <div className="current-date">{currentDate}</div> {/* This is the element in question */}
//         <button onClick={onLogout} className="btn btn-outline btn-sm">Logout</button>
//     </div>
//                 <ul className="sidebar-nav">
//                     {["users", "employees", "equipment", "job_phases", "materials", "vendors", "crewMapping"].map(sec => (
//                         <li key={sec}>
//                             <button onClick={() => setActiveSection(sec)} className={activeSection === sec ? "active" : ""}>
//                                 {sec === "job_phases" ? "Jobs & Phases" :
//                                 sec === "crewMapping" ? "Crew Mapping" :
//                                 sec === "vendors" ? "Work Performed" :
//                                 sec === "materials" ? "Materials and Trucking" :
//                                 sec.charAt(0).toUpperCase() + sec.slice(1)}
//                             </button>
//                         </li>
//                     ))}
//                 </ul>
//             </nav>
//             <main className="admin-content">{renderSection()}</main>
//         </div>
//     );
// };
// // --- Data Table (Modified to support extra actions) ---
// const DataTableSection = ({ title, headers, data = [], renderRow, onDelete, onAdd, onEdit, extraActions }) => (
//     <div className="data-table-container">
//         <div className="section-header">
//             <h2>{title}</h2>
//             {onAdd && <button onClick={onAdd} className="btn btn-primary">Add New</button>}
//         </div>
//         <table className="data-table">
//             <thead>
//                 <tr>
//                     {headers.map(h => <th key={h}>{h}</th>)}
//                     <th>Actions</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 {data.map(item => (
//                     <tr key={item.id || item.job_code}>
//                         {renderRow(item)}
// <td>
//     {onEdit && <button onClick={() => onEdit(item)} className="btn-edit btn-sm">Edit</button>}
//     {onDelete && <button onClick={() => onDelete(item.job_code || item.id)} className="btn-delete btn-sm">Delete</button>}
//     {extraActions && extraActions(item)}
// </td>
//                     </tr>
//                 ))}
//             </tbody>
//         </table>
//     </div>
// );
// export default AdminDashboard;





import React, { useState, useEffect } from "react";
import axios from "axios";
import CrewMappingManager from './CrewMappingManager'; // Assuming this is in the same directory
import "./CrewMapping.css"; // The new CSS file
const API_URL = "http://127.0.0.1:8000/api";
// --- Reusable Modal Component ---
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
// --- Generic Form Component ---
const GenericForm = ({ fields, onSubmit, defaultValues }) => {
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
// --- Job & Phases Specific Components ---
const JobPhasesTable = ({ phases, onEdit, onDelete }) => (
    <table className="data-table">
        <thead>
            <tr><th>Phase Code</th><th>Actions</th></tr>
        </thead>
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
const JobWithPhasesModal = ({ mode, job, onSave, onClose }) => {
    // State for existing and new fields
    const [jobCode, setJobCode] = useState(job?.job_code || "");
    const [contractNo, setContractNo] = useState(job?.contract_no || "");
    const [jobDescription, setJobDescription] = useState(job?.job_description || "");
    const [projectEngineer, setProjectEngineer] = useState(job?.project_engineer || "");
    const [jurisdiction, setJurisdiction] = useState(job?.jurisdiction || "");
    const [status, setStatus] = useState(job?.status || "Active");
    const [phaseCode, setPhaseCode] = useState("");
    const [phases, setPhases] = useState(job?.phases || []);
    const [editIdx, setEditIdx] = useState(null);
    const fixedPhases = ["Admin", "S&SL", "Vacation"];
    const handleAddPhase = () => {
        if (!phaseCode.trim()) return alert("Enter phase code");
        if (phases.some((p, idx) => p.phase_code === phaseCode.trim() && idx !== editIdx))
            return alert("Phase code already exists");
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
        if (!jobCode.trim()) return alert("Job code is required");
        const finalPhaseCodes = [...new Set([...phases.map(p => p.phase_code), ...fixedPhases])];
        // Bundle all data for saving
        const jobData = {
            job_code: jobCode.trim(),
            contract_no: contractNo.trim(),
            job_description: jobDescription.trim(),
            project_engineer: projectEngineer.trim(),
            jurisdiction: jurisdiction.trim(),
            status,
            phases: finalPhaseCodes,
        };
        onSave(jobData);
    };
    return (
        <Modal
            title={mode === "edit" ? "Edit Job & Phases" : "Create Job & Phases"}
            onClose={onClose}
            size="large"
        >
            <div className="form-grid">
                 <div className="form-group">
                    <label>Job Code</label>
                    <input type="text" value={jobCode} onChange={(e) => setJobCode(e.target.value)} disabled={mode === "edit"} className="form-control" required />
                </div>
                <div className="form-group">
                    <label>Contract No.</label>
                    <input type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                    <label>Project Engineer</label>
                    <input type="text" value={projectEngineer} onChange={(e) => setProjectEngineer(e.target.value)} className="form-control" />
                </div>
                 <div className="form-group">
                    <label>Jurisdiction</label>
                    <input type="text" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="form-control" />
                </div>
                 <div className="form-group full-width">
                    <label>Job Description</label>
                    <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-control" rows="3"></textarea>
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <hr style={{ margin: "16px 0" }} />
            <h4>Editable Phases</h4>
            <div className="phases-table-wrapper">
                <JobPhasesTable phases={phases} onEdit={handleEditPhase} onDelete={handleDeletePhase} />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input type="text" value={phaseCode} onChange={(e) => setPhaseCode(e.target.value)} placeholder="New Phase Code" className="form-control" />
                <button type="button" onClick={handleAddPhase} className="btn">
                    {editIdx !== null ? "Update" : "Add"}
                </button>
                {editIdx !== null && (
                    <button type="button" onClick={() => { setEditIdx(null); setPhaseCode(""); }} className="btn btn-outline">Cancel</button>
                )}
            </div>
            <div style={{ marginTop: "16px" }}>
                <h4>Fixed Phases</h4>
                <ul className="fixed-phases-list">{fixedPhases.map(p => <li key={p}>{p}</li>)}</ul>
            </div>
            <div className="modal-actions">
                <button onClick={handleSubmit} className="btn btn-primary">Save Job</button>
            </div>
        </Modal>
    );
};
const JobPhasesViewModal = ({ job, onClose }) => (
    <Modal title={`Phases for ${job.job_code}`} onClose={onClose}>
        <table className="data-table">
            <thead>
                <tr><th>Phase Code</th></tr>
            </thead>
            <tbody>
                {(job.phase_codes || []).map((phase, idx) => (
                    <tr key={idx}>
                        <td>{phase}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Modal>
);
// --- Main Admin Dashboard Component ---
const AdminDashboard = ({ data: initialData, onLogout }) => {
    const [data, setData] = useState(initialData || { users: [], employees: [], equipment: [], job_phases: [], materials: [], vendors: [] });
    const [activeSection, setActiveSection] = useState("users"); // no dashboard section
    const [modal, setModal] = useState({ shown: false, type: "", title: "", mode: "add", item: null });
    const [jobModal, setJobModal] = useState({ shown: false, mode: "", job: null });
    const [viewPhasesJob, setViewPhasesJob] = useState(null);
    // New state for showing date
    const [currentDate, setCurrentDate] = useState("");
    useEffect(() => {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        setCurrentDate(now.toLocaleDateString(undefined, options));
    }, []);
    const typeToStateKey = {
        user: "users",
        employee: "employees",
        equipment: "equipment",
        job_phase: "job_phases",
        material: "materials",
        vendor: "vendors",
    };
    const onUpdate = (key, newList) => setData(prev => ({ ...prev, [key]: newList }));
    const handleSaveJob = async (jobData) => {
        const { job_code, phases, ...otherJobData } = jobData;
        const payload = {
            ...otherJobData,
            job_code: job_code,
            phase_codes: phases,
        };
        const isEditMode = jobModal.mode === 'edit';
        const url = isEditMode
            ? `${API_URL}/job-phases/${encodeURIComponent(job_code)}`
            : `${API_URL}/job-phases/`;

const apiCall = isEditMode ? axios.put : axios.post;
        try {
            const response = await apiCall(url, payload);
            const savedJob = response.data;
            setData(prev => {
                const updatedJobs = [...(prev.job_phases || [])];
                const existingIndex = updatedJobs.findIndex(j => j.job_code === job_code);
                if (existingIndex !== -1) {
                    updatedJobs[existingIndex] = savedJob;
                } else {
                    updatedJobs.push(savedJob);
                }
                return { ...prev, job_phases: updatedJobs };
            });
            setJobModal({ shown: false, mode: "", job: null });
        } catch (err) {
            alert(`Error saving job: ${JSON.stringify(err.response?.data?.detail) || err.message}`);
        }
    };
    const handleAddOrUpdateItem = async (type, itemData, mode, existingItem = null) => {
        const stateKey = typeToStateKey[type];
        try {
            let response;
            if (mode === "edit" && existingItem) {
                const itemId = existingItem.id;
                response = await axios.put(`${API_URL}/${stateKey}/${encodeURIComponent(itemId)}`, itemData);
                onUpdate(stateKey, data[stateKey].map(it => it.id === itemId ? response.data : it));
            } else {
                response = await axios.post(`${API_URL}/${stateKey}/`, itemData);
                onUpdate(stateKey, [...data[stateKey], response.data]);
            }
            setModal({ shown: false });
        } catch (error) {
            alert(`Error ${mode === 'edit' ? 'updating' : 'adding'} ${type}: ${JSON.stringify(error.response?.data)}`);
        }
    };
    const handleDeleteItem = async (type, itemId) => {
        const urlKey = type === 'job_phase' ? 'job-phases' : typeToStateKey[type];
        const dataKey = type === 'job_phase' ? 'job_phases' : typeToStateKey[type];
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const url = `${API_URL}/${urlKey}/${encodeURIComponent(itemId)}`;
            await axios.delete(url);
            const idKey = type === 'job_phase' ? 'job_code' : 'id';
            onUpdate(dataKey, data[dataKey].filter(item => item[idKey] !== itemId));
        } catch (error) {
            alert(`Error deleting ${type}: ${JSON.stringify(error.response?.data)}`);
        }
    };
    const getFormFields = (type) => {
        switch (type) {
           case "user":
             return [
                { name: "username", label: "Username", required: true },
                { name: "first_name", label: "First Name", required: true },
                { name: "middle_name", label: "Middle Name" },
                { name: "last_name", label: "Last Name", required: true },
                { name: "email", label: "Email", required: true, type: "email" },
                { name: "password", label: "Password", type: "password", required: true },
                {
                    name: "role", label: "Role", type: "select",
                    options: [
                        { value: "foreman", label: "Foreman" },
                        { value: "supervisor", label: "Supervisor" },
                        { value: "project_engineer", label: "Project Engineer" },
                        { value: "admin", label: "Accountant" },
                    ],
                    required: true,
                    defaultValue: "admin"
                }
             ];
            case "employee":
             return [
               { name: "id", label: "Employee ID", required: true },
               { name: "first_name", label: "First Name", required: true },
               { name: "middle_name", label: "Middle Name" },
               { name: "last_name", label: "Last Name", required: true },
               { name: "class_1", label: "Class Code 1" },
               { name: "class_2", label: "Class Code 2" },
               {
                 name: "status",
                 label: "Status",
                 type: "select",
                 options: [
                   { value: "Active", label: "Active" },
                   { value: "Inactive", label: "Inactive" }
                 ],
                 required: true,
                 defaultValue: "Active"
               }
             ];
            case "equipment":
                return [
                    { name: "id", label: "Equipment ID", required: true },
                    { name: "name", label: "Equipment Name", required: true },
                    { name: "type", label: "Category Name" },
                    { name: "department", label: "Department", required: true },
                    { name: "category_number", label: "Category Number", required: true },
                    { name: "vin_number", label: "VIN Number" },
                    {
                        name: "status",
                        label: "Status",
                        type: "select",
                        options: [
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" }
                        ],
                        required: true,
                        defaultValue: "Active"
                    }
                ];
                case "vendor": return [ { name: "name", label: "Work Performed Name", required: true }, { name: "unit", label: "Unit", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
                case "material": return [ { name: "name", label: "Material/Trucking Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
                default: return [];
        }
    };
    const prepareJobForEditModal = (job) => {
        const fixedPhases = ["Admin", "S&SL", "Vacation"];
        const phaseCodes = job.phase_codes || [];
        return {
            ...job,
            phases: phaseCodes
                .filter(p => !fixedPhases.includes(p))
                .map(p => ({ phase_code: p }))
        };
    };

const renderSection = () => {
        const makeTable = (type, title, headers, rowRender, itemLabel) => {
            const label = itemLabel || (type.charAt(0).toUpperCase() + type.slice(1));
            return (
                <DataTableSection
                    title={title}
                    headers={headers}
                    data={data[typeToStateKey[type]] || []}
                    renderRow={(item) => <>{rowRender(item)}</>}
                    onAdd={() => setModal({ shown: true, type, title: `Add ${label}`, mode: "add", item: null })}
                    onEdit={item => setModal({ shown: true, type, title: `Edit ${label}`, mode: "edit", item })}
                    onDelete={id => handleDeleteItem(type, id)}
                />
            );
        };
        switch (activeSection) {
            case "users": return makeTable("user", "User Management", ["Username", "First Name", "Last Name", "Role"], u => <><td key={u.username}>{u.username}</td><td key={u.first_name}>{u.first_name}</td><td key={u.last_name}>{u.last_name}</td><td key={u.role}>{u.role}</td></>);
            case "employees":
              return makeTable(
                "employee",
                "Employee Management",
                ["ID", "Name", "Class", "Status"],
                e => (
                  <>
                    <td key={e.id}>{e.id}</td>
                    <td key={`${e.first_name}-${e.last_name}`}>{`${e.first_name} ${e.last_name}`}</td>
                    <td key={e.status}>{`${e.class_1 || ""}${e.class_2 ? " / " + e.class_2 : ""}`}</td>
                    <td key={e.status}>{e.status}</td>
                  </>
                )
              );
            case "equipment":
                return makeTable(
                    "equipment",
                    "Equipment Management",
                    ["ID", "Name", "Category Name", "Department", "Category No.", "VIN No.", "Status"],
                    e => (
                        <>
                            <td key={e.id}>{e.id}</td>
                            <td key={e.name}>{e.name}</td>
                            <td key={e.type}>{e.type}</td>
                            <td key={e.department}>{e.department}</td>
                            <td key={e.category_number}>{e.category_number}</td>
                            <td key={e.vin_number}>{e.vin_number}</td>
                            <td key={e.status}>{e.status}</td>
                        </>
                    )
                );
            case "vendors": return makeTable("vendor", "Work Performed", ["Name", "Unit", "Status"], v => <><td key={v.name}>{v.name}</td><td key={v.unit}>{v.unit}</td><td key={v.status}>{v.status}</td></>, "Work Performed");
            case "materials": return makeTable("material", "Materials and Trucking", ["Name", "Status"], m => <><td key={m.name}>{m.name}</td><td key={m.status}>{m.status}</td></>, "Material and Trucking");
            case "job_phases":
                return (
                    <DataTableSection
                        title="Jobs & Phases Management"
                        headers={["Job Code", "Description", "Project Engineer", "Status"]}
                        data={data.job_phases || []}
                        renderRow={job => (
                            <>
                                <td>{job.job_code}</td>
                                <td>{job.job_description}</td>
                                <td>{job.project_engineer}</td>
                                <td>{job.status}</td>
                            </>
                        )}
                        onAdd={() => setJobModal({ shown: true, mode: "add", job: null })}
                        onEdit={(job) => setJobModal({ shown: true, mode: "edit", job: prepareJobForEditModal(job) })}
                        onDelete={(job_code) => handleDeleteItem("job_phase", job_code)}
                        extraActions={(job) => (
                            <button className="btn btn-sm" onClick={() => setViewPhasesJob(job)}>View Phases</button>
                        )}
                    />
                );
            case "crewMapping":
                const allResources = {
                    users: data.users || [],
                    employees: data.employees || [],
                    equipment: data.equipment || [],
                    materials: data.materials || [],
                    vendors: data.vendors || [],
                };
                return <CrewMappingManager allResources={allResources} />;
            default: return <div>Section not implemented.</div>;
        }
    };
    return (
        <div className="admin-layout">
            {modal.shown && ( <Modal title={modal.title} onClose={() => setModal({ shown: false })}> <GenericForm fields={getFormFields(modal.type)} defaultValues={modal.item || {}} onSubmit={(formData) => handleAddOrUpdateItem(modal.type, formData, modal.mode, modal.item)} /> </Modal> )}
            {viewPhasesJob && <JobPhasesViewModal job={viewPhasesJob} onClose={() => setViewPhasesJob(null)} />}
            {jobModal.shown && <JobWithPhasesModal mode={jobModal.mode} job={jobModal.job} onSave={handleSaveJob} onClose={() => setJobModal({ shown: false, mode: "", job: null })} />}
            <nav className="admin-sidebar">
                <div className="sidebar-header">
        <h3>Admin Portal</h3>
        <div className="current-date">{currentDate}</div> {/* This is the element in question */}
        <button onClick={onLogout} className="btn btn-outline btn-sm">Logout</button>
    </div>
                <ul className="sidebar-nav">
                    {["users", "employees", "equipment", "job_phases", "materials", "vendors", "crewMapping"].map(sec => (
                        <li key={sec}>
                            <button onClick={() => setActiveSection(sec)} className={activeSection === sec ? "active" : ""}>
                                {sec === "job_phases" ? "Jobs & Phases" :
                                sec === "crewMapping" ? "Crew Mapping" :
                                sec === "vendors" ? "Work Performed" :
                                sec === "materials" ? "Materials and Trucking" :
                                sec.charAt(0).toUpperCase() + sec.slice(1)}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <main className="admin-content">{renderSection()}</main>
        </div>
    );
};
// --- Data Table (Modified to support extra actions) ---
const DataTableSection = ({ title, headers, data = [], renderRow, onDelete, onAdd, onEdit, extraActions }) => (
    <div className="data-table-container">
        <div className="section-header">
            <h2>{title}</h2>
            {onAdd && <button onClick={onAdd} className="btn btn-primary">Add New</button>}
        </div>
        <table className="data-table">
            <thead>
                <tr>
                    {headers.map(h => <th key={h}>{h}</th>)}
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id || item.job_code}>
                        {renderRow(item)}
<td>
    {onEdit && <button onClick={() => onEdit(item)} className="btn-edit btn-sm">Edit</button>}
    {onDelete && <button onClick={() => onDelete(item.job_code || item.id)} className="btn-delete btn-sm">Delete</button>}
    {extraActions && extraActions(item)}
</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
export default AdminDashboard;