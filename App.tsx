





import React, { useState, useEffect } from 'react';
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
import AdmissionPaymentModal from './components/AdmissionForm';
import HomeView from './components/HomeView';
import DiamondStudentDetailView from './components/DiamondStudentDetailView';
import CenterDetailView from './components/CenterDetailView';
import Sidebar from './components/Sidebar';
import ProfileView from './components/ProfileView';
import SubjectDetailView from './components/SubjectDetailView';
import ForgotPasswordView from './components/ForgotPasswordView';
import TeacherProfileView from './components/TeacherProfileView';
import QuizView from './components/QuizView';
import MessagesView from './components/MessagesView';
import type { Subject, Teacher, Center, User, BookingDetails, ConfirmedBookingDetails, Review, OfferSlide, Notice, DiamondStudent, ScheduleLevel, Enrollment, Payment, Batch, Quiz, QuizSubmission, Chat, ChatParticipantInfo } from './types';
import { CURRICULUMS } from './constants';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, Timestamp, writeBatch, setDoc, orderBy, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';


// jsPDF declaration for TypeScript
declare const jspdf: any;

const getScheduleKeyForClassLevel = (classLevel: string): ScheduleLevel | null => {
    if (classLevel === "O Level" || classLevel === "IGCSE") return 'O-Level';
    if (classLevel === "AS Level") return 'AS-Level';
    if (classLevel === "A2 Level") return 'A2';
    return null;
};

const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Moved transformers to top-level for broader access
const teacherTransformer = (data: any): Teacher => {
    return {
        ...(data as Omit<Teacher, 'subjectIds' | 'centerIds' | 'experience' | 'education' | 'reviews' | 'batches'>),
        subjectIds: Array.isArray(data.subjectIds) ? [...data.subjectIds] : [],
        centerIds: Array.isArray(data.centerIds) ? [...data.centerIds] : [],
        batches: Array.isArray(data.batches) ? data.batches.map((b: any) => ({ ...b })) : [],
        experience: Array.isArray(data.experience) ? data.experience.map((e: any) => ({ ...e })) : [],
        education: Array.isArray(data.education) ? data.education.map((e: any) => ({ ...e })) : [],
        reviews: Array.isArray(data.reviews) ? data.reviews.map((r: any) => ({ ...r })) : [],
        showOnHome: data.showOnHome || false,
    };
};

const bookingTransformer = (data: any): ConfirmedBookingDetails => {
    const plainData: any = { ...data };

    plainData.dateTime = data.dateTime && typeof data.dateTime.toDate === 'function'
        ? (data.dateTime as Timestamp).toDate()
        : new Date(0);
    
    plainData.bookingType = data.bookingType || 'Trial';

    if (data.batchId) plainData.batchId = data.batchId;
    if (data.batchName) plainData.batchName = data.batchName;
    if (data.days) plainData.days = data.days;
    if (data.time) plainData.time = data.time;

    plainData.subject = data.subject ? { ...data.subject } : { name: 'N/A' };
    plainData.center = data.center ? { ...data.center } : { name: 'N/A' };
    
    if (data.teacher) {
        plainData.teacher = teacherTransformer(data.teacher);
    } else {
        plainData.teacher = { name: 'N/A', centerIds: [], batches: [], experience: [], education: [], reviews: [], subjectIds: [] };
    }
    
    return plainData;
};


