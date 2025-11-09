import React from 'react';

import BookingForm from '../../components/BookingForm';
import Confirmation from '../../components/Confirmation';
import TeachersView from '../../components/TeachersView';
import TeacherDetailView from '../../components/TeacherDetailView';
import BookingsList from '../../components/BookingsList';
import Login from '../../components/Login';
import AdminView from '../../components/AdminView';
import StudentLogin from '../../components/StudentLogin';
import Signup from '../../components/Signup';
import HomeView from '../../components/HomeView';
import DiamondStudentDetailView from '../../components/DiamondStudentDetailView';
import CenterDetailView from '../../components/CenterDetailView';
import ProfileView from '../../components/ProfileView';
import SubjectDetailView from '../../components/SubjectDetailView';
import ForgotPasswordView from '../../components/ForgotPasswordView';
import TeacherProfileView from '../../components/TeacherProfileView';
import QuizView from '../../components/QuizView';
import MessagesView from '../../components/MessagesView';

import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigation } from '../contexts/NavigationContext';

const ViewRouter: React.FC = () => {
    const { currentUser, currentTeacher, login, signup, requestPasswordReset, updatePassword } = useAuth();
    const data = useData();
    const nav = useNavigation();

    const { 
        currentView, navigate,
        selectedSubject, bookingType,
        _internal, loginReturnView
    } = nav;
    
    // Functions that bridge data and navigation contexts
    const handleBookingSubmit = async (details: any) => {
        if (!currentUser || !selectedSubject || !bookingType) return;
        const bookingData = await data.submitBooking(details, selectedSubject, currentUser, bookingType);
        if (bookingType === 'Trial') {
            _internal.setBookingDetailsForConfirmation(bookingData as any);
            navigate('confirmation');
        } else {
            _internal.setBookingForPaymentModal(bookingData);
        }
    };

    const handleLoginSuccess = (role: 'admin' | 'teacher' | 'student') => {
        if (role === 'admin') navigate('admin');
        else if (role === 'teacher') navigate('teacherProfile');
        else navigate('home');
    };

    const handleSignupSuccess = (role: 'teacher' | 'student') => {
        if (role === 'teacher') navigate('teacherProfile');
        else navigate('home');
    };

    const handleStartChat = async (partner: any) => {
        const chatId = await data.startChat(partner);
        if (chatId) {
            _internal.setActiveChatId(chatId);
            navigate('messages');
        } else {
            navigate('studentLogin');
        }
    }

    const handleCreateGroupChat = async (groupName: string, students: any[]) => {
        const chatId = await data.createGroupChat(groupName, students);
        if (chatId) {
            _internal.setActiveChatId(chatId);
            navigate('messages');
        }
    }

    // This replaces the old `renderView` function
    switch (currentView) {
        case 'booking':
            return selectedSubject && currentUser && bookingType && <BookingForm subject={selectedSubject} currentUser={currentUser} bookingType={bookingType} allTeachers={data.allTeachers} allCenters={data.allCenters} onSubmit={handleBookingSubmit} onBack={() => navigate('subjects')} />;
        case 'confirmation':
            return nav.bookingDetailsForConfirmation && <Confirmation bookingDetails={nav.bookingDetailsForConfirmation} onNewBooking={nav.startNewBooking} />;
        case 'login':
            return <Login onLogin={(e, p) => login(e, p, handleLoginSuccess)} onNavigateToForgotPassword={() => nav.navigateToForgotPassword('login')} />;
        case 'studentLogin':
            return <StudentLogin onLogin={(e, p) => login(e, p, handleLoginSuccess)} onNavigateToSignup={() => navigate('signup')} onNavigateToForgotPassword={() => nav.navigateToForgotPassword('studentLogin')} />;
        case 'signup':
            return <Signup onSignup={(u) => signup(u, handleSignupSuccess)} onNavigateToLogin={() => navigate('studentLogin')} />;
        case 'forgotPassword':
            return <ForgotPasswordView onPasswordResetRequest={requestPasswordReset} onBackToLogin={() => navigate(loginReturnView)} />;
        case 'teachers':
            return <TeachersView teachers={data.allTeachers} subjects={data.allSubjects} centers={data.allCenters} onSelectTeacher={nav.selectTeacher} onBack={() => navigate('home')} />;
        case 'teacherDetail':
            const selectedTeacher = data.allTeachers.find(t => t.id === nav.selectedTeacherId);
            return selectedTeacher ? <TeacherDetailView teacher={selectedTeacher} allSubjects={data.allSubjects} allCenters={data.allCenters} currentUser={currentUser} onBack={() => navigate('teachers')} onBook={(subject) => nav.startBookingFlow(subject, 'Admission')} onAddReview={data.addReview}/> : <div>Teacher not found</div>;
        case 'subjectDetail':
            return selectedSubject && <SubjectDetailView subject={selectedSubject} allTeachers={data.allTeachers} allSubjects={data.allSubjects} onBack={() => navigate('subjects')} onSelectTeacher={nav.selectTeacher} onBook={nav.startBookingFlow} />;
        case 'centerDetail':
            const selectedCenter = data.allCenters.find(c => c.id === nav.selectedCenterId);
            return selectedCenter ? <CenterDetailView center={selectedCenter} allTeachers={data.allTeachers} allSubjects={data.allSubjects} onBack={() => navigate('home')} onSelectTeacher={nav.selectTeacher} /> : <div>Center not found</div>;
        case 'diamondStudentDetail':
            return nav.selectedDiamondStudent && <DiamondStudentDetailView student={nav.selectedDiamondStudent} onBack={() => navigate('home')} />;
        case 'bookings':
            return <BookingsList allBookings={data.allBookings} currentUser={currentUser} onTakeAdmission={() => {}} onTakeAdmissionForAll={() => {}} onDownloadReceipt={() => {}} onUpdateBookingStatus={data.updateBookingStatus} onBack={() => navigate('home')} />;
        case 'quiz':
            const activeQuiz = data.allQuizzes.find(q => q.isActive);
            return activeQuiz && currentUser ? <QuizView quiz={activeQuiz} currentUser={currentUser} userSubmission={data.allQuizSubmissions.find(s => s.quizId === activeQuiz.id && s.userId === currentUser.id)} onSubmit={data.submitQuiz} onBack={() => navigate('home')} /> : <div className="text-center p-10 text-slate-500">No active quiz available.</div>;
        case 'messages':
            return (currentUser || currentTeacher) ? <MessagesView currentUser={(currentUser || currentTeacher)!} initialChatId={nav.activeChatId} onBack={() => navigate('home')} /> : <StudentLogin onLogin={(e, p) => login(e, p, handleLoginSuccess)} onNavigateToSignup={() => navigate('signup')} onNavigateToForgotPassword={() => nav.navigateToForgotPassword('studentLogin')} />;
        case 'profile':
            return currentUser && <ProfileView currentUser={currentUser} onUpdateUser={data.updateUser} onUpdatePassword={updatePassword} onBack={() => navigate('home')} allEnrollments={data.allEnrollments.filter(e => e.userId === currentUser.id)} allPayments={data.allPayments.filter(p => p.userId === currentUser.id)} allSubjects={data.allSubjects} allTeachers={data.allTeachers} allCenters={data.allCenters} allBookings={data.allBookings} onAddPayment={data.studentAddPayment} onDownloadReceipt={()=>{}} onDownloadMonthlyReceipt={()=>{}} onStartChat={handleStartChat} />;
        case 'teacherProfile':
            return currentTeacher && <TeacherProfileView currentTeacher={currentTeacher} onUpdateTeacher={data.updateTeacher} onUpdatePassword={updatePassword} allSubjects={data.allSubjects} allCenters={data.allCenters} allEnrollments={data.allEnrollments} allPayments={data.allPayments} allUsers={data.allUsers} onBack={() => navigate('home')} onStartChat={handleStartChat} onCreateGroupChat={handleCreateGroupChat} />;
        case 'admin':
            return currentUser?.isAdmin ? <AdminView {...data} /> : <Login onLogin={(e, p) => login(e, p, handleLoginSuccess)} onNavigateToForgotPassword={() => nav.navigateToForgotPassword('login')} />;
        case 'subjects':
             return <HomeView subjects={data.allSubjects} teachers={data.allTeachers} centers={data.allCenters} slides={data.allSlides} notices={data.allNotices} diamondStudents={data.allDiamondStudents} allQuizzes={data.allQuizzes} allQuizSubmissions={data.allQuizSubmissions} onSelectSubject={nav.viewSubject} onSelectTeacher={nav.selectTeacher} onSelectDiamondStudent={nav.selectDiamondStudent} onSelectCenter={nav.selectCenter} onNavigateToQuiz={() => navigate('quiz')} mode="subjectsOnly" onBack={() => navigate('home')} />;
        case 'home':
        default:
            return <HomeView subjects={data.allSubjects} teachers={data.allTeachers} centers={data.allCenters} slides={data.allSlides} notices={data.allNotices} diamondStudents={data.allDiamondStudents} allQuizzes={data.allQuizzes} allQuizSubmissions={data.allQuizSubmissions} onSelectSubject={nav.viewSubject} onSelectTeacher={nav.selectTeacher} onSelectDiamondStudent={nav.selectDiamondStudent} onSelectCenter={nav.selectCenter} onNavigateToQuiz={() => navigate('quiz')} />;
    }
}

export default ViewRouter;