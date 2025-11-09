import React, { useState, useMemo, useEffect } from 'react';
import type { User, Enrollment, Payment, Subject, Teacher, Center } from '../../types';
import type { AdminViewProps } from './types';
import { Modal, SelectField, Section, formatTime12Hour } from './shared';
import Pagination from '../Pagination';


const StudentsManager: React.FC<AdminViewProps> = ({ allEnrollments, allPayments, allUsers, allSubjects, allTeachers, allCenters, onAddPayment, onUpdateEnrollment, onDeleteEnrollment }) => {
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const enrolledStudentsData = useMemo(() => {
        const studentsMap: { [key: string]: { student: User, enrollments: Enrollment[] } } = {};
        allEnrollments.forEach(enrollment => {
            const student = allUsers.find(u => u.id === enrollment.userId);
            if (student) {
                if (!studentsMap[student.id]) {
                    studentsMap[student.id] = { student, enrollments: [] };
                }
                studentsMap[student.id].enrollments.push(enrollment);
            }
        });
        return Object.values(studentsMap);
    }, [allEnrollments, allUsers]);


    const filteredStudents = useMemo(() => {
        return enrolledStudentsData
            .filter(({ student, enrollments }) => {
                const searchMatch = !searchTerm || 
                    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    enrollments.some(e => allSubjects.find(s => s.id === e.subjectId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const hasActiveEnrollment = enrollments.some(e => e.isActive);
                const statusMatch = statusFilter === 'all' || 
                                    (statusFilter === 'active' && hasActiveEnrollment) ||
                                    (statusFilter === 'inactive' && !hasActiveEnrollment);
                return searchMatch && statusMatch;
            })
            .sort((a, b) => a.student.name.localeCompare(b.student.name));
    }, [enrolledStudentsData, searchTerm, statusFilter, allSubjects]);

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);

    return (
        <Section title="Manage Students" subtitle="View admitted students and manage their enrollments.">
            <div className="p-4 mb-4 bg-slate-50 rounded-lg border flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search by Name, ID, or Subject</label>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black"/>
                </div>
                <div className="w-full sm:w-48">
                    <SelectField label="Filter by Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                        <option value="all">All Statuses</option>
                        <option value="active">Has Active Enrollment</option>
                        <option value="inactive">All Inactive</option>
                    </SelectField>
                </div>
            </div>
            
            {filteredStudents.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {paginatedStudents.map(({ student, enrollments }) => (
                            <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-slate-100 gap-4">
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800">{student.name}</p>
                                    <p className="text-sm text-slate-500 font-mono">{student.studentId || 'No ID assigned'}</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Enrolled in {enrollments.length} subject{enrollments.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4 w-full sm:w-auto">
                                    <button onClick={() => setSelectedStudent(student)} className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 text-sm">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                <p className="text-center text-slate-500 py-8">No students match the current filters.</p>
            )}

            {selectedStudent && (
                 <StudentDetailModal
                    isOpen={!!selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    student={selectedStudent}
                    enrollments={allEnrollments.filter(e => e.userId === selectedStudent.id)}
                    allPayments={allPayments}
                    allSubjects={allSubjects}
                    allTeachers={allTeachers}
                    allCenters={allCenters}
                    onAddPayment={onAddPayment}
                    onDeleteEnrollment={onDeleteEnrollment}
                />
            )}
        </Section>
    )
}

const StudentDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: User;
    enrollments: Enrollment[];
    allPayments: Payment[];
    allSubjects: Subject[];
    allTeachers: Teacher[];
    allCenters: Center[];
    onAddPayment: (payment: Omit<Payment, 'id' | 'status'>) => void;
    onDeleteEnrollment: (enrollmentId: string) => void;
}> = ({ isOpen, onClose, student, enrollments, allPayments, allSubjects, allTeachers, allCenters, onAddPayment, onDeleteEnrollment }) => {
    
    const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(null);

    useEffect(() => {
        if (enrollments.length > 0) {
            setActiveEnrollmentId(enrollments[0].id);
        } else {
            setActiveEnrollmentId(null);
        }
    }, [enrollments]);

    const activeEnrollment = useMemo(() => {
        return enrollments.find(e => e.id === activeEnrollmentId);
    }, [activeEnrollmentId, enrollments]);

    const activeEnrollmentPayments = useMemo(() => {
        if (!activeEnrollmentId) return [];
        return allPayments.filter(p => p.enrollmentId === activeEnrollmentId);
    }, [activeEnrollmentId, allPayments]);


    const handleDelete = (enrollment: Enrollment) => {
        const subject = allSubjects.find(s => s.id === enrollment.subjectId);
        if (window.confirm(`Are you sure you want to delete the enrollment for ${enrollment.studentName} in ${subject?.name}? This will also delete all associated payment records and cannot be undone.`)) {
            onDeleteEnrollment(enrollment.id);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Student Details`}>
            <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center font-bold text-2xl text-blue-600">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="text-2xl font-bold text-slate-800">{student.name}</h4>
                        <p className="text-slate-500">{student.email}</p>
                        <p className="text-slate-500">{student.phone}</p>
                        <p className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">{student.studentId || 'No ID Assigned'}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-1 border-b mb-4 -mx-6 px-6">
                    {enrollments.map(enrollment => {
                        const subject = allSubjects.find(s => s.id === enrollment.subjectId);
                        return (
                            <button
                                key={enrollment.id}
                                onClick={() => setActiveEnrollmentId(enrollment.id)}
                                className={`px-4 py-3 font-semibold text-sm rounded-t-lg -mb-px transition-colors ${
                                    activeEnrollmentId === enrollment.id
                                    ? 'border-x border-t border-slate-300 bg-white text-blue-600'
                                    : 'border-transparent text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {subject?.name || 'Unknown Subject'}
                            </button>
                        )
                    })}
                </div>

                {activeEnrollment && (
                    <div className="animate-fade-in-fast">
                        <EnrollmentPaymentDetails
                            key={activeEnrollment.id}
                            enrollment={activeEnrollment}
                            payments={activeEnrollmentPayments}
                            subject={allSubjects.find(s => s.id === activeEnrollment.subjectId)}
                            teacher={allTeachers.find(t => t.id === activeEnrollment.teacherId)}
                            center={allCenters.find(c => c.id === activeEnrollment.centerId)}
                            onAddPayment={onAddPayment}
                        />
                        <div className="mt-6 pt-6 border-t">
                            <button onClick={() => handleDelete(activeEnrollment)} className="text-sm font-semibold text-red-600 hover:underline">
                                Delete this Enrollment
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

const EnrollmentPaymentDetails: React.FC<{
    enrollment: Enrollment;
    payments: Payment[];
    subject?: Subject;
    teacher?: Teacher;
    center?: Center;
    onAddPayment: (payment: Omit<Payment, 'id' | 'status'>) => void;
}> = ({ enrollment, payments, subject, teacher, center, onAddPayment }) => {
    const [paymentForm, setPaymentForm] = useState<{ month: string, year: number } | null>(null);

    const paymentStatusByMonth = useMemo(() => {
        const statuses: { month: string; year: number; status: 'Paid' | 'Due' | 'Pending'; amount: number, paymentDate?: Date }[] = [];
        if (!enrollment.startDate) return [];
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
                } else { // 'pending'
                    statuses.push({ month, year, status: 'Pending', amount: paymentForMonth.amountPaid, paymentDate: paymentForMonth.paymentDate });
                }
            } else {
                statuses.push({ month, year, status: 'Due', amount: enrollment.monthlyFee });
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return statuses.reverse();
    }, [enrollment, payments]);

    const handleAddPaymentClick = (month: string, year: number) => {
        setPaymentForm({ month, year });
    }

    const handlePaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!paymentForm) return;

        const formData = new FormData(e.currentTarget);
        const paymentMethod = formData.get('paymentMethod') as string;
        
        onAddPayment({
            enrollmentId: enrollment.id,
            userId: enrollment.userId,
            paymentForMonth: paymentForm.month,
            paymentForYear: paymentForm.year,
            amountPaid: enrollment.monthlyFee,
            paymentDate: new Date(),
            paymentMethod,
        });

        setPaymentForm(null);
    }
    
    return (
        <div>
            <div className="mb-4 bg-slate-50 p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong className="text-slate-600">Subject:</strong> {subject?.name} ({enrollment.classLevel})</p>
                <p><strong className="text-slate-600">Teacher:</strong> {teacher?.name}</p>
                <p><strong className="text-slate-600">Center:</strong> {center?.name}</p>
                <p><strong className="text-slate-600">Monthly Fee:</strong> Tk {enrollment.monthlyFee.toLocaleString()}</p>
                <p className="sm:col-span-2"><strong className="text-slate-600">Schedule:</strong> {enrollment.days.join(', ')} at {formatTime12Hour(enrollment.time)}</p>
            </div>
            <div className="space-y-2">
                {paymentStatusByMonth.map(({ month, year, status, amount, paymentDate }) => (
                    <div key={`${month}-${year}`} className="p-3 bg-white rounded-lg border">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-800">{month} {year}</p>
                                <p className={`text-sm font-bold ${
                                    status === 'Paid' ? 'text-green-600' : 
                                    status === 'Pending' ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                    {status === 'Paid' ? `Paid Tk ${amount.toLocaleString()} on ${paymentDate?.toLocaleDateString()}` : 
                                    status === 'Pending' ? `Pending Tk ${amount.toLocaleString()}` :
                                    `Due Tk ${amount.toLocaleString()}`}
                                </p>
                            </div>
                            {status === 'Due' && !paymentForm && (
                                <button onClick={() => handleAddPaymentClick(month, year)} className="bg-green-100 text-green-800 font-semibold py-1 px-3 rounded-lg hover:bg-green-200 text-sm">
                                    Add Payment
                                </button>
                            )}
                            {status === 'Pending' && (
                                 <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">
                                    Pending
                                </span>
                            )}
                        </div>
                        {paymentForm?.month === month && paymentForm?.year === year && (
                            <form onSubmit={handlePaymentSubmit} className="mt-3 pt-3 border-t animate-fade-in-fast space-y-3">
                                <h4 className="font-semibold text-sm">Add payment for {month} {year}</h4>
                                <SelectField label="Payment Method" name="paymentMethod" defaultValue="Cash">
                                    <option>Cash</option>
                                    <option>Bkash</option>
                                    <option>Bank</option>
                                </SelectField>
                                <div className="flex space-x-2">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Confirm Payment</button>
                                    <button type="button" onClick={() => setPaymentForm(null)} className="flex-1 bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default StudentsManager;
