import React, { useState } from 'react';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import AdmissionPaymentModal from './components/AdmissionForm';
import ViewRouter from './src/components/ViewRouter';

import { useAuth } from './src/contexts/AuthContext';
import { useData } from './src/contexts/DataContext';
import { useNavigation } from './src/contexts/NavigationContext';

const App: React.FC = () => {
    const { currentUser, currentTeacher, logout } = useAuth();
    const { seedDatabase } = useData();
    const { 
        currentView, 
        navigate, 
        bookingForPaymentModal, 
        closePaymentModal, 
        handleCompleteAdmissionPayment 
    } = useNavigation();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isMessagesView = currentView === 'messages';

    return (
        <div className={`bg-slate-50 font-sans ${isMessagesView ? 'h-screen flex flex-col' : 'min-h-screen'}`}>
            {/* --- TEMPORARY SEED BUTTON --- */}
            <button
                onClick={seedDatabase}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '20px',
                    zIndex: 1000,
                    padding: '10px 20px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                }}
            >
                Seed Database
            </button>
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                currentUser={currentUser}
                currentTeacher={currentTeacher}
                onNavigate={navigate}
                onLogout={logout}
            />
            <Header 
                logoUrl={useData().logoUrl}
                currentUser={currentUser} 
                currentTeacher={currentTeacher}
                onNavigate={navigate} 
                onLogout={logout}
                onOpenSidebar={() => setIsSidebarOpen(true)}
            />
            <main className={`max-w-4xl mx-auto w-full ${isMessagesView ? 'flex-1 overflow-hidden p-4 pb-20' : 'py-8 sm:py-12 px-0 sm:px-0 pb-20'}`}>
                <ViewRouter />
            </main>
            <BottomNav activeView={currentView} onNavigate={navigate} currentUser={currentUser} />

            {bookingForPaymentModal && (
                <AdmissionPaymentModal
                    booking={bookingForPaymentModal}
                    onClose={closePaymentModal}
                    onSubmit={handleCompleteAdmissionPayment}
                />
            )}
        </div>
    );
};

export default App;