const App: React.FC = () => {
    const defaultLogoSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23f59e0b'><path d='M10.394 2.08a1 1 0 00-.788 0l-7 3.5a1 1 0 00.02 1.84l7 3.5a1 1 0 00.748 0l7-3.5a1 1 0 00.02-1.84l-7-3.5zM3 9.363l7 3.5v5.308l-7-3.5V9.363zM17 9.363v5.308l-7 3.5V12.863l7-3.5z' /></svg>`;
    const defaultLogoUrl = `data:image/svg+xml,${defaultLogoSvg}`;

    const [logoUrl, setLogoUrl] = useState<string>(defaultLogoUrl);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [allCenters, setAllCenters] = useState<Center[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allBookings, setAllBookings] = useState<ConfirmedBookingDetails[]>([]);
    const [allSlides, setAllSlides] = useState<OfferSlide[]>([]);
    const [allNotices, setAllNotices] = useState<Notice[]>([]);
    const [allDiamondStudents, setAllDiamondStudents] = useState<DiamondStudent[]>([]);
    const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
    const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmission[]>([]);
    
    const [currentView, setCurrentView] = useState('home');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginReturnView, setLoginReturnView] = useState<'studentLogin' | 'login'>('studentLogin');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const { uid } = user;
                
                // 1. Check if Admin
                const userDocRef = doc(db, 'users', uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setCurrentUser({ id: uid, ...userDocSnap.data() } as User);
                    setCurrentTeacher(null);
                } else {
                    // 2. Check if Teacher via UID mapping
                    const teacherUidMapRef = doc(db, 'teacher_uids', uid);
                    const teacherUidMapSnap = await getDoc(teacherUidMapRef);
    
                    if (teacherUidMapSnap.exists()) {
                        const teacherDocId = teacherUidMapSnap.data().teacherDocId;
                        const teacherDocRef = doc(db, 'teachers', teacherDocId);
                        const teacherDocSnap = await getDoc(teacherDocRef);
    
                        if (teacherDocSnap.exists()) {
                            setCurrentTeacher({ id: teacherDocSnap.id, ...teacherDocSnap.data() } as Teacher);
                            setCurrentUser(null);
                        } else {
                             // Mapping exists but profile doc doesn't? Error case.
                             console.error("Teacher UID mapping exists but profile document is missing.");
                             await signOut(auth);
                        }
                    } else if (userDocSnap.exists()) {
                         // 3. Must be a Student
                        setCurrentUser({ id: uid, ...userDocSnap.data() } as User);
                        setCurrentTeacher(null);
                    } else {
                        console.error("User exists in Auth but not in any recognized collection. Logging out.");
                        await signOut(auth);
                        setCurrentUser(null);
                        setCurrentTeacher(null);
                    }
                }
            } else {
                // User is signed out
                setCurrentUser(null);
                setCurrentTeacher(null);
            }
            setAuthLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);


    useEffect(() => {
        const createPublicSubscription = <T extends { id: string; createdAt?: Date }>(
            collectionName: string,
            setData: React.Dispatch<React.SetStateAction<T[]>>,
            options: { transform?: (data: any) => any; orderByField?: string; orderByDir?: 'asc' | 'desc' } = {}
          ) => {
            const { transform } = options;
            const collRef = collection(db, collectionName);
            const q = query(collRef, orderBy(options.orderByField || "createdAt", options.orderByDir || "desc"));
        
            return onSnapshot(q, (snapshot) => {
              const dataList = snapshot.docs.map(d => {
                try {
                  const data = d.data();
                  const transformedData = {
                    ...data,
                    id: d.id,
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0)
                  };
                  return transform ? transform(transformedData) : (transformedData as T);
                } catch (e) {
                  console.error(`Failed to transform document ${d.id} in ${collectionName}:`, d.data(), e);
                  return null;
                }
              }).filter(Boolean) as T[];
      
              setData(dataList);
            }, (error) => {
              console.error(`Error fetching ${collectionName}:`, error);
            });
          };
      
        // Subscriptions for public data, always active
        const publicSubscriptions = [
            createPublicSubscription<Subject>('subjects', setAllSubjects, {orderByField: 'name', orderByDir: 'asc'}),
            createPublicSubscription<Teacher>('teachers', setAllTeachers, { transform: teacherTransformer }),
            createPublicSubscription<Center>('centers', setAllCenters, {orderByField: 'name', orderByDir: 'asc'}),
            createPublicSubscription<OfferSlide>('slides', setAllSlides, {orderByField: 'title', orderByDir: 'asc'}),
            createPublicSubscription<DiamondStudent>('diamondStudents', setAllDiamondStudents, {orderByField: 'achievementYear', orderByDir: 'desc'}),
            createPublicSubscription<Quiz>('quizzes', setAllQuizzes),
            onSnapshot(collection(db, "quizSubmissions"), (snapshot) => {
                const subs = snapshot.docs.map(d => ({...d.data(), id: d.id, submittedAt: d.data().submittedAt.toDate() } as QuizSubmission));
                setAllQuizSubmissions(subs);
            }),
            onSnapshot(doc(db, "settings", "appConfig"), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    if (data.logoUrl) setLogoUrl(data.logoUrl);
                }
            }, (error) => {
                 console.error(`Error fetching settings:`, error);
            })
        ];

        const noticeQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"));
        const unsubNotices = onSnapshot(noticeQuery, (snapshot) => {
            const notices = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    ...data,
                    id: d.id,
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0)
                } as Notice;
            });
            setAllNotices(notices);
        });
        publicSubscriptions.push(unsubNotices);

        // --- Role-based subscriptions for private data ---
        if (authLoading) {
            return () => publicSubscriptions.forEach(unsub => unsub());
        }

        let privateSubscriptions: (() => void)[] = [];
        let paymentSubscribers: (() => void)[] = [];

        const enrollmentTransformer = (data: any) => ({
            ...data,
            id: data.id,
            startDate: data.startDate ? (data.startDate as Timestamp).toDate() : new Date(0),
            days: Array.isArray(data.days) ? data.days : [],
        });
        const paymentTransformer = (data: any) => ({
            ...data,
            id: data.id,
            paymentDate: data.paymentDate ? (data.paymentDate as Timestamp).toDate() : new Date(0),
            status: data.status || 'confirmed',
        });

        if (currentUser) {
            let usersQuery = query(collection(db, 'users'));
            let bookingsQuery = query(collection(db, 'bookings'));
            let enrollmentsQuery = query(collection(db, 'enrollments'));
            let paymentsQuery = query(collection(db, 'payments'));
            
            // If it's a student, filter queries to only their data
            if (!currentUser.isAdmin) {
                bookingsQuery = query(collection(db, 'bookings'), where('userId', '==', currentUser.id));
                enrollmentsQuery = query(collection(db, 'enrollments'), where('userId', '==', currentUser.id));
                paymentsQuery = query(collection(db, 'payments'), where('userId', '==', currentUser.id));
                setAllUsers([currentUser]); // Student only needs their own user data
            } else {
                // Admin gets all user data
                const usersSub = onSnapshot(usersQuery, (snapshot) => {
                    const dataList = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
                    setAllUsers(dataList);
                });
                privateSubscriptions.push(usersSub);
            }

            const bookingsSub = onSnapshot(bookingsQuery, (snapshot) => {
                const dataList = snapshot.docs.map(d => bookingTransformer({ ...d.data(), id: d.id }));
                setAllBookings(dataList);
            });
            const enrollmentsSub = onSnapshot(enrollmentsQuery, (snapshot) => {
                const dataList = snapshot.docs.map(d => enrollmentTransformer({ ...d.data(), id: d.id }));
                setAllEnrollments(dataList);
            });
            const paymentsSub = onSnapshot(paymentsQuery, (snapshot) => {
                const dataList = snapshot.docs.map(d => paymentTransformer({ ...d.data(), id: d.id }));
                setAllPayments(dataList);
            });
            privateSubscriptions.push(bookingsSub, enrollmentsSub, paymentsSub);

        } else if (currentTeacher) {
            const enrollmentsQuery = query(collection(db, 'enrollments'), where('teacherId', '==', currentTeacher.id));
            const enrollmentsSub = onSnapshot(enrollmentsQuery, (snapshot) => {
                paymentSubscribers.forEach(unsub => unsub());
                paymentSubscribers = [];

                const enrollmentList = snapshot.docs.map(d => enrollmentTransformer({ ...d.data(), id: d.id }));
                setAllEnrollments(enrollmentList);
                
                if (enrollmentList.length > 0) {
                    const studentIds = [...new Set(enrollmentList.map(e => e.userId))];
                    const enrollmentIds = enrollmentList.map(e => e.id);

                    // Fetch associated students. Firestore 'in' queries are limited to 30 values.
                    if (studentIds.length > 0) {
                        const usersQuery = query(collection(db, 'users'), where('__name__', 'in', studentIds.slice(0, 30)));
                        const usersSub = onSnapshot(usersQuery, (userSnapshot) => {
                            const userList = userSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
                            setAllUsers(userList);
                        });
                        privateSubscriptions.push(usersSub);
                    } else {
                        setAllUsers([]);
                    }

                    // Fetch associated payments.
                    if (enrollmentIds.length > 0) {
                        const paymentsQuery = query(collection(db, 'payments'), where('enrollmentId', 'in', enrollmentIds.slice(0, 30)));
                        const paymentsSub = onSnapshot(paymentsQuery, (paymentSnapshot) => {
                            const paymentList = paymentSnapshot.docs.map(d => paymentTransformer({ ...d.data(), id: d.id }));
                            setAllPayments(paymentList);
                        });
                        paymentSubscribers.push(paymentsSub);
                    } else {
                         setAllPayments([]);
                    }
                } else {
                    setAllUsers([]);
                    setAllPayments([]);
                }
            });
            
            const bookingsQuery = query(collection(db, 'bookings'), where('teacher.id', '==', currentTeacher.id));
            const bookingsSub = onSnapshot(bookingsQuery, snapshot => {
                const dataList = snapshot.docs.map(d => bookingTransformer({ ...d.data(), id: d.id }));
                setAllBookings(dataList);
            });

            privateSubscriptions.push(enrollmentsSub, bookingsSub);
        } else {
            // Logged out
            setAllUsers([]);
            setAllBookings([]);
            setAllEnrollments([]);
            setAllPayments([]);
        }

        return () => {
            publicSubscriptions.forEach(unsub => unsub());
            privateSubscriptions.forEach(unsub => unsub());
            paymentSubscribers.forEach(unsub => unsub());
        };
    }, [authLoading, currentUser, currentTeacher]);

    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [bookingType, setBookingType] = useState<'Trial' | 'Admission' | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
    const [selectedDiamondStudent, setSelectedDiamondStudent] = useState<DiamondStudent | null>(null);
    const [bookingDetailsForConfirmation, setBookingDetailsForConfirmation] = useState<ConfirmedBookingDetails | null>(null);
    const [bookingForPaymentModal, setBookingForPaymentModal] = useState<Omit<ConfirmedBookingDetails, 'id'> | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 1. Check if admin
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().isAdmin) {
                setCurrentView('admin');
                return true;
            }
            // 2. Check if teacher
            const teacherUidMapRef = doc(db, 'teacher_uids', user.uid);
            const teacherUidMapSnap = await getDoc(teacherUidMapRef);
            if (teacherUidMapSnap.exists()) {
                setCurrentView('teacherProfile');
                return true;
            }
            // 3. Assume student
            if (userDoc.exists()) {
                setCurrentView('home');
                return true;
            }
            
            // If user exists in Auth but has no profile, log them out.
            await signOut(auth);
            return false;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    }
    
    const handleLogout = async () => {
        await signOut(auth);
        setCurrentView('home');
    };
    
    const handleSignup = async (newUser: Omit<User, 'id'>): Promise<boolean> => {
        if (!newUser.email || !newUser.password) {
            console.error("Email and password are required for signup.");
            return false;
        }
        try {
            // Check if a pending teacher profile with this email already exists
            const teacherQuery = query(collection(db, "teachers"), where("email", "==", newUser.email), where("status", "==", "pending"));
            const teacherSnapshot = await getDocs(teacherQuery);
    
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
            const user = userCredential.user;
    
            if (!teacherSnapshot.empty) {
                // This is a teacher signing up. Link their auth account to the pre-made profile.
                const tempTeacherDoc = teacherSnapshot.docs[0];
                const tempTeacherId = tempTeacherDoc.id;
    
                const batch = writeBatch(db);
    
                // 1. Update the teacher doc with UID and set status to active
                const teacherRef = doc(db, "teachers", tempTeacherId);
                batch.update(teacherRef, { uid: user.uid, status: 'active' });
    
                // 2. Create the UID mapping doc for easy lookup
                const uidMapRef = doc(db, "teacher_uids", user.uid);
                batch.set(uidMapRef, { teacherDocId: tempTeacherId });
    
                await batch.commit();
                // onAuthStateChanged will handle setting the currentTeacher state and view
            } else {
                // This is a regular student signup
                const { password, ...profileData } = newUser; // Don't store password in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    ...profileData,
                    isAdmin: false, // Ensure new signups are not admins
                });
                setCurrentView('home');
            }
            return true;
        } catch (error: any) {
             if (error.code === 'auth/email-already-in-use') {
                return false; // Let the UI know the email is taken
            }
            console.error("Signup failed:", error);
            return false;
        }
    }
    
    const handleNavigate = (view: string) => {
        if (view !== 'messages') {
            setActiveChatId(null);
        }
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

    const handleNavigateToForgotPassword = (fromView: 'studentLogin' | 'login') => {
        setLoginReturnView(fromView);
        setCurrentView('forgotPassword');
    }

    const handlePasswordResetRequest = async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: "Password reset email sent! Please check your inbox (and spam folder)." };
        } catch (error: any) {
            console.error("Password reset failed:", error);
            let message = "An error occurred. Please try again.";
             // To prevent user enumeration, it's often better to show a generic success message.
             // However, for this app, providing direct feedback might be better UX.
            if (error.code === 'auth/user-not-found') {
                message = "No user found with this email address.";
            }
            return { success: false, message };
        }
    };

    const handleStartBookingFlow = (subject: Subject, type: 'Trial' | 'Admission') => {
        if (!currentUser) {
            setCurrentView('studentLogin');
            return;
        }
        setSelectedSubject(subject);
        setBookingType(type);
        setCurrentView('booking');
    };

    const handleStartChat = async (partner: User | Teacher) => {
        const currentUserRef = currentUser || currentTeacher;
        if (!currentUserRef) {
            handleNavigate('studentLogin');
            return;
        }
    
        const currentUserId = currentTeacher?.uid || currentUser?.id;
        if (!currentUserId) {
            console.error("Could not determine current user's ID for chat.");
            return;
        }
        const partnerId = 'uid' in partner ? partner.uid : partner.id;
        if (!partnerId) {
            console.error("Could not determine partner's ID for chat.");
            return;
        }

        const chatId = [currentUserId, partnerId].sort().join('_');
    
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
    
        if (!chatSnap.exists()) {
            const partnerType = 'bio' in partner ? 'teacher' : 'student';

            const currentUserInfo = {
                name: currentUserRef.name,
                imageUrl: (currentUserRef as any).imageUrl || '',
                type: currentTeacher ? 'teacher' : 'student' as 'teacher' | 'student',
            };
            const partnerInfo = {
                name: partner.name,
                imageUrl: partner.imageUrl || '',
                type: partnerType,
            };
            
            await setDoc(chatRef, {
                type: 'private',
                participants: [currentUserId, partnerId],
                participantInfo: {
                    [currentUserId]: currentUserInfo,
                    [partnerId]: partnerInfo,
                },
                lastMessageTimestamp: Timestamp.now(),
            });
        }
        
        setActiveChatId(chatId);
        handleNavigate('messages');
    };

    const handleCreateGroupChat = async (groupName: string, students: User[]) => {
        if (!currentTeacher || !currentTeacher.uid) {
            console.error("Teacher not logged in or UID missing.");
            return;
        }

        const participantUsers: (User | Teacher)[] = [currentTeacher, ...students];
        const participantIds = participantUsers.map(p => 'uid' in p ? p.uid! : p.id).filter(id => id);
        
        if (participantIds.length < 2) {
            alert("Not enough participants to create a group.");
            return;
        }

        const participantInfo: { [key: string]: ChatParticipantInfo } = {};
        participantUsers.forEach(p => {
            const id = ('uid' in p && p.uid) ? p.uid : p.id;
            if (id) {
                participantInfo[id] = {
                    name: p.name,
                    imageUrl: p.imageUrl || '',
                    type: 'uid' in p ? 'teacher' : 'student',
                };
            }
        });

        const newChatData: Omit<Chat, 'id'> = {
            type: 'group',
            groupName,
            ownerId: currentTeacher.uid,
            participants: participantIds,
            participantInfo,
            lastMessageTimestamp: Timestamp.now(), // To make it appear first
        };
        
        const newChatRef = await addDoc(collection(db, 'chats'), newChatData);
        setActiveChatId(newChatRef.id);
        handleNavigate('messages');
    };


    const handleViewSubject = (subject: Subject) => {
        setSelectedSubject(subject);
        setCurrentView('subjectDetail');
    }
    
    const handleTeacherSelect = (teacher: Teacher) => {
        setSelectedTeacherId(teacher.id);
        setCurrentView('teacherDetail');
    }
    
    const handleCenterSelect = (center: Center) => {
        setSelectedCenterId(center.id);
        setCurrentView('centerDetail');
    }

    const handleSelectDiamondStudent = (student: DiamondStudent) => {
        setSelectedDiamondStudent(student);
        setCurrentView('diamondStudentDetail');
    };

    const handleBookingSubmit = async (details: BookingDetails) => {
        if (!currentUser || !selectedSubject || !bookingType) return;
    
        const teacher = allTeachers.find(t => t.id === details.teacherId);
        const center = allCenters.find(c => c.id === details.centerId);
        if (!teacher || !center) return;
    
        let batchDetails = {};
        if (bookingType === 'Admission' && details.batchId) {
            const batch = teacher.batches.find(b => b.id === details.batchId);
            if (batch) {
                batchDetails = {
                    batchId: batch.id,
                    batchName: batch.batchName,
                    days: batch.days,
                    time: details.time,
                };
            }
        }
    
        const newBookingData: Omit<ConfirmedBookingDetails, 'id'> = {
            userId: currentUser.id,
            studentName: currentUser.name,
            phone: currentUser.phone,
            subject: selectedSubject,
            teacher,
            center,
            dateTime: new Date(`${details.date}T${details.time}`),
            curriculum: details.curriculum,
            classLevel: details.classLevel,
            status: bookingType === 'Admission' ? 'Pending Admission' : 'Booked',
            bookingType: bookingType,
            ...batchDetails,
        };
    
        if (bookingType === 'Trial') {
            const docRef = await addDoc(collection(db, 'bookings'), {
                ...newBookingData,
                dateTime: Timestamp.fromDate(newBookingData.dateTime)
            });
    
            const newBookingForState: ConfirmedBookingDetails = {
                ...newBookingData,
                id: docRef.id,
            };
    
            setBookingDetailsForConfirmation(newBookingForState);
            setCurrentView('confirmation');
        } else { // Admission
            setBookingForPaymentModal(newBookingData);
        }
    };

    const handleCompleteAdmissionPayment = async (paymentDetails: NonNullable<ConfirmedBookingDetails['paymentDetails']>) => {
        if (!bookingForPaymentModal) return;
    
        const finalBookingData = {
            ...bookingForPaymentModal,
            paymentDetails,
            dateTime: Timestamp.fromDate(bookingForPaymentModal.dateTime)
        };
    
        await addDoc(collection(db, 'bookings'), finalBookingData);
        
        setBookingForPaymentModal(null);
        setCurrentView('bookings');
    };
    
    const handleNewBooking = () => {
        setSelectedSubject(null);
        setBookingType(null);
        setBookingDetailsForConfirmation(null);
        setCurrentView('home');
    }
    
    const handleTakeAdmission = (booking: ConfirmedBookingDetails) => {
        // This flow is now replaced by the direct payment modal after booking.
        // Keeping it for now in case of edge cases, but it should ideally be removed.
        alert("Please proceed to your bookings list to manage admissions.");
    }

    const handleTakeAdmissionForAll = (bookings: ConfirmedBookingDetails[]) => {
       // Also deprecated
       alert("Please proceed to your bookings list to manage admissions individually.");
    }
    
    const handleDownloadReceipt = (booking: ConfirmedBookingDetails) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('3G Admin Panel', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Admission Receipt', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
        
        const tableData = [
            ['Booking ID', booking.id.toString()],
            ['Student Name', booking.studentName],
            ['Booking Type', booking.bookingType],
            ['Subject', booking.subject.name],
            ['Teacher', booking.teacher.name],
            ['Center', booking.center.name],
            ['Start Date', booking.dateTime.toLocaleDateString()],
            ['Curriculum', booking.curriculum],
            ['Class Level', booking.classLevel],
            ['Status', booking.status],
        ];

        if (booking.bookingType === 'Admission') {
            tableData.push(['Batch Name', booking.batchName || 'N/A']);
            tableData.push(['Class Days', booking.days?.join(', ') || 'N/A']);
            tableData.push(['Class Time', booking.time ? formatTime12Hour(booking.time) : 'N/A']);
            const admissionFee = booking.paymentDetails?.amountPaid;
            if (typeof admissionFee === 'number') {
                tableData.push(['Admission Fee Paid', `Tk ${admissionFee.toLocaleString()}`]);
            }
        }
        
        tableData.push(['Payment Method', booking.paymentDetails?.paymentMethod || 'N/A']);

        if (booking.paymentDetails?.paymentMethod === 'Bkash') {
            tableData.push(['Bkash Number', booking.paymentDetails.bkashNumber || 'N/A']);
            tableData.push(['Transaction ID', booking.paymentDetails.transactionId || 'N/A']);
        }

        doc.autoTable({
            startY: 40,
            head: [['Detail', 'Information']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFontSize(10);
        doc.text('Thank you for your admission!', 14, finalY + 10);
        doc.save(`admission-receipt-${booking.id}.pdf`);
    };

    const handleDownloadMonthlyReceipt = (payment: Payment) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        const enrollment = allEnrollments.find(e => e.id === payment.enrollmentId);
        if (!enrollment) {
            alert("Could not find enrollment details for this payment.");
            return;
        }

        const student = allUsers.find(u => u.id === payment.userId);
        const subject = allSubjects.find(s => s.id === enrollment.subjectId);
        const teacher = allTeachers.find(t => t.id === enrollment.teacherId);

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('3G Admin Panel', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Monthly Fee Receipt', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

        const tableData = [
            ['Receipt ID', payment.id],
            ['Student Name', student?.name || 'N/A'],
            ['Subject', subject?.name || 'N/A'],
            ['Teacher', teacher?.name || 'N/A'],
            ['Payment For', `${payment.paymentForMonth} ${payment.paymentForYear}`],
            ['Payment Date', payment.paymentDate.toLocaleDateString()],
            ['Amount Paid', `Tk ${payment.amountPaid.toLocaleString()}`],
            ['Payment Method', payment.paymentMethod],
        ];

        if (payment.paymentMethod === 'Bkash') {
            tableData.push(['Bkash Number', payment.bkashNumber || 'N/A']);
            tableData.push(['Transaction ID', payment.transactionId || 'N/A']);
        }

        doc.autoTable({
            startY: 40,
            head: [['Detail', 'Information']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFontSize(10);
        doc.text('Thank you for your payment!', 14, finalY + 10);
        doc.save(`payment-receipt-${payment.id}.pdf`);
    };

    const handleUpdateUser = async (updatedUser: User) => {
        const { id, ...data } = updatedUser;
        if (!id) return;
        await updateDoc(doc(db, 'users', id), data);
        setCurrentUser(updatedUser);
    };

    const handleUpdatePassword = async (userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
        const user = auth.currentUser;
        if (!user || user.uid !== userId) {
            return { success: false, message: 'User not authenticated.' };
        }
        if (!user.email) {
            return { success: false, message: 'User email not found.' };
        }
        
        try {
            // Re-authenticate the user to confirm their identity
            const credential = EmailAuthProvider.credential(user.email, currentPass);
            await reauthenticateWithCredential(user, credential);

            // If re-authentication is successful, update the password
            await updatePassword(user, newPass);
            return { success: true, message: 'Password updated successfully!' };
        } catch (error: any) {
            console.error("Password update failed:", error);
            let message = 'An error occurred. Please try again.';
            if (error.code === 'auth/wrong-password') {
                message = 'Current password does not match.';
            } else if (error.code === 'auth/weak-password') {
                message = 'New password is too weak.';
            }
            return { success: false, message };
        }
    };


    // --- CRUD Handlers for Admin ---
    const handleAddSubject = async (subject: Omit<Subject, 'id'>) => await addDoc(collection(db, 'subjects'), {...subject, createdAt: Timestamp.now()});
    const handleUpdateSubject = async (updatedSubject: Subject) => { const { id, createdAt, ...data } = updatedSubject; await updateDoc(doc(db, "subjects", id), data); };
    const handleDeleteSubject = async (id: string) => {
        if (allTeachers.some(t => t.subjectIds.includes(id))) return;
        await deleteDoc(doc(db, "subjects", id));
    };

    const handleAddTeacher = async (teacher: Omit<Teacher, 'id'>) => {
        // This function creates a teacher profile but does NOT create an auth user.
        // The teacher must sign up separately using the same email to link their account.
        await addDoc(collection(db, 'teachers'), {...teacher, createdAt: Timestamp.now()});
    };
    const handleUpdateTeacher = async (updatedTeacher: Teacher) => { 
        const { id, createdAt, ...data } = updatedTeacher; 
        await updateDoc(doc(db, "teachers", id), data); 
        if (currentTeacher?.id === id) {
            setCurrentTeacher(updatedTeacher);
        }
    };
    const handleDeleteTeacher = async (id: string) => await deleteDoc(doc(db, "teachers", id));

    const handleAddCenter = async (center: Omit<Center, 'id'>) => await addDoc(collection(db, 'centers'), {...center, createdAt: Timestamp.now()});
    const handleUpdateCenter = async (updatedCenter: Center) => { const { id, createdAt, ...data } = updatedCenter; await updateDoc(doc(db, "centers", id), data); };
    const handleDeleteCenter = async (id: string) => {
         if (allTeachers.some(t => t.centerIds.includes(id))) return;
        await deleteDoc(doc(db, "centers", id));
    };

    const handleUpdateBooking = async (updatedBooking: ConfirmedBookingDetails) => {
        const { id, ...data } = updatedBooking;
        await updateDoc(doc(db, "bookings", id), { ...data, dateTime: Timestamp.fromDate(data.dateTime) });
    }
    const handleDeleteBooking = async (id: string) => await deleteDoc(doc(db, "bookings", id));
    
    const handleUpdateBookingStatus = async (bookingId: string, status: ConfirmedBookingDetails['status']) => {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, { status });
    
        if (status === 'Admitted') {
            // Fetch the updated booking directly to avoid race conditions with local state
            const bookingDoc = await getDoc(bookingRef);
            if (!bookingDoc.exists()) {
                console.error("Booking document not found after status update.");
                return;
            }
            
            const booking = bookingTransformer({ ...bookingDoc.data(), id: bookingDoc.id }) as ConfirmedBookingDetails;

            // Generate Student ID if it's the first admission
            const userRef = doc(db, 'users', booking.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (!userData.studentId) {
                    const studentIdQuery = query(collection(db, "users"), where("studentId", "!=", null));
                    const studentsWithIdsSnapshot = await getDocs(studentIdQuery);
                    const newIdNumber = studentsWithIdsSnapshot.size + 1;
                    const studentId = `S${new Date().getFullYear()}-${String(newIdNumber).padStart(4, '0')}`;
                    await updateDoc(userRef, { studentId });
                }
            }

            // Check if an enrollment for this specific booking already exists
            const enrollmentQuery = query(collection(db, "enrollments"), where("originalBookingId", "==", bookingId));
            const existingEnrollments = await getDocs(enrollmentQuery);
    
            if (existingEnrollments.empty) {
                const subject = allSubjects.find(s => s.id === booking.subject.id);
                const scheduleKey = getScheduleKeyForClassLevel(booking.classLevel);
                const fee = scheduleKey ? subject?.feesByLevel?.[scheduleKey] : undefined;
                
                if (subject && typeof fee === 'number' && booking.batchId && booking.batchName && booking.days && booking.time) {
                    const newEnrollment: Omit<Enrollment, 'id'> = {
                        userId: booking.userId,
                        studentName: booking.studentName,
                        subjectId: booking.subject.id,
                        teacherId: booking.teacher.id,
                        centerId: booking.center.id,
                        curriculum: booking.curriculum,
                        classLevel: booking.classLevel,
                        startDate: booking.dateTime,
                        monthlyFee: fee,
                        isActive: true,
                        originalBookingId: booking.id,
                        batchId: booking.batchId,
                        batchName: booking.batchName,
                        days: booking.days,
                        time: booking.time,
                    };
                    await addDoc(collection(db, 'enrollments'), {
                        ...newEnrollment,
                        startDate: Timestamp.fromDate(newEnrollment.startDate)
                    });
                } else {
                    let errorMessage = "Cannot create enrollment: ";
                    if (typeof fee !== 'number') {
                        errorMessage += `Please set a monthly fee for the subject "${subject?.name}" and class level "${booking.classLevel}" in the admin panel first.`;
                    } else {
                        errorMessage += `Essential batch information is missing from the booking record. Please try booking again.`;
                    }
                    console.error(errorMessage, booking);
                    alert(errorMessage);
                    // Revert status on failure to provide feedback to admin
                    await updateDoc(bookingRef, { status: 'Pending Admission' });
                }
            }
        }
    };
    
    const handleUpdateLogoUrl = async (url: string) => {
        const logo = url.trim() ? url : defaultLogoUrl;
        await setDoc(doc(db, "settings", "appConfig"), { logoUrl: logo }, { merge: true });
    };

    const handleAddSlide = async (slide: Omit<OfferSlide, 'id'>) => await addDoc(collection(db, 'slides'), slide);
    const handleUpdateSlide = async (updatedSlide: OfferSlide) => { const { id, ...data } = updatedSlide; await updateDoc(doc(db, "slides", id), data); };
    const handleDeleteSlide = async (id: string) => await deleteDoc(doc(db, "slides", id));
    
    const handleAddNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
        await addDoc(collection(db, 'notices'), { ...notice, createdAt: Timestamp.now() });
    };
    const handleUpdateNotice = async (updatedNotice: Notice) => { 
        const { id, ...data } = updatedNotice; 
        const dataToUpdate: any = { ...data };
        if (data.createdAt) {
            dataToUpdate.createdAt = Timestamp.fromDate(data.createdAt);
        }
        await updateDoc(doc(db, "notices", id), dataToUpdate); 
    };
    const handleDeleteNotice = async (id: string) => await deleteDoc(doc(db, "notices", id));

    const handleAddDiamondStudent = async (student: Omit<DiamondStudent, 'id'>) => await addDoc(collection(db, 'diamondStudents'), student);
    const handleUpdateDiamondStudent = async (updatedStudent: DiamondStudent) => { const { id, ...data } = updatedStudent; await updateDoc(doc(db, "diamondStudents", id), data); };
    const handleDeleteDiamondStudent = async (id: string) => await deleteDoc(doc(db, "diamondStudents", id));

    const handleAddReview = async (teacherId: string, review: Omit<Review, 'id'>) => {
        const teacherToUpdate = allTeachers.find(t => t.id === teacherId);
        if(teacherToUpdate) {
            const newReview: Review = { ...review, id: `review_${Date.now()}`};
            const updatedReviews = [...teacherToUpdate.reviews, newReview];
            await updateDoc(doc(db, "teachers", teacherId), { reviews: updatedReviews });
        }
    };

    const handleStudentAddPayment = async (payment: Omit<Payment, 'id' | 'status'>) => {
        await addDoc(collection(db, 'payments'), {
            ...payment,
            paymentDate: Timestamp.fromDate(payment.paymentDate),
            status: 'pending',
        });
    };

    const handleAdminAddPayment = async (payment: Omit<Payment, 'id' | 'status'>) => {
        await addDoc(collection(db, 'payments'), {
            ...payment,
            paymentDate: Timestamp.fromDate(payment.paymentDate),
            status: 'confirmed',
        });
    };

    const handleUpdatePayment = async (paymentId: string, updates: Partial<Payment>) => {
        if (!paymentId) return;
        const dataToUpdate: Partial<Payment> = { ...updates };
        // @ts-ignore
        delete dataToUpdate.id;
        await updateDoc(doc(db, "payments", paymentId), dataToUpdate);
    };

    const handleDeletePayment = async (paymentId: string) => await deleteDoc(doc(db, "payments", paymentId));
    const handleUpdateEnrollment = async (enrollment: Enrollment) => {
        const { id, ...data } = enrollment;
        const dataToUpdate: any = { ...data };
        if (data.startDate) {
            dataToUpdate.startDate = Timestamp.fromDate(data.startDate);
        }
        await updateDoc(doc(db, "enrollments", id), dataToUpdate);
    };
     const handleDeleteEnrollment = async (enrollmentId: string) => {
        if (!enrollmentId) return;

        try {
            const batch = writeBatch(db);

            // Find and delete all associated payments
            const paymentsQuery = query(collection(db, "payments"), where("enrollmentId", "==", enrollmentId));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            paymentsSnapshot.forEach(paymentDoc => {
                batch.delete(paymentDoc.ref);
            });

            // Delete the enrollment itself
            const enrollmentRef = doc(db, "enrollments", enrollmentId);
            batch.delete(enrollmentRef);

            await batch.commit();
        } catch (error) {
            console.error("Error deleting enrollment and associated payments: ", error);
            alert("Failed to delete enrollment. Check the console for more details.");
        }
    };

    // Quiz Handlers for Admin
    const handleAddQuiz = async (quiz: Omit<Quiz, 'id' | 'isActive' | 'createdAt'>) => {
        await addDoc(collection(db, 'quizzes'), { ...quiz, isActive: false, createdAt: Timestamp.now() });
    };
    const handleUpdateQuiz = async (updatedQuiz: Quiz) => {
        const { id, ...data } = updatedQuiz;
        await updateDoc(doc(db, 'quizzes', id), { ...data, createdAt: Timestamp.fromDate(data.createdAt || new Date())});
    };
    const handleDeleteQuiz = async (quizId: string) => {
        // We might want to also delete related submissions, but for now, we'll keep them for records.
        await deleteDoc(doc(db, "quizzes", quizId));
    };
    const handleSetActiveQuiz = async (quizIdToActivate: string) => {
        const batch = writeBatch(db);
        allQuizzes.forEach(quiz => {
            const quizRef = doc(db, 'quizzes', quiz.id);
            if (quiz.id === quizIdToActivate) {
                batch.update(quizRef, { isActive: true });
            } else if (quiz.isActive) {
                batch.update(quizRef, { isActive: false });
            }
        });
        await batch.commit();
    };

    // Quiz Submission Handler for Students
    const handleQuizSubmit = async (submission: Omit<QuizSubmission, 'id' | 'submittedAt'>) => {
        await addDoc(collection(db, 'quizSubmissions'), { ...submission, submittedAt: Timestamp.now() });
        // After submitting, refresh their view to show results
        setCurrentView('quiz');
    };
    
    // --- DATABASE SEEDING FUNCTION ---
    const seedDatabase = async () => {
        console.log("Checking if seeding is necessary...");
        const subjectsSnapshot = await getDocs(collection(db, "subjects"));
        if (!subjectsSnapshot.empty) {
            alert("Database has already been seeded. Aborting.");
            console.log("Database already contains data.");
            return;
        }

        console.log("Starting database seed process...");
        alert("Seeding database... This may take a moment. You will be alerted when it's complete.");

        try {
            const batch = writeBatch(db);
            const now = Timestamp.now();

            // Seed Settings
            const settingsRef = doc(db, "settings", "appConfig");
            batch.set(settingsRef, { 
                logoUrl: defaultLogoUrl,
            });

            // Seed Subjects
            const subjectsData: Omit<Subject, 'id'>[] = [
                { name: 'Physics', description: 'Explore the laws of the universe from quantum mechanics to cosmology.', imageUrl: 'https://images.unsplash.com/photo-1532187643623-dbf2656d4090?auto=format&fit=crop&q=80&w=800', feesByLevel: { 'O-Level': 5000, 'AS-Level': 6000, 'A2': 6500 }, createdAt: now.toDate() },
                { name: 'Chemistry', description: 'Dive into the world of atoms, molecules, and chemical reactions.', imageUrl: 'https://images.unsplash.com/photo-1554475901-45389635c249?auto=format&fit=crop&q=80&w=800', feesByLevel: { 'O-Level': 5000, 'AS-Level': 6000, 'A2': 6500 }, createdAt: now.toDate() },
                { name: 'Biology', description: 'Discover the intricate systems of life, from single cells to entire ecosystems.', imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800', feesByLevel: { 'O-Level': 4500, 'AS-Level': 5500, 'A2': 6000 }, createdAt: now.toDate() },
                { name: 'Mathematics', description: 'Master the language of logic, patterns, and problem-solving.', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800', feesByLevel: { 'O-Level': 5500, 'AS-Level': 6500, 'A2': 7000 }, createdAt: now.toDate() },
            ];
            subjectsData.forEach(subject => {
                const docRef = doc(collection(db, "subjects"));
                batch.set(docRef, { ...subject, createdAt: now });
            });
            
            // Seed Centers
            const centersData: Omit<Center, 'id'>[] = [
                { name: 'Dhanmondi Campus', location: 'Dhanmondi, Dhaka', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800', sliderImageUrls: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800'], latitude: 23.7461, longitude: 90.3742, phone: '01700000001', email: 'info.dhanmondi@example.com', about: 'Our Dhanmondi campus is located in the heart of the city, providing students with state-of-the-art facilities and a vibrant learning environment.', createdAt: now.toDate() },
                { name: 'Gulshan Campus', location: 'Gulshan, Dhaka', imageUrl: 'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?auto=format&fit=crop&q=80&w=800', sliderImageUrls: ['https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1613511593351-5589088892f2?auto=format&fit=crop&q=80&w=800'], latitude: 23.7925, longitude: 90.4078, phone: '01700000002', email: 'info.gulshan@example.com', about: 'The Gulshan campus offers a serene and focused atmosphere, ideal for advanced studies and collaborative projects. It features modern labs and a comprehensive library.', createdAt: now.toDate() },
                { name: 'Uttara Campus', location: 'Uttara, Dhaka', imageUrl: 'https://images.unsplash.com/photo-1613511593351-5589088892f2?auto=format&fit=crop&q=80&w=800', sliderImageUrls: ['https://images.unsplash.com/photo-1613511593351-5589088892f2?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800'], latitude: 23.8759, longitude: 90.3795, phone: '01700000003', email: 'info.uttara@example.com', about: 'Located in the bustling suburb of Uttara, this campus is easily accessible and equipped with the latest educational technology to support our students.', createdAt: now.toDate() }
            ];
            centersData.forEach(center => {
                const docRef = doc(collection(db, "centers"));
                batch.set(docRef, { ...center, createdAt: now });
            });
            
            // NOTE: Users are no longer seeded. They should be created via the signup flow
            // to ensure they exist in Firebase Authentication. An admin user can be created
            // via signup, and then their 'isAdmin' flag can be set to 'true' in Firestore manually.

            // Seed Slides
            const slidesData: Omit<OfferSlide, 'id'>[] = [
                 { imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000', title: 'Enroll for Fall 2024', description: 'Admissions are now open for all subjects.' },
                 { imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1000', title: 'Expert-Led Classes', description: 'Learn from the best and brightest instructors.' },
            ];
             slidesData.forEach(slide => {
                const docRef = doc(collection(db, "slides"));
                batch.set(docRef, slide);
            });

            // Seed Notices
            const noticesData = [
                { text: 'The campus will be closed for a national holiday on September 25th.', createdAt: Timestamp.fromDate(new Date('2024-09-20')) },
                { text: 'Mid-term exams will commence from the first week of October.', createdAt: Timestamp.fromDate(new Date('2024-09-21')) }
            ];
             noticesData.forEach(notice => {
                const docRef = doc(collection(db, "notices"));
                batch.set(docRef, notice);
            });

            // Seed Diamond Students
            const diamondStudentsData: Omit<DiamondStudent, 'id'>[] = [
                 { name: 'Alice Johnson', imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600', level: 'A Level', achievementYear: '2023', achievementDetails: 'Achieved top scores in the country for Physics and Mathematics.', results: [ { id: 'r1', subject: 'Physics', grade: 'A*' }, { id: 'r2', subject: 'Mathematics', grade: 'A*' }] },
            ];
             diamondStudentsData.forEach(student => {
                const docRef = doc(collection(db, "diamondStudents"));
                batch.set(docRef, student);
            });

            await batch.commit();

            // Teachers need IDs from subjects and centers, so they are added after the first commit.
            const subjects = (await getDocs(collection(db, "subjects"))).docs.map(doc => ({ ...doc.data(), id: doc.id })) as Subject[];
            const centers = (await getDocs(collection(db, "centers"))).docs.map(doc => ({ ...doc.data(), id: doc.id })) as Center[];
            const teachersBatch = writeBatch(db);

            const physicsId = subjects.find(s => s.name === 'Physics')?.id ?? '';
            const chemistryId = subjects.find(s => s.name === 'Chemistry')?.id ?? '';
            const dhanmondiId = centers.find(c => c.name === 'Dhanmondi Campus')?.id ?? '';
            const gulshanId = centers.find(c => c.name === 'Gulshan Campus')?.id ?? '';
            const uttaraId = centers.find(c => c.name === 'Uttara Campus')?.id ?? '';

            const teachersData: Omit<Teacher, 'id'>[] = [
                {
                    name: 'Dr. Evelyn Reed', email: 'e.reed@example.com', subjectIds: [physicsId], centerIds: [dhanmondiId, gulshanId],
                    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
                    bannerUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1000',
                    bio: 'With a Ph.D. in Astrophysics, Dr. Reed makes complex physics concepts accessible and exciting for all students.',
                    admissionFee: 1500,
                    status: 'pending',
                    batches: [
                        {
                            id: `batch_${Date.now()}_1`,
                            batchName: 'Physics Weekday Mornings (Dhanmondi)',
                            subjectId: physicsId,
                            centerId: dhanmondiId,
                            days: ['Monday', 'Wednesday', 'Friday'],
                            boardTimeGroups: [
                                { boardName: 'Cambridge', levelSlots: { 'O-Level': ['10:00', '11:00'], 'AS-Level': ['09:00'] } },
                                { boardName: 'Edexcel', levelSlots: { 'O-Level': ['10:00'] } }
                            ]
                        },
                        {
                            id: `batch_${Date.now()}_2`,
                            batchName: 'Advanced Physics (Gulshan)',
                            subjectId: physicsId,
                            centerId: gulshanId,
                            days: ['Tuesday', 'Thursday'],
                            boardTimeGroups: [
                                { boardName: 'Cambridge', levelSlots: { 'AS-Level': ['14:00'], 'A2': ['15:30'] } }
                            ]
                        }
                    ],
                    experience: [{id: 'e1', role: 'Senior Lecturer', company: 'Dhaka University', duration: '2015-Present'}],
                    education: [{id: 'ed1', degree: 'Ph.D. in Astrophysics', institution: 'MIT', year: '2014'}],
                    reviews: [{ id: 'rev1', reviewerName: 'John Doe', rating: 5, comment: 'Amazing teacher!' }],
                    createdAt: now.toDate(),
                    showOnHome: true,
                },
                {
                    name: 'Mr. David Chen', email: 'd.chen@example.com', subjectIds: [chemistryId], centerIds: [gulshanId, uttaraId],
                    imageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600',
                    bannerUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&q=80&w=1000',
                    bio: 'An expert in organic chemistry, Mr. Chen is known for his engaging lab demonstrations and clear teaching style.',
                    admissionFee: 1000,
                    status: 'pending',
                    batches: [
                         {
                            id: `batch_${Date.now()}_3`,
                            batchName: 'O-Level Chemistry (Gulshan)',
                            subjectId: chemistryId,
                            centerId: gulshanId,
                            days: ['Tuesday', 'Thursday'],
                            boardTimeGroups: [
                                { boardName: 'Cambridge', levelSlots: { 'O-Level': ['09:00', '10:00'] } },
                            ]
                        },
                        {
                            id: `batch_${Date.now()}_4`,
                            batchName: 'A-Level Chemistry (Uttara)',
                            subjectId: chemistryId,
                            centerId: uttaraId,
                            days: ['Wednesday'],
                            boardTimeGroups: [
                                { boardName: 'Cambridge', levelSlots: { 'O-Level': ['13:00'] } },
                                { boardName: 'Edexcel', levelSlots: { 'A2': ['16:00'] } }
                            ]
                        }
                    ],
                    experience: [{id: 'e2', role: 'Chemistry Teacher', company: 'Maple Leaf International', duration: '2018-Present'}],
                    education: [{id: 'ed2', degree: 'MSc in Chemistry', institution: 'University of Toronto', year: '2017'}],
                    reviews: [],
                    createdAt: now.toDate(),
                    showOnHome: true,
                },
            ];

            teachersData.forEach(teacher => {
                const docRef = doc(collection(db, "teachers"));
                teachersBatch.set(docRef, { ...teacher, createdAt: now });
            });

            await teachersBatch.commit();
            
            alert("Database seeding complete! Your app is ready.");
            console.log("Database seeded successfully.");

        } catch (error) {
            console.error("Error seeding database: ", error);
            alert("An error occurred while seeding the database. Check the console for details.");
        }
    };


    const renderView = () => {
        if (authLoading) {
            return <div className="text-center p-10">Loading...</div>;
        }
        switch (currentView) {
            case 'booking':
                return selectedSubject && currentUser && bookingType && <BookingForm subject={selectedSubject} currentUser={currentUser} bookingType={bookingType} allTeachers={allTeachers} allCenters={allCenters} onSubmit={handleBookingSubmit} onBack={() => handleNavigate('subjects')} />;
            case 'confirmation':
                return bookingDetailsForConfirmation && <Confirmation bookingDetails={bookingDetailsForConfirmation} onNewBooking={handleNewBooking} />;
            case 'login':
                return <Login onLogin={handleLogin} onNavigateToForgotPassword={() => handleNavigateToForgotPassword('login')} />;
            case 'studentLogin':
                return <StudentLogin onLogin={handleLogin} onNavigateToSignup={() => setCurrentView('signup')} onNavigateToForgotPassword={() => handleNavigateToForgotPassword('studentLogin')} />;
            case 'signup':
                return <Signup onSignup={handleSignup} onNavigateToLogin={() => setCurrentView('studentLogin')} />;
            case 'forgotPassword':
                return <ForgotPasswordView onPasswordResetRequest={handlePasswordResetRequest} onBackToLogin={() => setCurrentView(loginReturnView)} />;
            case 'teachers':
                return <TeachersView teachers={allTeachers} subjects={allSubjects} centers={allCenters} onSelectTeacher={handleTeacherSelect} onBack={() => handleNavigate('home')} />;
            case 'teacherDetail':
                const selectedTeacher = allTeachers.find(t => t.id === selectedTeacherId);
                return selectedTeacher ? <TeacherDetailView teacher={selectedTeacher} allSubjects={allSubjects} allCenters={allCenters} currentUser={currentUser} onBack={() => handleNavigate('teachers')} onBook={(subject) => handleStartBookingFlow(subject, 'Admission')} onAddReview={handleAddReview}/> : <div>Teacher not found</div>;
            case 'subjectDetail':
                return selectedSubject && <SubjectDetailView 
                    subject={selectedSubject}
                    allTeachers={allTeachers}
                    allSubjects={allSubjects}
                    onBack={() => handleNavigate('subjects')}
                    onSelectTeacher={handleTeacherSelect}
                    onBook={handleStartBookingFlow}
                />;
            case 'centerDetail':
                const selectedCenter = allCenters.find(c => c.id === selectedCenterId);
                return selectedCenter ? <CenterDetailView center={selectedCenter} allTeachers={allTeachers} allSubjects={allSubjects} onBack={() => handleNavigate('home')} onSelectTeacher={handleTeacherSelect} /> : <div>Center not found</div>;
            case 'diamondStudentDetail':
                return selectedDiamondStudent && <DiamondStudentDetailView student={selectedDiamondStudent} onBack={() => handleNavigate('home')} />;
            case 'bookings':
                return <BookingsList allBookings={allBookings} currentUser={currentUser} onTakeAdmission={handleTakeAdmission} onTakeAdmissionForAll={handleTakeAdmissionForAll} onDownloadReceipt={handleDownloadReceipt} onUpdateBookingStatus={handleUpdateBookingStatus} onBack={() => handleNavigate('home')} />;
            case 'quiz':
                const activeQuiz = allQuizzes.find(q => q.isActive);
                return activeQuiz && currentUser ? (
                    <QuizView 
                        quiz={activeQuiz} 
                        currentUser={currentUser} 
                        userSubmission={allQuizSubmissions.find(s => s.quizId === activeQuiz.id && s.userId === currentUser.id)}
                        onSubmit={handleQuizSubmit}
                        onBack={() => handleNavigate('home')}
                    />
                ) : <div className="text-center p-10 text-slate-500">No active quiz available at the moment, or you are not logged in.</div>;
            case 'messages':
                return (currentUser || currentTeacher) ? <MessagesView 
                            currentUser={(currentUser || currentTeacher)!} 
                            initialChatId={activeChatId}
                            onBack={() => handleNavigate('home')} 
                        /> : <StudentLogin onLogin={handleLogin} onNavigateToSignup={() => setCurrentView('signup')} onNavigateToForgotPassword={() => handleNavigateToForgotPassword('studentLogin')} />;
            case 'profile':
                return currentUser && <ProfileView 
                                        currentUser={currentUser} 
                                        onUpdateUser={handleUpdateUser} 
                                        onUpdatePassword={handleUpdatePassword} 
                                        onBack={() => handleNavigate('home')}
                                        allEnrollments={allEnrollments.filter(e => e.userId === currentUser.id)}
                                        allPayments={allPayments.filter(p => p.userId === currentUser.id)}
                                        allSubjects={allSubjects}
                                        allTeachers={allTeachers}
                                        allCenters={allCenters}
                                        allBookings={allBookings}
                                        onAddPayment={handleStudentAddPayment}
                                        onDownloadReceipt={handleDownloadReceipt}
                                        onDownloadMonthlyReceipt={handleDownloadMonthlyReceipt}
                                        onStartChat={handleStartChat}
                                     />;
             case 'teacherProfile':
                return currentTeacher && <TeacherProfileView 
                                            currentTeacher={currentTeacher} 
                                            onUpdateTeacher={handleUpdateTeacher} 
                                            onUpdatePassword={handleUpdatePassword}
                                            allSubjects={allSubjects}
                                            allCenters={allCenters}
                                            allEnrollments={allEnrollments}
                                            allPayments={allPayments}
                                            allUsers={allUsers}
                                            onBack={() => handleNavigate('home')} 
                                            onStartChat={handleStartChat}
                                            onCreateGroupChat={handleCreateGroupChat}
                                         />;
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
                        allEnrollments={allEnrollments}
                        allPayments={allPayments}
                        allQuizzes={allQuizzes}
                        allQuizSubmissions={allQuizSubmissions}
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
                        onAddPayment={handleAdminAddPayment}
                        onUpdatePayment={handleUpdatePayment}
                        onDeletePayment={handleDeletePayment}
                        onUpdateEnrollment={handleUpdateEnrollment}
                        onDeleteEnrollment={handleDeleteEnrollment}
                        onAddQuiz={handleAddQuiz}
                        onUpdateQuiz={handleUpdateQuiz}
                        onDeleteQuiz={handleDeleteQuiz}
                        onSetActiveQuiz={handleSetActiveQuiz}
                    />
                ) : <Login onLogin={handleLogin} onNavigateToForgotPassword={() => handleNavigateToForgotPassword('login')} />;
            case 'subjects':
                 return (
                    <HomeView
                        subjects={allSubjects}
                        teachers={allTeachers}
                        centers={allCenters}
                        slides={allSlides}
                        notices={allNotices}
                        diamondStudents={allDiamondStudents}
                        allQuizzes={allQuizzes}
                        allQuizSubmissions={allQuizSubmissions}
                        onSelectSubject={handleViewSubject}
                        onSelectTeacher={handleTeacherSelect}
                        onSelectDiamondStudent={handleSelectDiamondStudent}
                        // Fix: Corrected function name from `handleSelectCenter` to `handleCenterSelect`.
                        onSelectCenter={handleCenterSelect}
                        onNavigateToQuiz={() => handleNavigate('quiz')}
                        mode="subjectsOnly"
                        onBack={() => handleNavigate('home')}
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
                        allQuizzes={allQuizzes}
                        allQuizSubmissions={allQuizSubmissions}
                        onSelectSubject={handleViewSubject}
                        onSelectTeacher={handleTeacherSelect}
                        onSelectDiamondStudent={handleSelectDiamondStudent}
                        // Fix: Corrected function name from `handleSelectCenter` to `handleCenterSelect`.
                        onSelectCenter={handleCenterSelect}
                        onNavigateToQuiz={() => handleNavigate('quiz')}
                    />
                );
        }
    };

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
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />
            <Header 
                logoUrl={logoUrl}
                currentUser={currentUser} 
                currentTeacher={currentTeacher}
                onNavigate={handleNavigate} 
                onLogout={handleLogout}
                onOpenSidebar={() => setIsSidebarOpen(true)}
            />
            <main className={`max-w-4xl mx-auto w-full ${isMessagesView ? 'flex-1 overflow-hidden p-4 pb-20' : 'py-8 sm:py-12 px-0 sm:px-0 pb-20'}`}>
                {renderView()}
            </main>
            <BottomNav activeView={currentView} onNavigate={handleNavigate} currentUser={currentUser} />

            {bookingForPaymentModal && (
                <AdmissionPaymentModal
                    booking={bookingForPaymentModal}
                    onClose={() => setBookingForPaymentModal(null)}
                    onSubmit={handleCompleteAdmissionPayment}
                />
            )}
        </div>
    );
};

export default App;