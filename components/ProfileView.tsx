
import React, { useState } from 'react';
import type { User } from '../types';

interface ProfileViewProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onUpdatePassword: (userId: number, currentPass: string, newPass: string) => { success: boolean; message: string };
  onBack: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input {...props} className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUpdateUser, onUpdatePassword, onBack }) => {
  const [formData, setFormData] = useState<User>(currentUser);
  const [successMessage, setSuccessMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setSuccessMessage('Your profile has been updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000); // Hide message after 3 seconds
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
    }
    if (!newPassword || newPassword.length < 3) {
        setPasswordMessage({ type: 'error', text: 'New password must be at least 3 characters.' });
        return;
    }
    const result = onUpdatePassword(currentUser.id, currentPassword, newPassword);
    if (result.success) {
        setPasswordMessage({ type: 'success', text: result.message });
        setTimeout(() => setPasswordMessage({type: '', text: ''}), 3000);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } else {
        setPasswordMessage({ type: 'error', text: result.message });
    }
};


  return (
    <div className="p-4 sm:p-6 animate-fade-in">
       <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Back
        </button>

      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8 max-w-2xl mx-auto">
        <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">My Profile</h2>
            <p className="text-slate-600 mb-8">Update your personal information below.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                    label="Full Name"
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />
                 <InputField
                    label="Phone Number"
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                />
                 <InputField
                    label="Address"
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                />
                
                <div className="pt-4">
                     {successMessage && (
                        <div className="mb-4 text-center p-3 bg-green-100 text-green-800 rounded-lg animate-fade-in-fast">
                            {successMessage}
                        </div>
                    )}
                    <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all duration-300 ease-in-out">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>

        <div className="mt-10 pt-8 border-t">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Change Password</h3>
            <p className="text-slate-600 mb-6">Update your password for enhanced security.</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                 <InputField
                    label="Current Password"
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
                 <InputField
                    label="New Password"
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                 <InputField
                    label="Confirm New Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                {passwordMessage.text && (
                    <div className={`text-center p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {passwordMessage.text}
                    </div>
                )}
                 <button type="submit" className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400 transition-all duration-300 ease-in-out">
                    Change Password
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
