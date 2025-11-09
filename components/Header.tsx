import React from 'react';
import type { User, Teacher } from '../types';

interface HeaderProps {
  logoUrl: string;
  currentUser: User | null;
  currentTeacher: Teacher | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ logoUrl, currentUser, currentTeacher, onNavigate, onLogout, onOpenSidebar }) => {
  const loggedInUser = currentUser || currentTeacher;

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-10 border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <button onClick={onOpenSidebar} className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
           </button>
           <button onClick={() => onNavigate('home')} className="flex items-center space-x-3">
              <div className="bg-slate-800 p-2 rounded-lg">
                <img src={logoUrl} alt="App Logo" className="h-6 w-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight hidden sm:block">3G Coaching Hub</h1>
          </button>
        </div>
        <div>
          {loggedInUser ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700 hidden sm:block">Welcome, {loggedInUser.name.split(' ')[0]}!</span>
              <button onClick={onLogout} className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={() => onNavigate('studentLogin')} className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                Login
              </button>
              <button onClick={() => onNavigate('signup')} className="px-4 py-2 text-sm font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors">
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;