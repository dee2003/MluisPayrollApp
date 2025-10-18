// // src/components/admin/CrewMappingManager.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import CrewListTable from './CrewListTable';
// import CrewAssignmentModal from './CrewAssignmentModal';
// import CrewViewModal from './CrewViewModal';

// const API_URL = "http://127.0.0.1:8000/api";

// const CrewMappingManager = ({ allResources }) => {
//     const [crewList, setCrewList] = useState([]);
//     const [modal, setModal] = useState({ type: null, data: null }); // type: 'add', 'edit', 'view'
//     const [error, setError] = useState(null);
//     const [loading, setLoading] = useState(true);

//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             const response = await axios.get(`${API_URL}/crew-mapping/`);
//             setCrewList(response.data);
//             setError(null);
//         } catch (err) {
//             setError("Failed to fetch crew data.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const handleSave = async (payload) => {
//         try {
//             const url = modal.type === 'edit'
//                 ? `${API_URL}/crew-mapping/${modal.data.id}`
//                 : `${API_URL}/crew-mapping/`;
//             const method = modal.type === 'edit' ? 'put' : 'post';
            
//             await axios[method](url, payload);
            
//             setModal({ type: null, data: null });
//             fetchData(); // Re-fetch the list to show the update
//         } catch (err) {
//             setError(err.response?.data?.detail || `Failed to ${modal.type === 'edit' ? 'update' : 'create'} crew.`);
//         }
//     };

//     const handleDelete = async (crewId) => {
//         if (window.confirm("Are you sure you want to delete this crew? This action cannot be undone.")) {
//             try {
//                 await axios.delete(`${API_URL}/crew-mapping/${crewId}`);
//                 fetchData(); // Refresh list
//             } catch (err) {
//                 setError(err.response?.data?.detail || "Failed to delete crew.");
//             }
//         }
//     };

//     if (loading) return <div>Loading crews...</div>;

//     return (
//         <div className="data-table-container">
//             <div className="section-header">
//                 <h2>Crew Management</h2>
//                 <button onClick={() => setModal({ type: 'add', data: null })} className="btn btn-primary">
//                     Create New Crew
//                 </button>
//             </div>

//             {error && <div className="alert alert-danger">{error}</div>}

//             <CrewListTable
//                 crews={crewList}
//                 users={allResources.users}
//                 onView={(crew) => setModal({ type: 'view', data: crew })}
//                 onEdit={(crew) => setModal({ type: 'edit', data: crew })}
//                 onDelete={handleDelete}
//             />

//             {(modal.type === 'add' || modal.type === 'edit') && (
//                 <CrewAssignmentModal
//                     mode={modal.type}
//                     initialData={modal.data}
//                     onSave={handleSave}
//                     onClose={() => setModal({ type: null, data: null })}
//                     allCrews={crewList}
//                     allResources={allResources}
//                 />
//             )}

//             {modal.type === 'view' && (
//                 <CrewViewModal
//                     crew={modal.data}
//                     allResources={allResources}
//                     onClose={() => setModal({ type: null, data: null })}
//                 />
//             )}
//         </div>
//     );
// };

// export default CrewMappingManager;




// // src/components/admin/CrewMappingManager.js
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import CrewListTable from './CrewListTable';
// import CrewAssignmentModal from './CrewAssignmentModal';
// import CrewViewModal from './CrewViewModal';


// const API_URL = "http://127.0.0.1:8000/api";


// const CrewMappingManager = ({ allResources }) => {
//     const [crewList, setCrewList] = useState([]);
//     const [modal, setModal] = useState({ type: null, data: null }); // type: 'add', 'edit', 'view'
//     const [error, setError] = useState(null);
//     const [loading, setLoading] = useState(true);


//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             const response = await axios.get(`${API_URL}/crew-mapping/`);
//             setCrewList(response.data);
//             setError(null);
//         } catch (err) {
//             setError("Failed to fetch crew data.");
//         } finally {
//             setLoading(false);
//         }
//     };


//     useEffect(() => {
//         fetchData();
//     }, []);


//     const handleSave = async (payload) => {
//         try {
//             const url = modal.type === 'edit'
//                 ? `${API_URL}/crew-mapping/${modal.data.id}`
//                 : `${API_URL}/crew-mapping/`;
//             const method = modal.type === 'edit' ? 'put' : 'post';
            
//             await axios[method](url, payload);
            
//             setModal({ type: null, data: null });
//             fetchData(); // Re-fetch the list to show the update
//         } catch (err) {
//             setError(err.response?.data?.detail || `Failed to ${modal.type === 'edit' ? 'update' : 'create'} crew.`);
//         }
//     };


