import React from 'react';

export const ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void; }> = ({ onEdit, onDelete }) => (
    <div className="flex items-center space-x-2 flex-shrink-0">
        <button onClick={onEdit} className="text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-slate-100" aria-label="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
        </button>
        <button onClick={onDelete} className={`text-slate-500 p-1.5 rounded-md transition-colors hover:text-red-600 hover:bg-red-100`} aria-label="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
        </button>
    </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-xl flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700" aria-label="Close modal">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed" />
    </div>
);
export const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea {...props} rows={4} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);
export const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; containerClassName?: string }> = ({ label, children, containerClassName, ...props }) => (
    <div className={`w-full ${containerClassName}`}>
        {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
        <select {...props} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {children}
        </select>
    </div>
);

export const Section: React.FC<{ title: string; subtitle?: string; button?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, button, children }) => (
    <div className="bg-white rounded-xl shadow-lg shadow-blue-500/5 p-4 sm:p-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            {button}
        </div>
        <div>{children}</div>
    </div>
);

export const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};
