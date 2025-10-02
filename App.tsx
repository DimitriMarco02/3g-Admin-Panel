
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import BookingForm from './components/BookingForm';
import Confirmation from './components/Confirmation';
import BottomNav from './components/BottomNav';
import TeachersView from './components/TeachersView';
import TeacherDetailView from './components/TeacherDetailView';
import BookingsList from './components/BookingsList';
import Login from './components/Login';
import AdminView from './components/AdminView';
import StudentLogin from './components/StudentLogin';
import Signup from './components/Signup';
import AdmissionForm from './components/AdmissionForm';
import HomeView from './components/HomeView';
import DiamondStudentDetailView from './components/DiamondStudentDetailView';
import Sidebar from './components/Sidebar'; // Import Sidebar
import ProfileView from './components/ProfileView'; // Import ProfileView
import type { Subject, Teacher, Center, User, BookingDetails, ConfirmedBookingDetails, Review, OfferSlide, Notice, DiamondStudent } from './types';

// jsPDF declaration for TypeScript
declare const jspdf: any;

// Mock data for initial seeding
const initialSubjectsData: Subject[] = [
    { id: 1, name: 'Physics', description: 'Explore the laws of the universe from quantum mechanics to cosmology.', imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Chemistry', description: 'Dive into the world of atoms, molecules, and chemical reactions.', imageUrl: 'https://images.unsplash.com/photo-1554475901-45389631c59b?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Mathematics', description: 'Master the language of numbers, patterns, and logic.', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800' },
    { id: 4, name: 'Biology', description: 'Discover the intricate systems of life and living organisms.', imageUrl: 'https://images.unsplash.com/photo-1530026405182-271453968e9c?auto=format&fit=crop&q=80&w=800' },
];

const initialTeachersData: Teacher[] = [
    { 
        id: 1, 
        name: 'Dr. Evelyn Reed', 
        phone: '555-0101',
        subjectId: 1, 
        centerIds: [1, 3], 
        imageUrl: 'https://images.unsplash.com/photo-1580894908361-967195033215?auto=format&fit=crop&q=80&w=800', 
        bannerUrl: 'https://images.unsplash.com/photo-1576495199011-b6a7112b3a5a?auto=format&fit=crop&q=80&w=1600',
        bio: 'With a PhD in Astrophysics from MIT, Dr. Reed has over 10 years of experience making complex physics concepts accessible and exciting. She is a published researcher in the field of quantum mechanics.', 
        schedule: [{ day: 'Monday', times: ['15:00', '16:00'] }, { day: 'Wednesday', times: ['15:00', '17:00'] }, { day: 'Friday', times: ['14:00'] }],
        experience: [
            { id: 1, role: 'Senior Physics Lecturer', company: 'North Campus', duration: '2018 - Present' },
            { id: 2, role: 'Postdoctoral Researcher', company: 'MIT', duration: '2015 - 2018' },
        ],
        education: [
            { id: 1, degree: 'Ph.D. in Astrophysics', institution: 'Massachusetts Institute of Technology', year: '2015' },
            { id: 2, degree: 'B.Sc. in Physics', institution: 'Caltech', year: '2011' },
        ],
        reviews: [
            { id: 1, reviewerName: 'John Doe', rating: 5, comment: 'Dr. Reed is an amazing teacher! She makes physics so easy to understand.' },
        ],
    },
    { 
        id: 2, 
        name: 'Mr. David Chen', 
        phone: '555-0102',
        subjectId: 3, 
        centerIds: [2], 
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&q=80&w=1600',
        bio: 'A former software engineer at Google, Mr. Chen brings a practical, problem-solving approach to teaching mathematics. He specializes in preparing students for competitive exams.', 
        schedule: [{ day: 'Tuesday', times: ['16:00', '17:00'] }, { day: 'Thursday', times: ['16:00', '17:00', '18:00'] }],
        experience: [
            { id: 1, role: 'Mathematics Instructor', company: 'Downtown Center', duration: '2019 - Present' },
            { id: 2, role: 'Software Engineer', company: 'Google', duration: '2015 - 2019' },
        ],
        education: [
            { id: 1, degree: 'M.S. in Computer Science', institution: 'Stanford University', year: '2015' },
        ],
        reviews: [],
    },
    { 
        id: 3, 
        name: 'Ms. Maria Garcia', 
        phone: '555-0103',
        subjectId: 2, 
        centerIds: [1, 2], 
        imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1628858239999-c5b765b6a71d?auto=format&fit=crop&q=80&w=1600',
        bio: 'Ms. Garcia specializes in organic chemistry and is passionate about hands-on laboratory experiments. She has won multiple awards for her innovative teaching methods.', 
        schedule: [{ day: 'Monday', times: ['17:00'] }, { day: 'Wednesday', times: ['16:00'] }, { day: 'Friday', times: ['16:00', '17:00'] }],
        experience: [],
        education: [],
        reviews: [],
    },
    { 
        id: 4, 
        name: 'Dr. Samuel Jones',
        phone: '555-0104',
        subjectId: 4, 
        centerIds: [3], 
        imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
        bannerUrl: 'https://images.unsplash.com/photo-1471943311424-644c3c23318c?auto=format&fit=crop&q=80&w=1600',
        bio: 'Dr. Jones is a field biologist who brings real-world examples from his research in the Amazon rainforest into his lessons on genetics and ecology.', 
        schedule: [{ day: 'Tuesday', times: ['15:00', '18:00'] }, { day: 'Thursday', times: ['15:00'] }],
        experience: [],
        education: [],
        reviews: [],
    },
];

const initialCentersData: Center[] = [
    { id: 1, name: 'North Campus', location: '123 University Ave', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Downtown Center', location: '456 Main St', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Westside Hub', location: '789 Ocean Blvd', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
];

const initialUsersData: User[] = [
    { id: 1, name: 'Ryn', username: 'Ryn', password: '123', isAdmin: true, phone: '01234567890', address: 'Admin Address' },
    { id: 2, name: 'John Doe', username: 'john', password: '123', phone: '09876543210', address: '123 Oak Street' },
]

const initialSlidesData: OfferSlide[] = [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1580894732444-84cf4496497b?auto=format&fit=crop&q=80&w=1200', title: 'Special Discount on Physics', description: 'Enroll now and get 20% off on all Physics trial classes.' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1518133910556-538c924115b0?auto=format&fit=crop&q=80&w=1200', title: 'New Chemistry Batch', description: 'Join our new batch starting next month and get exclusive study material.' },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1632571401012-353d2d2a45f1?auto=format&fit=crop&q=80&w=1200', title: 'Mathematics Olympiad Prep', description: 'Specialized training for upcoming national and international math competitions.' },
];

const initialNoticesData: Notice[] = [
    { id: 1, text: 'The Downtown Center will be closed for maintenance on the 25th of this month.' },
    { id: 2, text: 'New A-Level Biology classes are starting from the 1st of next month.' },
    { id: 3, text: 'Parent-teacher meetings are scheduled for the last Saturday of this month.' },
];

const initialDiamondStudentsData: DiamondStudent[] = [
    {
        id: 1,
        name: 'Alice Johnson',
        imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=800',
        level: 'A Level',
        achievementYear: '2023',
        achievementDetails: 'Alice achieved top marks in the country for Physics and has been accepted into Cambridge University to study Natural Sciences. Her dedication and passion for science are an inspiration to all.',
        results: [
            { id: 1, subject: 'Physics', grade: 'A*' },
            { id: 2, subject: 'Chemistry', grade: 'A*' },
            { id: 3, subject: 'Mathematics', grade: 'A' },
        ]
    },
    {
        id: 2,
        name: 'Bob Williams',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
        level: 'O Level',
        achievementYear: '2023',
        achievementDetails: 'Bob demonstrated exceptional ability across a wide range of subjects, securing A* grades in all three sciences as well as Mathematics and Computer Science. He is now pursuing his A Levels at our North Campus.',
        results: [
            { id: 1, subject: 'Physics', grade: 'A*' },
            { id: 2, subject: 'Chemistry', grade: 'A*' },
            { id: 3, subject: 'Biology', grade: 'A*' },
            { id: 4, subject: 'Mathematics', grade: 'A*' },
            { id: 5, subject: 'Computer Science', grade: 'A*' },
            { id: 6, subject: 'English Language', grade: 'A' },
        ]
    }
];

// Custom hook for localStorage persistence
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};


