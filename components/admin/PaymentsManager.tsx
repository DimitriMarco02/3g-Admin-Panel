import React, { useState, useMemo } from 'react';
import type { AdminViewProps } from './types';
import { Section, formatTime12Hour } from './shared';
import Pagination from '../Pagination';

const PaymentsManager: React.FC<AdminViewProps> = ({
    allBookings,
    onUpdateBookingStatus,
    allPayments,
    allEnrollments,
    allUsers,
    allSubjects,
    allTeachers,
    onUpdatePayment,
    onDeletePayment
}) => {
    const [paymentView, setPaymentView] = useState<'admission' | 'tuition'>('admission');
    const [admissionPage, setAdmissionPage] = useState(1);
    const [tuitionPage, setTuitionPage] = useState(1);
    const paymentsPerPage = 5;

    const admissionRequests = useMemo(() =>
        allBookings
            .filter(b => b.status === 'Pending Admission')
            .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()),
        [allBookings]
    );
    
    const totalAdmissionPages = Math.ceil(admissionRequests.length / paymentsPerPage);
    const paginatedAdmissionRequests = admissionRequests.slice((admissionPage - 1) * paymentsPerPage, admissionPage * paymentsPerPage);


    const handleConfirmAdmission = (bookingId: string) => {
        if (window.confirm('Are you sure you want to confirm this payment and enroll the student?')) {
            onUpdateBookingStatus(bookingId, 'Admitted');
        }
    };

    const pendingTuitionFees = useMemo(() => {
        return allPayments
            .filter(p => p.status === 'pending')
            .map(p => {
                const enrollment = allEnrollments.find(e => e.id === p.enrollmentId);
                const student = enrollment ? allUsers.find(u => u.id === enrollment.userId) : undefined;
                const subject = enrollment ? allSubjects.find(s => s.id === enrollment.subjectId) : undefined;
                const teacher = enrollment ? allTeachers.find(t => t.id === enrollment.teacherId) : undefined;
                return { ...p, enrollment, student, subject, teacher };
            })
            .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
    }, [allPayments, allEnrollments, allUsers, allSubjects, allTeachers]);

    const totalTuitionPages = Math.ceil(pendingTuitionFees.length / paymentsPerPage);
    const paginatedTuitionFees = pendingTuitionFees.slice((tuitionPage - 1) * paymentsPerPage, tuitionPage * paymentsPerPage);

    const handleConfirmTuition = (paymentId: string) => {
        if (window.confirm('Are you sure you want to confirm this payment?')) {
            onUpdatePayment(paymentId, { status: 'confirmed' });
        }
    };

    const handleDeleteTuition = (paymentId: string) => {
        if (window.confirm('Are you sure you want to delete/reject this pending payment? This cannot be undone.')) {
            onDeletePayment(paymentId);
        }
    };
    
    const PaymentViewButton = ({ view, label, count }: { view: 'admission' | 'tuition', label: string, count: number }) => (
        <button
            onClick={() => setPaymentView(view)}
            className={`flex-1 sm:flex-none px-4 py-3 text-sm font-bold transition-colors duration-200 rounded-lg flex justify-center items-center space-x-2 ${
                paymentView === view
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
        >
            <span>{label}</span>
            <span className={`h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold ${paymentView === view ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'}`}>
                {count}
            </span>
        </button>
    );

    return (
        <Section title="Manage Payments" subtitle="Confirm student payments for admissions and monthly fees.">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-slate-100 p-2 rounded-xl mb-6">
                <PaymentViewButton view="admission" label="Admission Fees" count={admissionRequests.length} />
                <PaymentViewButton view="tuition" label="Tuition Fees" count={pendingTuitionFees.length} />
            </div>

            {paymentView === 'admission' && (
                <div className="animate-fade-in-fast">
                    {admissionRequests.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {paginatedAdmissionRequests.map(b => (
                                    <div key={b.id} className="bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <div className="md:col-span-2 space-y-2">
                                                <h4 className="font-bold text-lg text-slate-800">{b.studentName}</h4>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Contact:</strong> {b.phone}</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Subject:</strong> {b.subject.name} with {b.teacher.name}</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Schedule:</strong> {b.batchName} ({b.days?.join('/')} at {b.time ? formatTime12Hour(b.time) : 'N/A'})</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Booked on:</strong> {new Date(b.dateTime).toLocaleDateString()}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg border self-start">
                                                <h5 className="text-xs font-bold text-slate-500 uppercase">Payment Details</h5>
                                                {b.paymentDetails ? (
                                                    <div className="mt-1 text-sm space-y-1">
                                                        <p><strong className="font-semibold w-20 inline-block">Method:</strong> {b.paymentDetails.paymentMethod}</p>
                                                        <p><strong className="font-semibold w-20 inline-block">Amount:</strong> Tk {b.paymentDetails.amountPaid?.toLocaleString() || 'N/A'}</p>
                                                        {b.paymentDetails.paymentMethod === 'Bkash' && (
                                                            <>
                                                                <p><strong className="font-semibold w-20 inline-block">Number:</strong> {b.paymentDetails.bkashNumber}</p>
                                                                <p><strong className="font-semibold w-20 inline-block">TrxID:</strong> {b.paymentDetails.transactionId}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-500 mt-1">No payment details submitted.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t flex justify-end">
                                            <button
                                                onClick={() => handleConfirmAdmission(b.id)}
                                                disabled={!b.paymentDetails}
                                                className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                                            >
                                                Confirm Admission
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination currentPage={admissionPage} totalPages={totalAdmissionPages} onPageChange={setAdmissionPage} />
                        </>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl shadow-inner border border-slate-100">
                            <p className="text-slate-500">No pending admission fees.</p>
                        </div>
                    )}
                </div>
            )}
            
            {paymentView === 'tuition' && (
                 <div className="animate-fade-in-fast">
                    {pendingTuitionFees.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {paginatedTuitionFees.map(p => (
                                    <div key={p.id} className="bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <div className="md:col-span-2 space-y-2">
                                                <h4 className="font-bold text-lg text-slate-800">{p.student?.name}</h4>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Contact:</strong> {p.student?.phone}</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">For:</strong> {p.subject?.name} with {p.teacher?.name}</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Schedule:</strong> {p.enrollment?.batchName} ({p.enrollment?.days.join('/')} at {p.enrollment ? formatTime12Hour(p.enrollment.time) : 'N/A'})</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Fee for:</strong> {p.paymentForMonth} {p.paymentForYear}</p>
                                                <p className="text-sm text-slate-500"><strong className="text-slate-600">Submitted:</strong> {new Date(p.paymentDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg border self-start">
                                                <h5 className="text-xs font-bold text-slate-500 uppercase">Payment Details</h5>
                                                <div className="mt-1 text-sm space-y-1">
                                                    <p><strong className="font-semibold w-20 inline-block">Method:</strong> {p.paymentMethod}</p>
                                                    <p><strong className="font-semibold w-20 inline-block">Amount:</strong> Tk {p.amountPaid?.toLocaleString() || 'N/A'}</p>
                                                    <p><strong className="font-semibold w-20 inline-block">Number:</strong> {p.bkashNumber}</p>
                                                    <p><strong className="font-semibold w-20 inline-block">TrxID:</strong> {p.transactionId}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleDeleteTuition(p.id)}
                                                className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg hover:bg-red-200"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleConfirmTuition(p.id)}
                                                className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600"
                                            >
                                                Confirm Payment
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination currentPage={tuitionPage} totalPages={totalTuitionPages} onPageChange={setTuitionPage} />
                        </>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl shadow-inner border border-slate-100">
                            <p className="text-slate-500">No pending tuition fees.</p>
                        </div>
                    )}
                </div>
            )}
        </Section>
    );
};

export default PaymentsManager;
