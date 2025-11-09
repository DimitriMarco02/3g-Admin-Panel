import React, { useState, useMemo } from 'react';
import type { Teacher, Subject, Center, Enrollment, Payment, User } from '../../types';
// Fix: Import TeacherEditModal from its correct location in TeachersManager.
import { TeacherEditModal } from './admin/TeachersManager';
import { useDragToScroll } from '../hooks/useDragToScroll';
import { Modal, InputField } from './admin/shared';

interface TeacherProfileViewProps {
    currentTeacher: Teacher;
    onUpdateTeacher: (teacher: Teacher) => void;
    onUpdatePassword: (userId: string, currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
    allSubjects: Subject[];
    allCenters: Center[];
    allEnrollments: Enrollment[];
    allPayments: Payment[];
    allUsers: User[];
    onBack: () => void;
    onStartChat: (partner: User | Teacher) => void;
    onCreateGroupChat: (groupName: string, students: User[]) => void;
}

const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const StudentPaymentStatusCard: React.FC<{
    studentData: {
        enrollment: Enrollment;
        student?: User;
        subject?: Subject;
        payments: Payment[];
    }
}> = ({ studentData }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { enrollment, student, subject, payments } = studentData;

    const paymentStatusByMonth = useMemo(() => {
        const statuses: { month: string; year: number; status: 'Paid' | 'Due' | 'Pending'; amount: number, paymentDate?: Date }[] = [];
        const today = new Date();
        let currentDate = new Date(enrollment.startDate);
        currentDate.setDate(1);

        while (currentDate <= today) {
            const month = currentDate.toLocaleString('default', { month: 'long' });
            const year = currentDate.getFullYear();
            const paymentForMonth = payments.find(p => p.paymentForMonth === month && p.paymentForYear === year);

            if (paymentForMonth) {
                 if (paymentForMonth.status === 'confirmed') {
                    statuses.push({ month, year, status: 'Paid', amount: paymentForMonth.amountPaid, paymentDate: paymentForMonth.paymentDate });
                } else {
                    statuses.push({ month, year, status: 'Pending', amount: paymentForMonth.amountPaid, paymentDate: paymentForMonth.paymentDate });
                }
            } else {
                statuses.push({ month, year, status: 'Due', amount: enrollment.monthlyFee });
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return statuses.reverse();
    }, [enrollment.startDate, enrollment.monthlyFee, payments]);

    if (!student || !subject) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
             <button className="w-full text-left p-4" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-800">{student.name}</h4>
                        <p className="text-sm text-slate-500">
                           {subject.name} ({enrollment.classLevel})
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                            {enrollment.batchName} ({enrollment.days.join('/')} at {formatTime12Hour(enrollment.time)})
                        </p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </button>
             {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in-fast">
                    <div className="bg-slate-50 rounded-lg p-3 border">
                        <h5 className="font-semibold text-slate-700 mb-2 text-sm">Payment History</h5>
                        <div className="space-y-1">
                            {paymentStatusByMonth.map(({ month, year, status }) => (
                                <div key={`${month}-${year}`} className="p-2 bg-white rounded-md border flex justify-between items-center">
                                    <p className="font-medium text-slate-800 text-sm">{month} {year}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'Paid' ? 'bg-green-100 text-green-800' : status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

type MainTab = 'enrollments' | 'students' | 'info' | 'password';
type LevelTab = 'O Level' | 'AS Level' | 'A2 Level';
type StudentLevelTab = 'O Level' | 'AS Level' | 'A2 Level';

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ currentTeacher, onUpdateTeacher, onUpdatePassword, allSubjects, allCenters, allEnrollments, allPayments, allUsers, onBack, onStartChat, onCreateGroupChat }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [mainTab, setMainTab] = useState<MainTab>('enrollments');
    const [levelTab, setLevelTab] = useState<LevelTab>('O Level');
    const [studentLevelTab, setStudentLevelTab] = useState<StudentLevelTab>('O Level');
    const [selectedMonth, setSelectedMonth] = useState<string>('all-time');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const tabsScrollRef = useDragToScroll();

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupName, setGroupName] = useState('');

    const handleSaveChanges = (updatedTeacher: Teacher | Omit<Teacher, 'id'>) => {
        onUpdateTeacher(updatedTeacher as Teacher);
        setIsEditModalOpen(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
            return;
        }
        if (!currentTeacher.uid) {
            setPasswordMessage({ type: 'error', text: 'Teacher user ID not found. Cannot change password.' });
            return;
        }

        setPasswordLoading(true);
        const result = await onUpdatePassword(currentTeacher.uid, currentPassword, newPassword);
        if (result.success) {
            setPasswordMessage({ type: 'success', text: result.message });
            setTimeout(() => setPasswordMessage({type: '', text: ''}), 3000);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordMessage({ type: 'error', text: result.message });
        }
        setPasswordLoading(false);
      };

    const enrolledStudentsData = useMemo(() => {
        const teacherEnrollments = allEnrollments.filter(e => e.teacherId === currentTeacher.id && e.isActive);
        
        return teacherEnrollments.map(enrollment => {
            const student = allUsers.find(u => u.id === enrollment.userId);
            const subject = allSubjects.find(s => s.id === enrollment.subjectId);
            const payments = allPayments.filter(p => p.enrollmentId === enrollment.id);
            return { enrollment, student, subject, payments };
        }).filter(s => s.student && s.subject); // Ensure student and subject data exists
    }, [allEnrollments, allPayments, allUsers, allSubjects, currentTeacher.id]);

    const studentsByLevelForEnrollments = useMemo(() => {
        const oLevelStudents = enrolledStudentsData.filter(({ enrollment }) => enrollment.classLevel === 'O Level' || enrollment.classLevel === 'IGCSE');
        const asLevelStudents = enrolledStudentsData.filter(({ enrollment }) => enrollment.classLevel === 'AS Level');
        const a2LevelStudents = enrolledStudentsData.filter(({ enrollment }) => enrollment.classLevel === 'A2 Level');
        return {
            'O Level': oLevelStudents,
            'AS Level': asLevelStudents,
            'A2 Level': a2LevelStudents
        };
    }, [enrolledStudentsData]);

    const studentsByLevelForRoster = useMemo(() => {
        const oLevelStudentIds = new Set<string>();
        const asLevelStudentIds = new Set<string>();
        const a2LevelStudentIds = new Set<string>();

        allEnrollments.forEach(e => {
            if (e.teacherId === currentTeacher.id) {
                if (e.classLevel === 'O Level' || e.classLevel === 'IGCSE') oLevelStudentIds.add(e.userId);
                else if (e.classLevel === 'AS Level') asLevelStudentIds.add(e.userId);
                else if (e.classLevel === 'A2 Level') a2LevelStudentIds.add(e.userId);
            }
        });
        const getStudentsByIds = (ids: Set<string>) => allUsers.filter(u => ids.has(u.id)).sort((a,b) => a.name.localeCompare(b.name));
        return {
            'O Level': getStudentsByIds(oLevelStudentIds),
            'AS Level': getStudentsByIds(asLevelStudentIds),
            'A2 Level': getStudentsByIds(a2LevelStudentIds),
        };
    }, [allEnrollments, allUsers, currentTeacher.id]);

    const allMyStudents = useMemo(() => {
        const studentMap = new Map<string, User>();
        // Fix: Added type annotation to `level` to resolve 'forEach' does not exist on type 'unknown' error.
        Object.values(studentsByLevelForRoster).forEach((level: User[]) => {
            level.forEach(student => {
                if (!studentMap.has(student.id)) {
                    studentMap.set(student.id, student);
                }
            });
        });
        return Array.from(studentMap.values());
    }, [studentsByLevelForRoster]);


    const filteredStudents = useMemo(() => {
        const studentsForLevel = studentsByLevelForRoster[studentLevelTab] || [];
        if (!studentSearchTerm) return studentsForLevel;

        const search = studentSearchTerm.toLowerCase();
        return studentsForLevel.filter(s => 
            s.name.toLowerCase().includes(search) || 
            (s.studentId && s.studentId.toLowerCase().includes(search))
        );
    }, [studentsByLevelForRoster, studentLevelTab, studentSearchTerm]);


    const monthFilterOptions = useMemo(() => {
        if (allEnrollments.length === 0) return [];

        const teacherEnrollments = allEnrollments.filter(e => e.teacherId === currentTeacher.id);
        if (teacherEnrollments.length === 0) return [];

        const earliestDate = teacherEnrollments.reduce((earliest, e) => {
            return e.startDate < earliest ? e.startDate : earliest;
        }, new Date());

        const options = [];
        const today = new Date();
        let currentDate = new Date(earliestDate);
        currentDate.setDate(1);

        while (currentDate <= today) {
            const monthName = currentDate.toLocaleString('default', { month: 'long' });
            const year = currentDate.getFullYear();
            const monthNum = currentDate.getMonth() + 1;
            
            options.push({
                value: `${year}-${String(monthNum).padStart(2, '0')}`,
                label: `${monthName} ${year}`
            });

            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return options.reverse(); // Show most recent first
    }, [allEnrollments, currentTeacher.id]);

    const summary = useMemo(() => {
        let totalStudents = 0;
        let totalDue = 0;
        let studentsWithDues = 0;
        let totalCollection = 0;

        if (selectedMonth === 'all-time') {
            totalStudents = enrolledStudentsData.length;
            const studentsWithDuesSet = new Set<string>();

            enrolledStudentsData.forEach(data => {
                let hasDueForAnyMonth = false;
                const today = new Date();
                let dateCursor = new Date(data.enrollment.startDate);
                dateCursor.setDate(1);

                while(dateCursor <= today) {
                    const month = dateCursor.toLocaleString('default', { month: 'long' });
                    const year = dateCursor.getFullYear();
                    const isPaid = data.payments.some(p => p.paymentForMonth === month && p.paymentForYear === year && p.status === 'confirmed');
                    if(!isPaid) {
                        totalDue += data.enrollment.monthlyFee;
                        hasDueForAnyMonth = true;
                    }
                    dateCursor.setMonth(dateCursor.getMonth() + 1);
                }
                if (hasDueForAnyMonth) {
                    studentsWithDuesSet.add(data.enrollment.userId);
                }
                data.payments.forEach(p => {
                    if (p.status === 'confirmed') {
                        totalCollection += p.amountPaid;
                    }
                });
            });
            studentsWithDues = studentsWithDuesSet.size;

        } else {
            const [filterYear, filterMonthNum] = selectedMonth.split('-').map(Number);
            const filterMonthName = new Date(filterYear, filterMonthNum - 1, 1).toLocaleString('default', { month: 'long' });
            const monthEnd = new Date(filterYear, filterMonthNum, 0);

            const activeStudentsForMonth = enrolledStudentsData.filter(({ enrollment }) => enrollment.startDate <= monthEnd);
            
            totalStudents = activeStudentsForMonth.length;
            const studentsWithDuesSet = new Set<string>();

            activeStudentsForMonth.forEach(({ enrollment, payments }) => {
                const paymentForMonth = payments.find(p => p.paymentForMonth === filterMonthName && p.paymentForYear === filterYear);
                
                if (paymentForMonth && paymentForMonth.status === 'confirmed') {
                    totalCollection += paymentForMonth.amountPaid;
                } else {
                    totalDue += enrollment.monthlyFee;
                    studentsWithDuesSet.add(enrollment.userId);
                }
            });
            studentsWithDues = studentsWithDuesSet.size;
        }

        return { totalStudents, totalDue, studentsWithDues, totalCollection };
    }, [enrolledStudentsData, selectedMonth]);


    const handleGroupCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (groupName.trim()) {
            onCreateGroupChat(groupName, allMyStudents);
            setIsGroupModalOpen(false);
            setGroupName('');
        }
    };


    const MainTabButton: React.FC<{ tabId: MainTab; label: string }> = ({ tabId, label }) => (
      <button onClick={() => setMainTab(tabId)} className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors flex-shrink-0 whitespace-nowrap ${mainTab === tabId ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
          {label}
      </button>
    );

     const LevelTabButton: React.FC<{ tabId: LevelTab; label: string, count: number }> = ({ tabId, label, count }) => (
        <button
            onClick={() => setLevelTab(tabId)}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm font-bold transition-colors duration-200 rounded-lg flex justify-center items-center space-x-2 ${
                levelTab === tabId ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
        >
            <span>{label}</span>
            <span className={`h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold ${levelTab === tabId ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'}`}>
                {count}
            </span>
        </button>
    );
    
    const StudentLevelTabButton: React.FC<{ tabId: StudentLevelTab; label: string, count: number }> = ({ tabId, label, count }) => (
        <button
            onClick={() => setStudentLevelTab(tabId)}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm font-bold transition-colors duration-200 rounded-lg flex justify-center items-center space-x-2 ${
                studentLevelTab === tabId ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
        >
            <span>{label}</span>
            <span className={`h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold ${studentLevelTab === tabId ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'}`}>
                {count}
            </span>
        </button>
    );


    return (
        <div className="p-4 sm:p-6 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 max-w-3xl mx-auto">
                <div className="p-6 sm:p-8">
                    <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Back to Home
                    </button>
                    <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
                        <img src={currentTeacher.imageUrl} alt={currentTeacher.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                        <div className="text-center sm:text-left mt-4 sm:mt-0">
                            <h2 className="text-3xl font-bold text-slate-800">{currentTeacher.name}</h2>
                            <p className="text-slate-500">{currentTeacher.email}</p>
                        </div>
                    </div>
                </div>

                <div ref={tabsScrollRef} className="px-6 border-b border-slate-200 flex flex-nowrap space-x-2 overflow-x-auto no-scrollbar horizontal-scroll">
                    <MainTabButton tabId="enrollments" label="My Enrollments" />
                    <MainTabButton tabId="students" label="My Students" />
                    <MainTabButton tabId="info" label="My Information" />
                    <MainTabButton tabId="password" label="Change Password" />
                </div>

                <div className="p-6 sm:p-8">
                    {mainTab === 'enrollments' && (
                        <div className="animate-fade-in-fast space-y-6">
                            <div className="mb-6">
                                <label htmlFor="month-filter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Month</label>
                                <select
                                    id="month-filter"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all-time">All Time</option>
                                    {monthFilterOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-100 p-4 rounded-lg text-center">
                                    <p className="text-sm font-semibold text-slate-500">Total Students</p>
                                    <p className="text-3xl font-bold text-slate-800">{summary.totalStudents}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                    <p className="text-sm font-semibold text-red-600">Students with Dues</p>
                                    <p className="text-3xl font-bold text-red-700">{summary.studentsWithDues}</p>
                                </div>
                                <div className="bg-red-100 p-4 rounded-lg text-center">
                                    <p className="text-sm font-semibold text-red-600">Total Dues</p>
                                    <p className="text-3xl font-bold text-red-700">Tk {summary.totalDue.toLocaleString()}</p>
                                </div>
                                 <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <p className="text-sm font-semibold text-green-600">Total Collection</p>
                                    <p className="text-3xl font-bold text-green-700">Tk {summary.totalCollection.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-slate-100 p-2 rounded-xl mb-6">
                                    <LevelTabButton tabId="O Level" label="O Level / IGCSE" count={studentsByLevelForEnrollments['O Level'].length} />
                                    <LevelTabButton tabId="AS Level" label="AS Level" count={studentsByLevelForEnrollments['AS Level'].length} />
                                    <LevelTabButton tabId="A2 Level" label="A2 Level" count={studentsByLevelForEnrollments['A2 Level'].length} />
                                </div>
                                <div className="space-y-3">
                                    {studentsByLevelForEnrollments[levelTab].length > 0 ? (
                                        studentsByLevelForEnrollments[levelTab].map(studentData => (
                                            <StudentPaymentStatusCard key={studentData.enrollment.id} studentData={studentData as any} />
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-500 py-6">No students enrolled in this level.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {mainTab === 'students' && (
                        <div className="animate-fade-in-fast space-y-6">
                             <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-800">My Students</h3>
                                {allMyStudents.length > 0 && (
                                    <button onClick={() => { setGroupName(`${currentTeacher.name}'s Group`); setIsGroupModalOpen(true); }} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 text-sm">
                                        Create Group Chat
                                    </button>
                                )}
                            </div>
                             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-slate-100 p-2 rounded-xl">
                                <StudentLevelTabButton tabId="O Level" label="O Level / IGCSE" count={studentsByLevelForRoster['O Level'].length} />
                                <StudentLevelTabButton tabId="AS Level" label="AS Level" count={studentsByLevelForRoster['AS Level'].length} />
                                <StudentLevelTabButton tabId="A2 Level" label="A2 Level" count={studentsByLevelForRoster['A2 Level'].length} />
                            </div>
                            <div className="mb-4">
                                <InputField 
                                    label="Search by Name or Student ID" 
                                    type="text" 
                                    placeholder="Start typing to search..."
                                    value={studentSearchTerm}
                                    onChange={e => setStudentSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <div key={student.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between space-x-4">
                                            <div className="flex items-center space-x-4 overflow-hidden">
                                                {student.imageUrl ? (
                                                    <img src={student.imageUrl} alt={student.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center font-bold text-2xl text-blue-600 flex-shrink-0">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-slate-800 truncate">{student.name}</h4>
                                                    <p className="text-sm text-slate-500 font-mono truncate">{student.studentId || 'No ID assigned'}</p>
                                                    <div className="mt-2 text-xs text-slate-600 space-y-1">
                                                        <p className="truncate"><strong className="font-medium">Email:</strong> {student.email}</p>
                                                        <p className="truncate"><strong className="font-medium">Phone:</strong> {student.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                             <button onClick={() => onStartChat(student)} className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 text-sm flex items-center space-x-2 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                                </svg>
                                                <span>Chat</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 py-6">No students found for this level.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {mainTab === 'info' && (
                        <div className="animate-fade-in-fast space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">My Information</h3>
                                <div className="space-y-3 text-sm text-slate-600">
                                    <p><strong>Bio:</strong> {currentTeacher.bio}</p>
                                    <p><strong>Phone:</strong> {currentTeacher.phone || 'Not Provided'}</p>
                                    <p><strong>Subjects:</strong> {currentTeacher.subjectIds.map(id => allSubjects.find(s => s.id === id)?.name).join(', ')}</p>
                                    <p><strong>Centers:</strong> {currentTeacher.centerIds.map(id => allCenters.find(c => c.id === id)?.name).join(', ')}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-amber-400 text-slate-900 font-semibold py-2 px-5 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all text-sm"
                            >
                                Edit Profile & Schedules
                            </button>
                        </div>
                    )}
                    {mainTab === 'password' && (
                        <div className="animate-fade-in-fast">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Change Password</h3>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <InputField label="Current Password" id="currentPassword" name="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                <InputField label="New Password" id="newPassword" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                <InputField label="Confirm New Password" id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                {passwordMessage.text && (
                                    <div className={`text-center p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{passwordMessage.text}</div>
                                )}
                                <button type="submit" disabled={passwordLoading} className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 disabled:bg-slate-400">
                                {passwordLoading ? 'Updating...' : 'Change Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {isEditModalOpen && (
                 <TeacherEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    teacher={currentTeacher}
                    onSave={handleSaveChanges}
                    allSubjects={allSubjects}
                    allCenters={allCenters}
                />
            )}
            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create Group Chat">
                <form onSubmit={handleGroupCreate} className="p-6 space-y-4">
                    <InputField label="Group Name" value={groupName} onChange={e => setGroupName(e.target.value)} required />
                    <p className="text-sm text-slate-500">This will create a group with all {allMyStudents.length} of your students.</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => setIsGroupModalOpen(false)} className="bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500">Create Group</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default TeacherProfileView;