const App: React.FC = () => {
    const defaultLogoSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23f59e0b'><path d='M10.394 2.08a1 1 0 00-.788 0l-7 3.5a1 1 0 00.02 1.84l7 3.5a1 1 0 00.748 0l7-3.5a1 1 0 00.02-1.84l-7-3.5zM3 9.363l7 3.5v5.308l-7-3.5V9.363zM17 9.363v5.308l-7 3.5V12.863l7-3.5z' /></svg>`;
    const defaultLogoUrl = `data:image/svg+xml,${defaultLogoSvg}`;

    const [logoUrl, setLogoUrl] = useLocalStorage<string>('logoUrl', defaultLogoUrl);
    const [allSubjects, setAllSubjects] = useLocalStorage<Subject[]>('subjects', initialSubjectsData);
    const [allTeachers, setAllTeachers] = useLocalStorage<Teacher[]>('teachers', initialTeachersData);
    const [allCenters, setAllCenters] = useLocalStorage<Center[]>('centers', initialCentersData);
    const [allUsers, setAllUsers] = useLocalStorage<User[]>('users', initialUsersData);
    const [bookingsFromStorage, setBookingsInStorage] = useLocalStorage<ConfirmedBookingDetails[]>('bookings', []);
    const [allSlides, setAllSlides] = useLocalStorage<OfferSlide[]>('slides', initialSlidesData);
    const [allNotices, setAllNotices] = useLocalStorage<Notice[]>('notices', initialNoticesData);
    const [allDiamondStudents, setAllDiamondStudents] = useLocalStorage<DiamondStudent[]>('diamondStudents', initialDiamondStudentsData);
    
    // Re-hydrate dates from localStorage strings
    const allBookings = useMemo(() => 
        bookingsFromStorage.map(b => ({...b, dateTime: new Date(b.dateTime)})
    ), [bookingsFromStorage]);


    const [currentView, setCurrentView] = useState('home');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [selectedDiamondStudent, setSelectedDiamondStudent] = useState<DiamondStudent | null>(null);
    const [bookingDetailsForConfirmation, setBookingDetailsForConfirmation] = useState<ConfirmedBookingDetails | null>(null);
    const [bookingsForAdmission, setBookingsForAdmission] = useState<ConfirmedBookingDetails[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogin = (username: string, password: string): boolean => {
        const user = allUsers.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            setCurrentView(user.isAdmin ? 'admin' : 'home');
            return true;
        }
        return false;
    }
    
    const handleAdminLoginSuccess = () => {
        const adminUser = allUsers.find(u => u.isAdmin);
        setCurrentUser(adminUser || null);
        setCurrentView('admin');
    }

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('home');
    };
    
    const handleSignup = (newUser: Omit<User, 'id'>): boolean => {
        if(allUsers.some(u => u.username === newUser.username)) {
            return false;
        }
        const userWithId: User = { ...newUser, id: Date.now() };
        setAllUsers(prev => [...prev, userWithId]);
        setCurrentUser(userWithId);
        setCurrentView('home');
        return true;
    }
    
    const handleNavigate = (view: string) => {
        if (view === 'home' || view === 'subjects') {
          setSelectedSubject(null);
          setSelectedTeacher(null);
          setSelectedDiamondStudent(null);
        }

        const studentProtectedViews = ['bookings', 'profile'];
        if (!currentUser && studentProtectedViews.includes(view)) {
            setCurrentView('studentLogin');
            return;
        }

        if (view === 'admin') {
            if (currentUser?.isAdmin) {
                setCurrentView('admin');
            } else {
                setCurrentView('login');
            }
            return;
        }
        setCurrentView(view);
    };

    const handleSubjectSelect = (subject: Subject) => {
        if (!currentUser) {
            setCurrentView('studentLogin');
            return;
        }
        setSelectedSubject(subject);
        setCurrentView('booking');
    };
    
    const handleTeacherSelect = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setCurrentView('teacherDetail');
    }

    const handleSelectDiamondStudent = (student: DiamondStudent) => {
        setSelectedDiamondStudent(student);
        setCurrentView('diamondStudentDetail');
    };

    const handleBookingSubmit = (details: BookingDetails) => {
        if (!currentUser || !selectedSubject) return;

        const teacher = allTeachers.find(t => t.id === details.teacherId);
        const center = allCenters.find(c => c.id === details.centerId);
        if (!teacher || !center) return;

        const newBooking: ConfirmedBookingDetails = {
            id: Date.now(),
            userId: currentUser.id,
            studentName: currentUser.name,
            phone: currentUser.phone,
            subject: selectedSubject,
            teacher,
            center,
            dateTime: new Date(`${details.date}T${details.time}`),
            curriculum: details.curriculum,
            classLevel: details.classLevel,
            status: 'Booked',
        };

        setBookingsInStorage(prev => [...prev, newBooking]);
        setBookingDetailsForConfirmation(newBooking);
        setCurrentView('confirmation');
    };
    
    const handleNewBooking = () => {
        setSelectedSubject(null);
        setBookingDetailsForConfirmation(null);
        setCurrentView('home');
    }
    
    const handleTakeAdmission = (booking: ConfirmedBookingDetails) => {
        setBookingsForAdmission([booking]);
        setCurrentView('admission');
    }

    const handleTakeAdmissionForAll = (bookings: ConfirmedBookingDetails[]) => {
        setBookingsForAdmission(bookings);
        setCurrentView('admission');
    }

    const handleAdmissionSubmit = (paymentDetails: any) => {
        const admissionIds = bookingsForAdmission.map(b => b.id);
        setBookingsInStorage(prev => prev.map(b => 
            admissionIds.includes(b.id) 
            ? { ...b, status: 'Pending Admission', paymentDetails } 
            : b
        ));
        setBookingsForAdmission([]);
        setCurrentView('bookings');
    }
    
    const handleDownloadReceipt = (booking: ConfirmedBookingDetails) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('3G Admin Panel', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Admission Receipt', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
        
        // Prepare data for the table
        const tableData = [
            ['Booking ID', booking.id.toString()],
            ['Student Name', booking.studentName],
            ['Subject', booking.subject.name],
            ['Teacher', booking.teacher.name],
            ['Center', booking.center.name],
            ['Date & Time', booking.dateTime.toLocaleString()],
            ['Curriculum', booking.curriculum],
            ['Class Level', booking.classLevel],
            ['Status', booking.status],
            ['Payment Method', booking.paymentDetails?.paymentMethod || 'N/A'],
        ];

        if (booking.paymentDetails?.paymentMethod === 'Bkash') {
            tableData.push(['Bkash Number', booking.paymentDetails.bkashNumber || 'N/A']);
            tableData.push(['Transaction ID', booking.paymentDetails.transactionId || 'N/A']);
        }

        // Create table
        doc.autoTable({
            startY: 40,
            head: [['Detail', 'Information']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }, // Blue color
            columnStyles: {
                0: { fontStyle: 'bold' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFontSize(10);
        doc.text('Thank you for your admission!', 14, finalY + 10);

        // Save the PDF
        doc.save(`admission-receipt-${booking.id}.pdf`);
    };

    const handleUpdateUser = (updatedUser: User) => {
        setAllUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
        setCurrentUser(prev => prev ? { ...prev, ...updatedUser } : null);
    };

    const handleUpdatePassword = (userId: number, currentPass: string, newPass: string): { success: boolean; message: string } => {
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'User not found.' };
        }
        const user = allUsers[userIndex];
        if (user.password !== currentPass) {
            return { success: false, message: 'Current password does not match.' };
        }
        const updatedUser = { ...user, password: newPass };
        const newUsers = [...allUsers];
        newUsers[userIndex] = updatedUser;
        setAllUsers(newUsers);
        return { success: true, message: 'Password updated successfully!' };
    };


    // --- CRUD Handlers for Admin ---
    const handleAddSubject = (subject: Omit<Subject, 'id'>) => setAllSubjects(prev => [...prev, { ...subject, id: Date.now() }]);
    const handleUpdateSubject = (updatedSubject: Subject) => setAllSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    const handleDeleteSubject = (id: number) => {
        if (allTeachers.some(t => t.subjectId === id)) {
            // alert('Cannot delete subject. It is currently assigned to one or more teachers.');
            return;
        }
        setAllSubjects(prev => prev.filter(s => s.id !== id));
    };

    const handleAddTeacher = (teacher: Omit<Teacher, 'id'>) => setAllTeachers(prev => [{ ...teacher, id: Date.now() }, ...prev]);
    const handleUpdateTeacher = (updatedTeacher: Teacher) => setAllTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
    const handleDeleteTeacher = (id: number) => setAllTeachers(prev => prev.filter(t => t.id !== id));

    const handleAddCenter = (center: Omit<Center, 'id'>) => setAllCenters(prev => [...prev, { ...center, id: Date.now() }]);
    const handleUpdateCenter = (updatedCenter: Center) => setAllCenters(prev => prev.map(c => c.id === updatedCenter.id ? updatedCenter : c));
    const handleDeleteCenter = (id: number) => {
         if (allTeachers.some(t => t.centerIds.includes(id))) {
            // alert('Cannot delete center. It is currently assigned to one or more teachers.');
            return;
        }
        setAllCenters(prev => prev.filter(c => c.id !== id));
    };

    const handleUpdateBooking = (updatedBooking: ConfirmedBookingDetails) => {
        setBookingsInStorage(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    }
    const handleDeleteBooking = (id: number) => setBookingsInStorage(prev => prev.filter(b => b.id !== id));
    
    const handleUpdateBookingStatus = (bookingId: number, status: ConfirmedBookingDetails['status']) => {
        const bookingIndex = bookingsFromStorage.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            const newBookings = [...bookingsFromStorage];
            newBookings[bookingIndex] = { ...newBookings[bookingIndex], status };
            setBookingsInStorage(newBookings);
        }
    };
    
    // Home Management Handlers
    const handleUpdateLogoUrl = (url: string) => {
        if (url.trim()) {
            setLogoUrl(url);
        } else {
            setLogoUrl(defaultLogoUrl);
        }
    };
    const handleAddSlide = (slide: Omit<OfferSlide, 'id'>) => setAllSlides(prev => [...prev, { ...slide, id: Date.now() }]);
    const handleUpdateSlide = (updatedSlide: OfferSlide) => setAllSlides(prev => prev.map(s => s.id === updatedSlide.id ? updatedSlide : s));
    const handleDeleteSlide = (id: number) => setAllSlides(prev => prev.filter(s => s.id !== id));
    
    const handleAddNotice = (notice: Omit<Notice, 'id'>) => setAllNotices(prev => [{ ...notice, id: Date.now() }, ...prev]);
    const handleUpdateNotice = (updatedNotice: Notice) => setAllNotices(prev => prev.map(n => n.id === updatedNotice.id ? updatedNotice : n));
    const handleDeleteNotice = (id: number) => setAllNotices(prev => prev.filter(n => n.id !== id));

    // Diamond Student Handlers
    const handleAddDiamondStudent = (student: Omit<DiamondStudent, 'id'>) => setAllDiamondStudents(prev => [...prev, { ...student, id: Date.now() }]);
    const handleUpdateDiamondStudent = (updatedStudent: DiamondStudent) => setAllDiamondStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    const handleDeleteDiamondStudent = (id: number) => setAllDiamondStudents(prev => prev.filter(s => s.id !== id));


    const handleAddReview = (teacherId: number, review: Omit<Review, 'id'>) => {
        setAllTeachers(prevTeachers => 
            prevTeachers.map(teacher => {
                if (teacher.id === teacherId) {
                    const newReview = { ...review, id: Date.now() };
                    return { ...teacher, reviews: [...teacher.reviews, newReview] };
                }
                return teacher;
            })
        );
    };


    const renderView = () => {
        switch (currentView) {
            case 'booking':
                return selectedSubject && currentUser && <BookingForm subject={selectedSubject} currentUser={currentUser} allTeachers={allTeachers} allCenters={allCenters} onSubmit={handleBookingSubmit} onBack={() => handleNavigate('subjects')} />;
            case 'confirmation':
                return bookingDetailsForConfirmation && <Confirmation bookingDetails={bookingDetailsForConfirmation} onNewBooking={handleNewBooking} />;
            case 'login':
                return <Login onLoginSuccess={handleAdminLoginSuccess} />;
            case 'studentLogin':
                return <StudentLogin onLogin={handleLogin} onNavigateToSignup={() => setCurrentView('signup')} />;
            case 'signup':
                return <Signup onSignup={handleSignup} onNavigateToLogin={() => setCurrentView('studentLogin')} />;
            case 'teachers':
                return <TeachersView teachers={allTeachers} subjects={allSubjects} centers={allCenters} onSelectTeacher={handleTeacherSelect} />;
            case 'teacherDetail':
                const subject = allSubjects.find(s => s.id === selectedTeacher?.subjectId);
                return selectedTeacher && subject ? <TeacherDetailView teacher={selectedTeacher} subject={subject} allCenters={allCenters} currentUser={currentUser} onBack={() => handleNavigate('teachers')} onBook={handleSubjectSelect} onAddReview={handleAddReview}/> : <div>Teacher not found</div>;
            case 'diamondStudentDetail':
                return selectedDiamondStudent && <DiamondStudentDetailView student={selectedDiamondStudent} onBack={() => handleNavigate('home')} />;
            case 'bookings':
                return <BookingsList allBookings={allBookings} currentUser={currentUser} onTakeAdmission={handleTakeAdmission} onTakeAdmissionForAll={handleTakeAdmissionForAll} onDownloadReceipt={handleDownloadReceipt} onUpdateBookingStatus={handleUpdateBookingStatus} />;
            case 'profile':
                return currentUser && <ProfileView currentUser={currentUser} onUpdateUser={handleUpdateUser} onUpdatePassword={handleUpdatePassword} onBack={() => handleNavigate('home')} />;
            case 'admin':
                return currentUser?.isAdmin ? (
                    <AdminView 
                        logoUrl={logoUrl}
                        allBookings={allBookings}
                        allSubjects={allSubjects}
                        allTeachers={allTeachers}
                        allCenters={allCenters}
                        allUsers={allUsers}
                        allSlides={allSlides}
                        allNotices={allNotices}
                        allDiamondStudents={allDiamondStudents}
                        onUpdateBooking={handleUpdateBooking}
                        onDeleteBooking={handleDeleteBooking}
                        onUpdateBookingStatus={handleUpdateBookingStatus}
                        onAddSubject={handleAddSubject}
                        onUpdateSubject={handleUpdateSubject}
                        onDeleteSubject={handleDeleteSubject}
                        onAddTeacher={handleAddTeacher}
                        onUpdateTeacher={handleUpdateTeacher}
                        onDeleteTeacher={handleDeleteTeacher}
                        onAddCenter={handleAddCenter}
                        onUpdateCenter={handleUpdateCenter}
                        onDeleteCenter={handleDeleteCenter}
                        onUpdateLogoUrl={handleUpdateLogoUrl}
                        onAddSlide={handleAddSlide}
                        onUpdateSlide={handleUpdateSlide}
                        onDeleteSlide={handleDeleteSlide}
                        onAddNotice={handleAddNotice}
                        onUpdateNotice={handleUpdateNotice}
                        onDeleteNotice={handleDeleteNotice}
                        onAddDiamondStudent={handleAddDiamondStudent}
                        onUpdateDiamondStudent={handleUpdateDiamondStudent}
                        onDeleteDiamondStudent={handleDeleteDiamondStudent}
                    />
                ) : <Login onLoginSuccess={handleAdminLoginSuccess} />;
            case 'admission':
                return <AdmissionForm bookings={bookingsForAdmission} onSubmit={handleAdmissionSubmit} onBack={() => setCurrentView('bookings')} />;
            case 'subjects':
                 return (
                    <HomeView
                        subjects={allSubjects}
                        teachers={allTeachers}
                        centers={allCenters}
                        slides={allSlides}
                        notices={allNotices}
                        diamondStudents={allDiamondStudents}
                        onSelectSubject={handleSubjectSelect}
                        onSelectTeacher={handleTeacherSelect}
                        onSelectDiamondStudent={handleSelectDiamondStudent}
                        mode="subjectsOnly"
                    />
                );
            case 'home':
            default:
                return (
                    <HomeView
                        subjects={allSubjects}
                        teachers={allTeachers}
                        centers={allCenters}
                        slides={allSlides}
                        notices={allNotices}
                        diamondStudents={allDiamondStudents}
                        onSelectSubject={handleSubjectSelect}
                        onSelectTeacher={handleTeacherSelect}
                        onSelectDiamondStudent={handleSelectDiamondStudent}
                    />
                );
        }
    };


    return (
        <div className="bg-slate-50 min-h-screen font-sans pb-40">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />
            <Header 
                logoUrl={logoUrl}
                currentUser={currentUser} 
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                onOpenSidebar={() => setIsSidebarOpen(true)}
            />
            <main className="max-w-4xl mx-auto py-8 sm:py-12 px-0 sm:px-0">
                {renderView()}
            </main>
            <BottomNav activeView={currentView} onNavigate={handleNavigate} />
        </div>
    );
};

export default App;
