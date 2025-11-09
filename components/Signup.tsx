import React, { useState } from 'react';
import type { User } from '../types';

interface SignupProps {
    onSignup: (newUser: Omit<User, 'id'>) => Promise<boolean>;
    onNavigateToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onNavigateToLogin }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || !address || !email || !password) {
            setError('Please fill out all fields.');
            return;
        }
        setLoading(true);
        setError('');
        const success = await onSignup({ name, phone, address, email, password });
        if (!success) {
            setError('This email is already taken. Please choose another.');
        }
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 animate-fade-in flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Create Your Account</h2>
                        <p className="text-slate-500 text-sm mt-1">Get started by creating a student account.</p>
                    </div>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg text-black" required />
                            </div>
                             <div>
                                <label htmlFor="phone-signup" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input type="tel" id="phone-signup" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg text-black" required />
                            </div>
                             <div>
                                <label htmlFor="address-signup" className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <input type="text" id="address-signup" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg text-black" required />
                            </div>
                        </div>
                         <hr className="!my-6"/>
                        <div>
                            <label htmlFor="email-signup" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" id="email-signup" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg text-black" required />
                        </div>
                        <div>
                            <label htmlFor="password-signup" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input type="password" id="password-signup" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-white border border-slate-300 rounded-lg text-black" required />
                        </div>

                        {error && <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                        
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-slate-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-300 disabled:bg-amber-300 disabled:cursor-not-allowed">
                           {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                         <p className="text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <button type="button" onClick={onNavigateToLogin} className="font-medium text-blue-600 hover:underline">
                                Login
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;