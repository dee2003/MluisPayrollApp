import React, { useState } from 'react';

const LoginScreen = ({ onLogin, users }) => {
    const [error, setError] = useState('');

    const handleLogin = (e) => {
    e.preventDefault();
    const { username, password, role } = Object.fromEntries(new FormData(e.target).entries());

    // First, check default admin
    if (username === 'admin' && password === 'Admin@123' && role === 'admin') {
        alert('This is a temporary admin login. Please create a permanent user in the Admin Panel.');
        onLogin({ username: 'admin', role: 'admin' });
        return;
    }
    if (username === 'appadmin' && password === 'AppAdmin@123' && role === 'appadmin') {
    alert('Application Admin access granted.');
    onLogin({ username: 'appadmin', role: 'appadmin' });
    return;
}

    // Then check normal users
    const user = users.find(u => u.username === username && u.password === password && u.role === role);

    if (user) {
        onLogin(user);
    } else {
        setError('Invalid credentials or role.');
    }
};


    return (
        <div className="login-container">
            <div className="company-logo">
                <h1>M LUIS CONSTRUCTION</h1>
                <p>COMPANY</p>
            </div>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label className="form-label">Username</label>
                    <input name="username" type="text" className="form-control" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input name="password" type="password" className="form-control" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Role</label>
                    <select name="role" className="form-control" required>
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="foreman">Foreman</option>
                        <option value="appadmin">Application Admin</option>
                    </select>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" className="btn btn-primary btn--full-width">Login</button>
                {users.length === 0 && <p className="form-hint">No users found. Use default: admin / password</p>}
            </form>
        </div>
    );
};

export default LoginScreen;