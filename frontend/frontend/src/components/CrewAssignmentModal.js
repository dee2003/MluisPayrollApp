
// src/components/admin/CrewAssignmentModal.js
import React, { useState } from 'react';
import ForemanList from './ForemanList';
import "./CrewMapping.css";
// ResourceCard Component
const ResourceCard = ({ title, items, assignedIds, onToggle, itemType, disabledIds = new Set() }) => {
    const getItemDisplayName = (item, type) => {
        if (!item) return "N/A";
        return type === "employee" ? `${item.first_name} ${item.last_name}` : item.name;
    };
    return (
        <div className="resource-card-section">
            <h4 className="resource-card-title">{title}</h4>
<ul className="resource-item-list">
  {items
    .filter(item => !disabledIds.has(item.id)) // Only show unassigned items
    .map(item => (
      <li
        key={item.id}
        className={`toggle-resource-item ${assignedIds.includes(item.id) ? "assigned-resource" : ""}`}
        onClick={() => onToggle(item.id, itemType)}
      >
        {itemType === "employee" ? `${item.first_name} ${item.last_name}` : item.name}
        <span className="assignment-status-icon">
          {assignedIds.includes(item.id) ? "✓" : "+"}
        </span>
      </li>
    ))}
</ul>
        </div>
    );
};
// CrewAssignmentModal Component
const CrewAssignmentModal = ({ mode, initialData, onSave, onClose, allCrews, allResources }) => {
    const { users, employees, equipment, materials, vendors,dumping_sites  } = allResources;
    const [selectedForeman, setSelectedForeman] = useState(initialData?.foreman_id || null);
    const [assignments, setAssignments] = useState({
        employee_ids: initialData?.employee_ids || [],
        equipment_ids: initialData?.equipment_ids || [],
        material_ids: initialData?.material_ids || [],
        vendor_ids: initialData?.vendor_ids || [],
                dumping_site_ids: initialData?.dumping_site_ids || [], // NEW

    });
    // Employees already assigned to other crews
    const alreadyAssignedEmployeeIds = new Set(
        allCrews
            .filter(crew => crew.id !== initialData?.id)
            .flatMap(crew => crew.employee_ids)
    );
    // Foremen already assigned to other crews
    const assignedForemanIds = new Set(
        allCrews
            .filter(crew => crew.id !== initialData?.id)
            .map(crew => crew.foreman_id)
    );
    const handleToggleAssignment = (id, type) => {
        const key = `${type}_ids`;
        setAssignments(prev => ({
            ...prev,
            [key]: prev[key].includes(id)
                ? prev[key].filter(currentId => currentId !== id)
                : [...prev[key], id]
        }));
    };
    const handleSave = () => {
        if (!selectedForeman) return alert("Please select a foreman.");
        if (assignments.employee_ids.length === 0) return alert("A crew must have at least one employee.");
        onSave({ foreman_id: selectedForeman, ...assignments });
    };
    const availableForemen = users.filter(u => u.role?.toLowerCase() === "foreman");
    return (
        <div className="modal">
            <div className="modal-content large">
                {/* Header */}
                <div className="modal-header">
                    <h3>{mode === 'edit' ? 'Edit Crew' : 'Create New Crew'}</h3>
                    <button onClick={onClose} className="btn-close">×</button>
                </div>
                {/* Scrollable Body */}
                <div className="modal-body">
                    <div className="foreman-selection-card">
                        <h3 className="section-title">Select Crew Leader</h3>
                        <ForemanList
                            foremen={availableForemen}
                            selectedForemanId={selectedForeman}
                            onSelect={setSelectedForeman}
                            disabledForemanIds={assignedForemanIds}
                        />
                    </div>
                    {selectedForeman && (
                        <div className="resource-assignment-grid">
                            <ResourceCard
                                title="Employees"
                                items={employees}
                                assignedIds={assignments.employee_ids}
                                onToggle={handleToggleAssignment}
                                itemType="employee"
                                disabledIds={alreadyAssignedEmployeeIds}
                            />
                            <ResourceCard
                                title="Equipment"
                                items={equipment}
                                assignedIds={assignments.equipment_ids}
                                onToggle={handleToggleAssignment}
                                itemType="equipment"
                            />
                            <ResourceCard
                                title="Materials"
                                items={materials}
                                assignedIds={assignments.material_ids}
                                onToggle={handleToggleAssignment}
                                itemType="material"
                            />
                            <ResourceCard
                                title="Work Performed"
                                items={vendors}
                                assignedIds={assignments.vendor_ids}
                                onToggle={handleToggleAssignment}
                                itemType="vendor"
                            />
                            <ResourceCard
                                title="Dumping Sites"
                                items={dumping_sites}
                                assignedIds={assignments.dumping_site_ids}
                                onToggle={handleToggleAssignment}
                                itemType="dumping_site"
                            />
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="modal-actions">
                    <button onClick={handleSave} className="btn-save-cta">Save Crew</button>
                </div>
            </div>
        </div>
    );
};
export default CrewAssignmentModal;