// src/components/admin/CrewListTable.js
import React from 'react';

const CrewListTable = ({ crews, users, onView, onEdit, onDelete }) => {
    const getForemanName = (foremanId) => {
        // Guard against users array not being loaded yet
        if (!users || users.length === 0) {
            return 'Loading...';
        }
        const foreman = users.find(u => u.id === foremanId);
        return foreman ? `${foreman.first_name} ${foreman.last_name}` : 'Unknown Foreman';
    };

    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Foreman</th>
                        <th>Assigned Employees</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Guard clause to ensure 'crews' is not undefined */}
                    {crews && crews.length > 0 ? (
                        crews.map(crew => (
                            <tr key={crew.id}>
                                <td>{getForemanName(crew.foreman_id)}</td>
                                {/* ✅ CORRECTED: Use the 'employees' array, not 'employee_ids' */}
                                <td>{crew.employees.length}</td>
                                <td className="actions-cell">
                                    <button onClick={() => onView(crew)} className="btn btn-sm btn-info">View</button>
                                    <button onClick={() => onEdit(crew)} className="btn btn-sm btn-edit">Edit</button>
                                    <button onClick={() => onDelete(crew.id)} className="btn btn-sm btn-delete">Delete</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>No crews created yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CrewListTable;
