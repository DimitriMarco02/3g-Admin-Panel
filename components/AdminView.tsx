import React, { useState } from 'react';
import { useDragToScroll } from '../hooks/useDragToScroll';

import type { AdminViewProps } from './admin/types';
import DashboardView from './admin/DashboardView';
import HomeManager from './admin/HomeManager';
import BookingsManager from './admin/BookingsManager';
import SubjectsManager from './admin/SubjectsManager';
import TeachersManager from './admin/TeachersManager';
import CentersManager from './admin/CentersManager';
import DiamondStudentsManager from './admin/DiamondStudentsManager';
import StudentsManager from './admin/StudentsManager';
import PaymentsManager from './admin/PaymentsManager';
import QuizzesManager from './admin/QuizzesManager';


type AdminTab = 'dashboard' | 'bookings' | 'enrollments' | 'payments' | 'subjects' | 'teachers' | 'centers' | 'home' | 'diamondStudents' | 'quizzes';

const AdminView: React.FC<AdminViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const tabsScrollRef = useDragToScroll();
  
  const TabButton = ({ tab, label }: { tab: AdminTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex-shrink-0 ${
        activeTab === tab
          ? 'bg-white text-blue-600 shadow'
          : 'text-slate-600 hover:bg-white/70'
      }`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView {...props} />;
      case 'home': return <HomeManager {...props} />;
      case 'bookings': return <BookingsManager {...props} />;
      case 'subjects': return <SubjectsManager {...props} />;
      case 'teachers': return <TeachersManager {...props} />;
      case 'centers': return <CentersManager {...props} />;
      case 'diamondStudents': return <DiamondStudentsManager {...props} />;
      case 'enrollments': return <StudentsManager {...props} />;
      case 'payments': return <PaymentsManager {...props} />;
      case 'quizzes': return <QuizzesManager {...props} />;
      default: return null;
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Panel</h2>
      </div>
      <div ref={tabsScrollRef} className="mb-8 bg-slate-100 p-1.5 rounded-xl flex flex-row space-x-1 overflow-x-auto no-scrollbar horizontal-scroll">
        <TabButton tab="dashboard" label="Dashboard" />
        <TabButton tab="bookings" label="Bookings" />
        <TabButton tab="enrollments" label="Students" />
        <TabButton tab="payments" label="Payments" />
        <TabButton tab="subjects" label="Subjects" />
        <TabButton tab="teachers" label="Teachers" />
        <TabButton tab="centers" label="Centers" />
        <TabButton tab="home" label="Home Page" />
        <TabButton tab="diamondStudents" label="Top Results" />
        <TabButton tab="quizzes" label="Quizzes" />
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default AdminView;
