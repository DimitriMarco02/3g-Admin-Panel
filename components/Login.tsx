import React, { useState } from 'react';

interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded credentials as requested
        if (username === 'Ryn' && password === '123') {
            setError('');
            onLoginSuccess();
        } else {
            setError('Invalid username or password.');
        }
    };

    return (
        <div className="p-4 sm:p-6 animate-fade-in flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Admin Login</h2>
                        <p className="text-slate-500 text-sm mt-1">Access the management panel</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                                required
                            />
                        </div>

                        {error && <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                        
                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-slate-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-300">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;