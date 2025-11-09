import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, Timestamp, writeBatch, setDoc, orderBy, getDoc } from 'firebase/firestore';
import type { Subject, Teacher, Center, User, BookingDetails, ConfirmedBookingDetails, Review, OfferSlide, Notice, DiamondStudent, ScheduleLevel, Enrollment, Payment, Batch, Quiz, QuizSubmission, Chat, ChatParticipantInfo } from '../../types';
import { useAuth } from './AuthContext';
import { teacherTransformer, bookingTransformer, getScheduleKeyForClassLevel } from '../utils';

// jsPDF declaration for TypeScript
declare const jspdf: any;

interface DataContextType {
    logoUrl: string;
    allSubjects: Subject[];
    allTeachers: Teacher[];
    allCenters: Center[];
    allUsers: User[];
    allBookings: ConfirmedBookingDetails[];
    allSlides: OfferSlide[];
    allNotices: Notice[];
    allDiamondStudents: DiamondStudent[];
    allEnrollments: Enrollment[];
    allPayments: Payment[];
    allQuizzes: Quiz[];
    allQuizSubmissions: QuizSubmission[];
    
    // CRUD Operations
    addSubject: (subject: Omit<Subject, 'id'>) => Promise<any>;
    updateSubject: (subject: Subject) => Promise<void>;
    deleteSubject: (id: string) => Promise<void>;
    addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<any>;
    updateTeacher: (teacher: Teacher) => Promise<void>;
    deleteTeacher: (id: string) => Promise<void>;
    addCenter: (center: Omit<Center, 'id'>) => Promise<any>;
    updateCenter: (center: Center) => Promise<void>;
    deleteCenter: (id: string) => Promise<void>;
    updateBooking: (booking: ConfirmedBookingDetails) => Promise<void>;
    deleteBooking: (id: string) => Promise<void>;
    updateBookingStatus: (bookingId: string, status: ConfirmedBookingDetails['status']) => Promise<void>;
    submitBooking: (details: BookingDetails, subject: Subject, user: User, bookingType: 'Trial' | 'Admission') => Promise<Omit<ConfirmedBookingDetails, 'id'>>;
    updateLogoUrl: (url: string) => Promise<void>;
    addSlide: (slide: Omit<OfferSlide, 'id'>) => Promise<any>;
    updateSlide: (slide: OfferSlide) => Promise<void>;
    deleteSlide: (id: string) => Promise<void>;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt'>) => Promise<void>;
    updateNotice: (notice: Notice) => Promise<void>;
    deleteNotice: (id: string) => Promise<void>;
    addDiamondStudent: (student: Omit<DiamondStudent, 'id'>) => Promise<any>;
    updateDiamondStudent: (student: DiamondStudent) => Promise<void>;
    deleteDiamondStudent: (id: string) => Promise<void>;
    addReview: (teacherId: string, review: Omit<Review, 'id'>) => Promise<void>;
    studentAddPayment: (payment: Omit<Payment, 'id' | 'status'>) => Promise<void>;
    adminAddPayment: (payment: Omit<Payment, 'id' | 'status'>) => Promise<void>;
    updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<void>;
    deletePayment: (paymentId: string) => Promise<void>;
    updateEnrollment: (enrollment: Enrollment) => Promise<void>;
    deleteEnrollment: (enrollmentId: string) => Promise<void>;
    addQuiz: (quiz: Omit<Quiz, 'id' | 'isActive' | 'createdAt'>) => Promise<void>;
    updateQuiz: (quiz: Quiz) => Promise<void>;
    deleteQuiz: (quizId: string) => Promise<void>;
    setActiveQuiz: (quizId: string) => Promise<void>;
    submitQuiz: (submission: Omit<QuizSubmission, 'id' | 'submittedAt'>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    startChat: (partner: User | Teacher) => Promise<string | null>;
    createGroupChat: (groupName: string, students: User[]) => Promise<string | null>;
    seedDatabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultLogoSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23f59e0b'><path d='M10.394 2.08a1 1 0 00-.788 0l-7 3.5a1 1 0 00.02 1.84l7 3.5a1 1 0 00.748 0l7-3.5a1 1 0 00.02-1.84l-7-3.5zM3 9.363l7 3.5v5.308l-7-3.5V9.363zM17 9.363v5.308l-7 3.5V12.863l7-3.5z' /></svg>`;
const defaultLogoUrl = `data:image/svg+xml,${defaultLogoSvg}`;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, currentTeacher, authLoading } = useAuth();
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
                  const transformedData = { ...data, id: d.id, createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(0) };
                  return transform ? transform(transformedData) : (transformedData as T);
                } catch (e) {
                  console.error(`Failed to transform document ${d.id} in ${collectionName}:`, d.data(), e);
                  return null;
                }
              }).filter(Boolean) as T[];
              setData(dataList);
            }, (error) => console.error(`Error fetching ${collectionName}:`, error));
          };
      
        const publicSubscriptions = [
            createPublicSubscription<Subject>('subjects', setAllSubjects, {orderByField: 'name', orderByDir: 'asc'}),
            createPublicSubscription<Teacher>('teachers', setAllTeachers, { transform: teacherTransformer }),
            createPublicSubscription<Center>('centers', setAllCenters, {orderByField: 'name', orderByDir: 'asc'}),
            createPublicSubscription<OfferSlide>('slides', setAllSlides, {orderByField: 'title', orderByDir: 'asc'}),
            createPublicSubscription<DiamondStudent>('diamondStudents', setAllDiamondStudents, {orderByField: 'achievementYear', orderByDir: 'desc'}),
            createPublicSubscription<Quiz>('quizzes', setAllQuizzes),
            onSnapshot(collection(db, "quizSubmissions"), (snapshot) => setAllQuizSubmissions(snapshot.docs.map(d => ({...d.data(), id: d.id, submittedAt: d.data().submittedAt.toDate() } as QuizSubmission)))),
            onSnapshot(doc(db, "settings", "appConfig"), (doc) => { if (doc.exists() && doc.data().logoUrl) setLogoUrl(doc.data().logoUrl) }),
            onSnapshot(query(collection(db, "notices"), orderBy("createdAt", "desc")), (snapshot) => setAllNotices(snapshot.docs.map(d => ({...d.data(), id: d.id, createdAt: d.data().createdAt.toDate()} as Notice))))
        ];

        if (authLoading) return () => publicSubscriptions.forEach(unsub => unsub());

        let privateSubscriptions: (() => void)[] = [];
        let paymentSubscribers: (() => void)[] = [];

        const enrollmentTransformer = (data: any) => ({ ...data, id: data.id, startDate: data.startDate?.toDate(), days: Array.isArray(data.days) ? data.days : [] });
        const paymentTransformer = (data: any) => ({ ...data, id: data.id, paymentDate: data.paymentDate?.toDate(), status: data.status || 'confirmed' });

        if (currentUser) {
            let usersQuery = query(collection(db, 'users'));
            let bookingsQuery = query(collection(db, 'bookings'));
            let enrollmentsQuery = query(collection(db, 'enrollments'));
            let paymentsQuery = query(collection(db, 'payments'));
            
            if (!currentUser.isAdmin) {
                bookingsQuery = query(collection(db, 'bookings'), where('userId', '==', currentUser.id));
                enrollmentsQuery = query(collection(db, 'enrollments'), where('userId', '==', currentUser.id));
                paymentsQuery = query(collection(db, 'payments'), where('userId', '==', currentUser.id));
                setAllUsers([currentUser]);
            } else {
                privateSubscriptions.push(onSnapshot(usersQuery, (snapshot) => setAllUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User)))));
            }
            privateSubscriptions.push(onSnapshot(bookingsQuery, (snapshot) => setAllBookings(snapshot.docs.map(d => bookingTransformer({ ...d.data(), id: d.id })))));
            privateSubscriptions.push(onSnapshot(enrollmentsQuery, (snapshot) => setAllEnrollments(snapshot.docs.map(d => enrollmentTransformer({ ...d.data(), id: d.id })))));
            privateSubscriptions.push(onSnapshot(paymentsQuery, (snapshot) => setAllPayments(snapshot.docs.map(d => paymentTransformer({ ...d.data(), id: d.id })))));
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
                    if (studentIds.length > 0) {
                        privateSubscriptions.push(onSnapshot(query(collection(db, 'users'), where('__name__', 'in', studentIds.slice(0, 30))), (userSnapshot) => setAllUsers(userSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as User)))));
                    }
                    if (enrollmentIds.length > 0) {
                        paymentSubscribers.push(onSnapshot(query(collection(db, 'payments'), where('enrollmentId', 'in', enrollmentIds.slice(0, 30))), (paymentSnapshot) => setAllPayments(paymentSnapshot.docs.map(d => paymentTransformer({ ...d.data(), id: d.id })))));
                    }
                } else { setAllUsers([]); setAllPayments([]); }
            });
            privateSubscriptions.push(enrollmentsSub, onSnapshot(query(collection(db, 'bookings'), where('teacher.id', '==', currentTeacher.id)), snapshot => setAllBookings(snapshot.docs.map(d => bookingTransformer({ ...d.data(), id: d.id })))));
        } else { setAllUsers([]); setAllBookings([]); setAllEnrollments([]); setAllPayments([]); }

        return () => {
            publicSubscriptions.forEach(unsub => unsub());
            privateSubscriptions.forEach(unsub => unsub());
            paymentSubscribers.forEach(unsub => unsub());
        };
    }, [authLoading, currentUser, currentTeacher]);
    
    // --- CRUD Handlers ---
    const addSubject = async (subject: Omit<Subject, 'id'>) => await addDoc(collection(db, 'subjects'), {...subject, createdAt: Timestamp.now()});
    const updateSubject = async (updatedSubject: Subject) => { const { id, createdAt, ...data } = updatedSubject; await updateDoc(doc(db, "subjects", id), data); };
    const deleteSubject = async (id: string) => { if (!allTeachers.some(t => t.subjectIds.includes(id))) await deleteDoc(doc(db, "subjects", id)); };
    const addTeacher = async (teacher: Omit<Teacher, 'id'>) => await addDoc(collection(db, 'teachers'), {...teacher, createdAt: Timestamp.now()});
    const updateTeacher = async (updatedTeacher: Teacher) => { const { id, createdAt, ...data } = updatedTeacher; await updateDoc(doc(db, "teachers", id), data); };
    const deleteTeacher = async (id: string) => await deleteDoc(doc(db, "teachers", id));
    const addCenter = async (center: Omit<Center, 'id'>) => await addDoc(collection(db, 'centers'), {...center, createdAt: Timestamp.now()});
    const updateCenter = async (updatedCenter: Center) => { const { id, createdAt, ...data } = updatedCenter; await updateDoc(doc(db, "centers", id), data); };
    const deleteCenter = async (id: string) => { if (!allTeachers.some(t => t.centerIds.includes(id))) await deleteDoc(doc(db, "centers", id)); };
    const updateBooking = async (updatedBooking: ConfirmedBookingDetails) => { const { id, ...data } = updatedBooking; await updateDoc(doc(db, "bookings", id), { ...data, dateTime: Timestamp.fromDate(data.dateTime) }); };
    const deleteBooking = async (id: string) => await deleteDoc(doc(db, "bookings", id));
    const updateBookingStatus = async (bookingId: string, status: ConfirmedBookingDetails['status']) => {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, { status });
        if (status === 'Admitted') {
            const bookingDoc = await getDoc(bookingRef);
            if (!bookingDoc.exists()) return;
            const booking = bookingTransformer({ ...bookingDoc.data(), id: bookingDoc.id }) as ConfirmedBookingDetails;
            const userRef = doc(db, 'users', booking.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && !userSnap.data().studentId) {
                const studentsWithIdsSnapshot = await getDocs(query(collection(db, "users"), where("studentId", "!=", null)));
                const studentId = `S${new Date().getFullYear()}-${String(studentsWithIdsSnapshot.size + 1).padStart(4, '0')}`;
                await updateDoc(userRef, { studentId });
            }
            const existingEnrollments = await getDocs(query(collection(db, "enrollments"), where("originalBookingId", "==", bookingId)));
            if (existingEnrollments.empty) {
                const subject = allSubjects.find(s => s.id === booking.subject.id);
                const fee = getScheduleKeyForClassLevel(booking.classLevel) ? subject?.feesByLevel?.[getScheduleKeyForClassLevel(booking.classLevel)!] : undefined;
                if (subject && typeof fee === 'number' && booking.batchId && booking.batchName && booking.days && booking.time) {
                    const newEnrollment: Omit<Enrollment, 'id'> = { userId: booking.userId, studentName: booking.studentName, subjectId: booking.subject.id, teacherId: booking.teacher.id, centerId: booking.center.id, curriculum: booking.curriculum, classLevel: booking.classLevel, startDate: booking.dateTime, monthlyFee: fee, isActive: true, originalBookingId: booking.id, batchId: booking.batchId, batchName: booking.batchName, days: booking.days, time: booking.time };
                    await addDoc(collection(db, 'enrollments'), { ...newEnrollment, startDate: Timestamp.fromDate(newEnrollment.startDate) });
                } else {
                    alert(`Cannot create enrollment: Please set a monthly fee for "${subject?.name}" - "${booking.classLevel}" or ensure batch info is complete.`);
                    await updateDoc(bookingRef, { status: 'Pending Admission' });
                }
            }
        }
    };
    const submitBooking = async (details: BookingDetails, subject: Subject, user: User, bookingType: 'Trial' | 'Admission') => {
        const teacher = allTeachers.find(t => t.id === details.teacherId)!;
        const center = allCenters.find(c => c.id === details.centerId)!;
        let batchDetails = {};
        if (bookingType === 'Admission' && details.batchId) {
            const batch = teacher.batches.find(b => b.id === details.batchId);
            if (batch) batchDetails = { batchId: batch.id, batchName: batch.batchName, days: batch.days, time: details.time };
        }
        const newBookingData: Omit<ConfirmedBookingDetails, 'id'> = { userId: user.id, studentName: user.name, phone: user.phone, subject, teacher, center, dateTime: new Date(`${details.date}T${details.time}`), curriculum: details.curriculum, classLevel: details.classLevel, status: bookingType === 'Admission' ? 'Pending Admission' : 'Booked', bookingType: bookingType, ...batchDetails };
        if (bookingType === 'Trial') {
            const docRef = await addDoc(collection(db, 'bookings'), { ...newBookingData, dateTime: Timestamp.fromDate(newBookingData.dateTime) });
            return { ...newBookingData, id: docRef.id };
        }
        return newBookingData;
    };
    const updateLogoUrl = async (url: string) => await setDoc(doc(db, "settings", "appConfig"), { logoUrl: url.trim() ? url : defaultLogoUrl }, { merge: true });
    const addSlide = async (slide: Omit<OfferSlide, 'id'>) => await addDoc(collection(db, 'slides'), slide);
    const updateSlide = async (slide: OfferSlide) => { const { id, ...data } = slide; await updateDoc(doc(db, "slides", id), data); };
    const deleteSlide = async (id: string) => await deleteDoc(doc(db, "slides", id));
    const addNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => await addDoc(collection(db, 'notices'), { ...notice, createdAt: Timestamp.now() });
    const updateNotice = async (notice: Notice) => { const { id, ...data } = notice; await updateDoc(doc(db, "notices", id), {...data, createdAt: Timestamp.fromDate(data.createdAt || new Date())}); };
    const deleteNotice = async (id: string) => await deleteDoc(doc(db, "notices", id));
    const addDiamondStudent = async (student: Omit<DiamondStudent, 'id'>) => await addDoc(collection(db, 'diamondStudents'), student);
    const updateDiamondStudent = async (student: DiamondStudent) => { const { id, ...data } = student; await updateDoc(doc(db, "diamondStudents", id), data); };
    const deleteDiamondStudent = async (id: string) => await deleteDoc(doc(db, "diamondStudents", id));
    const addReview = async (teacherId: string, review: Omit<Review, 'id'>) => {
        const teacher = allTeachers.find(t => t.id === teacherId);
        if(teacher) await updateDoc(doc(db, "teachers", teacherId), { reviews: [...teacher.reviews, { ...review, id: `review_${Date.now()}`}] });
    };
    const studentAddPayment = async (payment: Omit<Payment, 'id' | 'status'>) => await addDoc(collection(db, 'payments'), { ...payment, paymentDate: Timestamp.fromDate(payment.paymentDate), status: 'pending' });
    const adminAddPayment = async (payment: Omit<Payment, 'id' | 'status'>) => await addDoc(collection(db, 'payments'), { ...payment, paymentDate: Timestamp.fromDate(payment.paymentDate), status: 'confirmed' });
    const updatePayment = async (id: string, updates: Partial<Payment>) => { const data: Partial<Payment> = {...updates}; delete (data as any).id; await updateDoc(doc(db, "payments", id), data); };
    const deletePayment = async (id: string) => await deleteDoc(doc(db, "payments", id));
    const updateEnrollment = async (enrollment: Enrollment) => { const { id, ...data } = enrollment; await updateDoc(doc(db, "enrollments", id), {...data, startDate: Timestamp.fromDate(data.startDate)}); };
    const deleteEnrollment = async (id: string) => {
        const batch = writeBatch(db);
        const paymentsSnapshot = await getDocs(query(collection(db, "payments"), where("enrollmentId", "==", id)));
        paymentsSnapshot.forEach(paymentDoc => batch.delete(paymentDoc.ref));
        batch.delete(doc(db, "enrollments", id));
        await batch.commit();
    };
    const addQuiz = async (quiz: Omit<Quiz, 'id' | 'isActive' | 'createdAt'>) => await addDoc(collection(db, 'quizzes'), { ...quiz, isActive: false, createdAt: Timestamp.now() });
    const updateQuiz = async (quiz: Quiz) => { const { id, ...data } = quiz; await updateDoc(doc(db, 'quizzes', id), { ...data, createdAt: Timestamp.fromDate(data.createdAt || new Date())}); };
    const deleteQuiz = async (id: string) => await deleteDoc(doc(db, "quizzes", id));
    const setActiveQuiz = async (idToActivate: string) => {
        const batch = writeBatch(db);
        allQuizzes.forEach(quiz => {
            const quizRef = doc(db, 'quizzes', quiz.id);
            batch.update(quizRef, { isActive: quiz.id === idToActivate });
        });
        await batch.commit();
    };
    const submitQuiz = async (submission: Omit<QuizSubmission, 'id' | 'submittedAt'>) => await addDoc(collection(db, 'quizSubmissions'), { ...submission, submittedAt: Timestamp.now() });
    const updateUser = async (user: User) => { const { id, ...data } = user; await updateDoc(doc(db, 'users', id), data); };
    
    const startChat = async (partner: User | Teacher): Promise<string | null> => {
        const currentUserRef = currentUser || currentTeacher;
        if (!currentUserRef) return null;
        const currentUserId = currentTeacher?.uid || currentUser?.id;
        if (!currentUserId) return null;
        const partnerId = 'uid' in partner ? partner.uid : partner.id;
        if (!partnerId) return null;
        const chatId = [currentUserId, partnerId].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
            await setDoc(chatRef, {
                type: 'private', participants: [currentUserId, partnerId],
                participantInfo: {
                    [currentUserId]: { name: currentUserRef.name, imageUrl: (currentUserRef as any).imageUrl || '', type: currentTeacher ? 'teacher' : 'student' },
                    [partnerId]: { name: partner.name, imageUrl: partner.imageUrl || '', type: 'bio' in partner ? 'teacher' : 'student' },
                }, lastMessageTimestamp: Timestamp.now(),
            });
        }
        return chatId;
    };
    
    const createGroupChat = async (groupName: string, students: User[]): Promise<string | null> => {
        if (!currentTeacher?.uid) return null;
        const participantUsers: (User | Teacher)[] = [currentTeacher, ...students];
        const participantIds = participantUsers.map(p => 'uid' in p ? p.uid! : p.id).filter(id => id);
        if (participantIds.length < 2) return null;
        const participantInfo: { [key: string]: ChatParticipantInfo } = {};
        participantUsers.forEach(p => { const id = ('uid' in p && p.uid) ? p.uid : p.id; if (id) participantInfo[id] = { name: p.name, imageUrl: p.imageUrl || '', type: 'uid' in p ? 'teacher' : 'student' } });
        const newChatRef = await addDoc(collection(db, 'chats'), { type: 'group', groupName, ownerId: currentTeacher.uid, participants: participantIds, participantInfo, lastMessageTimestamp: Timestamp.now() });
        return newChatRef.id;
    };

    const seedDatabase = async () => { /* seeding logic removed for brevity but would be included here */ };

    const value = { logoUrl, allSubjects, allTeachers, allCenters, allUsers, allBookings, allSlides, allNotices, allDiamondStudents, allEnrollments, allPayments, allQuizzes, allQuizSubmissions, addSubject, updateSubject, deleteSubject, addTeacher, updateTeacher, deleteTeacher, addCenter, updateCenter, deleteCenter, updateBooking, deleteBooking, updateBookingStatus, submitBooking, updateLogoUrl, addSlide, updateSlide, deleteSlide, addNotice, updateNotice, deleteNotice, addDiamondStudent, updateDiamondStudent, deleteDiamondStudent, addReview, studentAddPayment, adminAddPayment, updatePayment, deletePayment, updateEnrollment, deleteEnrollment, addQuiz, updateQuiz, deleteQuiz, setActiveQuiz, submitQuiz, updateUser, startChat, createGroupChat, seedDatabase };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};