//     const handleDelete = async (crewId) => {
//         if (window.confirm("Are you sure you want to delete this crew? This action cannot be undone.")) {
//             try {
//                 await axios.delete(`${API_URL}/crew-mapping/${crewId}`);
//                 fetchData(); // Refresh list
//             } catch (err) {
//                 setError(err.response?.data?.detail || "Failed to delete crew.");
//             }
//         }
//     };
    
//     // Create a modified version of resources for display in crew mapping modals
//     const crewMappingResources = {
//         ...allResources,
//         equipment: allResources.equipment.map(eq => ({
//             ...eq,
//             // Prepend the ID to the name for display purposes
//             name: `${eq.id} - ${eq.name}`
//         }))
//     };


//     if (loading) return <div>Loading crews...</div>;


//     return (
//         <div className="data-table-container">
//             <div className="section-header">
//                 <h2>Crew Management</h2>
//                 <button onClick={() => setModal({ type: 'add', data: null })} className="btn btn-primary">
//                     Create New Crew
//                 </button>
//             </div>


//             {error && <div className="alert alert-danger">{error}</div>}


//             <CrewListTable
//                 crews={crewList}
//                 users={allResources.users}
//                 onView={(crew) => setModal({ type: 'view', data: crew })}
//                 onEdit={(crew) => setModal({ type: 'edit', data: crew })}
//                 onDelete={handleDelete}
//             />


//             {(modal.type === 'add' || modal.type === 'edit') && (
//                 <CrewAssignmentModal
//                     mode={modal.type}
//                     initialData={modal.data}
//                     onSave={handleSave}
//                     onClose={() => setModal({ type: null, data: null })}
//                     allCrews={crewList}
//                     allResources={crewMappingResources}
//                 />
//             )}


//             {modal.type === 'view' && (
//                 <CrewViewModal
//                     crew={modal.data}
//                     allResources={crewMappingResources}
//                     onClose={() => setModal({ type: null, data: null })}
//                 />
//             )}
//         </div>
//     );
// };


// export default CrewMappingManager;



// src/components/admin/CrewMappingManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CrewListTable from './CrewListTable';
import CrewAssignmentModal from './CrewAssignmentModal';
import CrewViewModal from './CrewViewModal';
const API_URL = "http://127.0.0.1:8000/api";
const CrewMappingManager = ({ allResources }) => {
    const [crewList, setCrewList] = useState([]);
    const [modal, setModal] = useState({ type: null, data: null }); // type: 'add', 'edit', 'view'
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/crew-mapping/`);
            setCrewList(response.data);
            setError(null);
        } catch (err) {
            setError("Failed to fetch crew data.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleSave = async (payload) => {
        try {
            const url = modal.type === 'edit'
                ? `${API_URL}/crew-mapping/${modal.data.id}`
                : `${API_URL}/crew-mapping/`;
            const method = modal.type === 'edit' ? 'put' : 'post';
            await axios[method](url, payload);
            setModal({ type: null, data: null });
            fetchData(); // Re-fetch the list to show the update
        } catch (err) {
            setError(err.response?.data?.detail || `Failed to ${modal.type === 'edit' ? 'update' : 'create'} crew.`);
        }
    };
    const handleDelete = async (crewId) => {
        if (window.confirm("Are you sure you want to delete this crew? This action cannot be undone.")) {
            try {
                await axios.delete(`${API_URL}/crew-mapping/${crewId}`);
                fetchData(); // Refresh list
            } catch (err) {
                setError(err.response?.data?.detail || "Failed to delete crew.");
            }
        }
    };
    // Create a modified version of resources for display in crew mapping modals
    const crewMappingResources = {
        ...allResources,
        equipment: allResources.equipment.map(eq => ({
            ...eq,
            // Prepend the ID to the name for display purposes
            name: `${eq.id} - ${eq.name}`
        }))
    };
    if (loading) return <div>Loading crews...</div>;
    return (
        <div className="data-table-container">
            <div className="section-header">
                <h2>Crew Management</h2>
                <button onClick={() => setModal({ type: 'add', data: null })} className="btn btn-primary">
                    Create New Crew
                </button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <CrewListTable
                crews={crewList}
                users={allResources.users}
                onView={(crew) => setModal({ type: 'view', data: crew })}
                onEdit={(crew) => setModal({ type: 'edit', data: crew })}
                onDelete={handleDelete}
            />
            {(modal.type === 'add' || modal.type === 'edit') && (
                <CrewAssignmentModal
                    mode={modal.type}
                    initialData={modal.data}
                    onSave={handleSave}
                    onClose={() => setModal({ type: null, data: null })}
                    allCrews={crewList}
                    allResources={crewMappingResources}
                />
            )}
            {modal.type === 'view' && (
                <CrewViewModal
                    crew={modal.data}
                    allResources={crewMappingResources}
                    onClose={() => setModal({ type: null, data: null })}
                />
            )}
        </div>
    );
};
export default CrewMappingManager;