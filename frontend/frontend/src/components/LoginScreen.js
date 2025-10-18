// import React, { useState } from 'react';

// const LoginScreen = ({ onLogin, users }) => {
//     const [error, setError] = useState('');

//     const handleLogin = (e) => {
//     e.preventDefault();
//     const { username, password, role } = Object.fromEntries(new FormData(e.target).entries());

//     // First, check default admin
//     if (username === 'admin' && password === 'Admin@123' && role === 'admin') {
//         alert('This is a temporary admin login. Please create a permanent user in the Admin Panel.');
//         onLogin({ username: 'admin', role: 'admin' });
//         return;
//     }
//     if (username === 'appadmin' && password === 'AppAdmin@123' && role === 'appadmin') {
//     alert('Application Admin access granted.');
//     onLogin({ username: 'appadmin', role: 'appadmin' });
//     return;
// }

//     // Then check normal users
//     const user = users.find(u => u.username === username && u.password === password && u.role === role);

//     if (user) {
//         onLogin(user);
//     } else {
//         setError('Invalid credentials or role.');
//     }
// };


//     return (
//         <div className="login-container">
//             <div className="company-logo">
//                 <h1>M LUIS CONSTRUCTION</h1>
//                 <p>COMPANY</p>
//             </div>
//             <form onSubmit={handleLogin}>
//                 <div className="form-group">
//                     <label className="form-label">Username</label>
//                     <input name="username" type="text" className="form-control" required />
//                 </div>
//                 <div className="form-group">
//                     <label className="form-label">Password</label>
//                     <input name="password" type="password" className="form-control" required />
//                 </div>
//                 <div className="form-group">
//                     <label className="form-label">Role</label>
//                     <select name="role" className="form-control" required>
//                         <option value="">Select Role</option>
//                         <option value="admin">Admin</option>
//                         <option value="appadmin">Application Admin</option>
//                     </select>
//                 </div>
//                 {error && <p style={{ color: 'red' }}>{error}</p>}
//                 <button type="submit" className="btn btn-primary btn--full-width">Login</button>
//                 {users.length === 0 && <p className="form-hint">No users found. Use default: admin / password</p>}
//             </form>
//         </div>
//     );
// };

// export default LoginScreen;











import React, { useState } from 'react';
// 1. Import your logo file - ADJUST THIS PATH AS NEEDED!
import companyLogo from './assets/logo.png'; 
import './LoginScreen.css'; // or the name you chose

const LoginScreen = ({ onLogin, users = [] }) => {
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        const { username, password, role } = Object.fromEntries(new FormData(e.target).entries());

        // Default Admin Check (Hardcoded for quick setup)
        if (username === 'admin' && password === 'Admin@123' && role === 'admin') {
            onLogin({ username: 'admin', role: 'admin' });
            return;
        }
        if (username === 'appadmin' && password === 'AppAdmin@123' && role === 'appadmin') {
            onLogin({ username: 'appadmin', role: 'appadmin' });
            return;
        }

        // Normal User Check (against the 'users' prop)
        const user = users.find(u => u.username === username && u.password === password && u.role === role);

        if (user) {
            onLogin(user);
        } else {
            setError('Invalid credentials or role.');
        }
    };

    return (
        // The main container for centering
        <div className="login-container">
            {/* The styled form card wrapper */}
            <div className="login-card"> 
                <div className="company-logo">
                    <img src={companyLogo} alt="M Luis Construction Logo" />
                    <h1>M LUIS Portal</h1>
                </div>
                
                <form onSubmit={handleLogin} className="login-form">
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
                            <option value="admin">System Admin</option>
                            <option value="appadmin">Application Admin</option>
                            {/* Add other roles here, e.g., <option value="foreman">Foreman</option> */}
                        </select>
                    </div>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary btn--full-width">Login</button>
                    {users.length === 0 && <p className="form-hint">No users found. Use default: admin / Admin@123</p>}
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;