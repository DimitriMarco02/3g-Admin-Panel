import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import type { Subject, Teacher, Center, DiamondStudent, ConfirmedBookingDetails } from '../../types';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

type View = string;

interface NavigationContextType {
    currentView: View;
    navigate: (view: View) => void;
    
    selectedSubject: Subject | null;
    bookingType: 'Trial' | 'Admission' | null;
    
    loginReturnView: 'studentLogin' | 'login';

    activeChatId: string | null;
    startBookingFlow: (subject: Subject, type: 'Trial' | 'Admission') => void;
    viewSubject: (subject: Subject) => void;
    selectTeacher: (teacher: Teacher) => void;
    selectCenter: (center: Center) => void;
    selectDiamondStudent: (student: DiamondStudent) => void;
    navigateToForgotPassword: (fromView: 'studentLogin' | 'login') => void;
    startNewBooking: () => void;
    
    bookingDetailsForConfirmation: ConfirmedBookingDetails | null;
    bookingForPaymentModal: Omit<ConfirmedBookingDetails, 'id'> | null;
    closePaymentModal: () => void;
    handleCompleteAdmissionPayment: (paymentDetails: NonNullable<ConfirmedBookingDetails['paymentDetails']>) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, currentTeacher } = useAuth();
    const { submitBooking } = useData();

    const [currentView, setCurrentView] = useState<View>('home');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [bookingType, setBookingType] = useState<'Trial' | 'Admission' | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
    const [selectedDiamondStudent, setSelectedDiamondStudent] = useState<DiamondStudent | null>(null);
    const [bookingDetailsForConfirmation, setBookingDetailsForConfirmation] = useState<ConfirmedBookingDetails | null>(null);
    const [bookingForPaymentModal, setBookingForPaymentModal] = useState<Omit<ConfirmedBookingDetails, 'id'> | null>(null);
    const [loginReturnView, setLoginReturnView] = useState<'studentLogin' | 'login'>('studentLogin');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    
    const isPoppingState = useRef(false);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            isPoppingState.current = true;
            setCurrentView(event.state?.view || 'home');
        };
        window.addEventListener('popstate', handlePopState);
        window.history.replaceState({ view: 'home' }, '');
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        if (isPoppingState.current) {
            isPoppingState.current = false;
            return;
        }
        if (window.history.state?.view !== currentView) {
            window.history.pushState({ view: currentView }, '');
        }
    }, [currentView]);

    const navigate = (view: View) => {
        if (view !== 'messages') setActiveChatId(null);
        if (view === 'home' || view === 'subjects') {
          setSelectedSubject(null);
          setBookingType(null);
          setSelectedTeacherId(null);
          setSelectedDiamondStudent(null);
          setSelectedCenterId(null);
        }

        const studentProtectedViews = ['bookings', 'profile', 'quiz', 'messages'];
        if (!(currentUser || currentTeacher) && studentProtectedViews.includes(view)) {
            setCurrentView('studentLogin');
            return;
        }
        if (view === 'teacherProfile' && !currentTeacher) {
            setCurrentView('login');
            return;
        }
        if (view === 'admin' && !currentUser?.isAdmin) {
            setCurrentView('login');
            return;
        }
        setCurrentView(view);
    };

    const startBookingFlow = (subject: Subject, type: 'Trial' | 'Admission') => {
        if (!currentUser) {
            navigate('studentLogin');
            return;
        }
        setSelectedSubject(subject);
        setBookingType(type);
        navigate('booking');
    };
    
    const viewSubject = (subject: Subject) => { setSelectedSubject(subject); navigate('subjectDetail'); }
    const selectTeacher = (teacher: Teacher) => { setSelectedTeacherId(teacher.id); navigate('teacherDetail'); }
    const selectCenter = (center: Center) => { setSelectedCenterId(center.id); navigate('centerDetail'); }
    const selectDiamondStudent = (student: DiamondStudent) => { setSelectedDiamondStudent(student); navigate('diamondStudentDetail'); };
    
    const navigateToForgotPassword = (fromView: 'studentLogin' | 'login') => {
        setLoginReturnView(fromView);
        navigate('forgotPassword');
    };

    const startNewBooking = () => {
        setSelectedSubject(null);
        setBookingType(null);
        setBookingDetailsForConfirmation(null);
        navigate('home');
    };
    
    const closePaymentModal = () => setBookingForPaymentModal(null);
    
    const handleCompleteAdmissionPayment = async (paymentDetails: NonNullable<ConfirmedBookingDetails['paymentDetails']>) => {
        if (!bookingForPaymentModal) return;
        const finalBookingData = { ...bookingForPaymentModal, paymentDetails, dateTime: Timestamp.fromDate(bookingForPaymentModal.dateTime) };
        await addDoc(collection(db, 'bookings'), finalBookingData);
        setBookingForPaymentModal(null);
        navigate('bookings');
    };


    const value = { 
        currentView, navigate, loginReturnView,
        selectedSubject, bookingType, selectedTeacherId, selectedCenterId, selectedDiamondStudent,
        activeChatId,
        startBookingFlow, viewSubject, selectTeacher, selectCenter, selectDiamondStudent, navigateToForgotPassword, startNewBooking,
        bookingDetailsForConfirmation, bookingForPaymentModal, closePaymentModal, handleCompleteAdmissionPayment,
        // Pass-through state for AppRouter
        _internal: {
            setSelectedSubject, setBookingType, setBookingDetailsForConfirmation, setBookingForPaymentModal, setActiveChatId
        }
    };

    return <NavigationContext.Provider value={value as any}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};