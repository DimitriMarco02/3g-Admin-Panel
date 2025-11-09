import React, { useState } from 'react';

interface ForgotPasswordViewProps {
    onPasswordResetRequest: (email: string) => Promise<{ success: boolean; message: string }>;
    onBackToLogin: () => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onPasswordResetRequest, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const result = await onPasswordResetRequest(email);
        setMessage({
            type: result.success ? 'success' : 'error',
            text: result.message
        });
        if (result.success) {
            setEmail('');
        }
        setLoading(false);
    };

    return (
        <div className="p-4 sm:p-6 animate-fade-in flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                        <p className="text-slate-500 text-sm mt-1">Enter your email to receive a reset link.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email-reset" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                id="email-reset"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                                required
                            />
                        </div>

                        {message && (
                            <p className={`text-sm font-medium text-center p-3 rounded-lg ${
                                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {message.text}
                            </p>
                        )}
                        
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-slate-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-300 disabled:bg-amber-300 disabled:cursor-not-allowed">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                         <p className="text-center text-sm text-slate-500">
                            Remember your password?{' '}
                            <button type="button" onClick={onBackToLogin} className="font-medium text-blue-600 hover:underline">
                                Back to Login
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordView;