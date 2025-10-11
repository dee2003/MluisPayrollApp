// src/components/admin/CrewViewModal.js
import React from 'react';

const CrewViewModal = ({ crew, allResources, onClose }) => {
    const { users, employees, equipment, materials, vendors } = allResources;

    const getForemanName = (foremanId) => {
        const foreman = users.find(u => u.id === foremanId);
        return foreman ? `${foreman.first_name} ${foreman.last_name}` : 'N/A';
    };

    const getResourceDetails = (ids, resourceList, nameKey = 'name') => {
        if (!ids || ids.length === 0) return <li>None</li>;
        return ids.map(id => {
            const resource = resourceList.find(r => r.id === id);
            const displayName = nameKey === 'employee'
                ? `${resource?.first_name} ${resource?.last_name}`
                : resource?.[nameKey];
            return <li key={id}>{displayName || `Unknown ID: ${id}`}</li>;
        });
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Crew Details: {getForemanName(crew.foreman_id)}</h3>
                    <button onClick={onClose} className="btn-close">×</button>
                </div>
                <div className="crew-view-details">
                    <div>
                        <h4>Employees</h4>
                        <ul>{getResourceDetails(crew.employee_ids, employees, 'employee')}</ul>
                    </div>
                    <div>
                        <h4>Equipment</h4>
                        <ul>{getResourceDetails(crew.equipment_ids, equipment)}</ul>
                    </div>
                    <div>
                        <h4>Materials</h4>
                        <ul>{getResourceDetails(crew.material_ids, materials)}</ul>
                    </div>
                    <div>
                        <h4>Vendors</h4>
                        <ul>{getResourceDetails(crew.vendor_ids, vendors)}</ul>
                    </div>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-outline">Close</button>
                </div>
            </div>
        </div>
    );
};

export default CrewViewModal;
