import React, { useState, useMemo } from 'react';
import type { User, Enrollment, Payment, Subject, Teacher, Center, ConfirmedBookingDetails } from '../types';
import { useDragToScroll } from '../hooks/useDragToScroll';

interface ProfileViewProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  onUpdatePassword: (userId: string, currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  onBack: () => void;
  allEnrollments: Enrollment[];
  allPayments: Payment[];
  allSubjects: Subject[];
  allTeachers: Teacher[];
  allCenters: Center[];
  allBookings: ConfirmedBookingDetails[];
  onAddPayment: (payment: Omit<Payment, 'id' | 'status'>) => Promise<void>;
  onDownloadReceipt: (booking: ConfirmedBookingDetails) => void;
  onDownloadMonthlyReceipt: (payment: Payment) => void;
  onStartChat: (partner: Teacher | User) => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input {...props} className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500" />
    </div>
);

const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};


const PaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    enrollment: Enrollment;
    paymentForMonth: string;
    paymentForYear: number;
    onAddPayment: (payment: Omit<Payment, 'id' | 'status'>) => Promise<void>;
}> = ({ isOpen, onClose, enrollment, paymentForMonth, paymentForYear, onAddPayment }) => {
    const [paymentMethod] = useState<'Bkash' | 'Cash in Hand'>('Bkash');
    const [bkashNumber, setBkashNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentMethod === 'Bkash' && (!bkashNumber || !transactionId)) {
            setError('For Bkash payments, number and transaction ID are required.');
            return;
        }
        setLoading(true);
        setError('');

        await onAddPayment({
            enrollmentId: enrollment.id,
            userId: enrollment.userId,
            paymentForMonth,
            paymentForYear,
            amountPaid: enrollment.monthlyFee,
            paymentDate: new Date(),
            paymentMethod,
            bkashNumber,
            transactionId,
        });
        
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b flex justify-between items-center">
                    <h3 id="payment-modal-title" className="text-xl font-bold text-slate-800">Pay for {paymentForMonth} {paymentForYear}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl" aria-label="Close payment modal">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-slate-600">Amount Due:</p>
                        <p className="text-3xl font-bold text-blue-600">Tk {enrollment.monthlyFee.toLocaleString()}</p>
                    </div>
                    
                    <div className="space-y-4 animate-fade-in-fast p-4 bg-slate-50 rounded-lg border">
                        <p className="text-sm text-slate-600">Send payment to Bkash number: <strong>01314412016</strong> and enter the details below.</p>
                        <InputField label="Your Bkash Number" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} required />
                        <InputField label="Transaction ID (TrxID)" value={transactionId} onChange={e => setTransactionId(e.target.value)} required />
                    </div>
                    
                    {error && <p className="text-red-600 text-sm font-medium text-center">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full bg-amber-400 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-500 disabled:bg-amber-300">
                        {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </form>
            </div>
        </div>
    )
};


const EnrollmentCard: React.FC<{
    enrollment: Enrollment;
    payments: Payment[];
    subject?: Subject;
    teacher?: Teacher;
    center?: Center;
    originalBooking?: ConfirmedBookingDetails;
    onPayNow: (month: string, year: number) => void;
    onDownloadReceipt: (booking: ConfirmedBookingDetails) => void;
    onDownloadMonthlyReceipt: (payment: Payment) => void;
}> = ({ enrollment, payments, subject, teacher, center, originalBooking, onPayNow, onDownloadReceipt, onDownloadMonthlyReceipt }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const paymentStatusByMonth = useMemo(() => {
        const statuses: { month: string; year: number; status: 'Paid' | 'Due' | 'Pending'; amount: number; payment?: Payment }[] = [];
        const today = new Date();
        let currentDate = new Date(enrollment.startDate);
        currentDate.setDate(1);

        while (currentDate <= today) {
            const month = currentDate.toLocaleString('default', { month: 'long' });
            const year = currentDate.getFullYear();
            const paymentForMonth = payments.find(p => p.paymentForMonth === month && p.paymentForYear === year);

            if (paymentForMonth) {
                if (paymentForMonth.status === 'confirmed' || !paymentForMonth.status) { // Treat old data without status as confirmed
                    statuses.push({ month, year, status: 'Paid', amount: paymentForMonth.amountPaid, payment: paymentForMonth });
                } else { // status is 'pending'
                    statuses.push({ month, year, status: 'Pending', amount: paymentForMonth.amountPaid, payment: paymentForMonth });
                }
            } else {
                statuses.push({ month, year, status: 'Due', amount: enrollment.monthlyFee });
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return statuses.reverse();
    }, [enrollment.startDate, enrollment.monthlyFee, payments]);

    if (!subject || !teacher || !center) {
        return <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-500">Loading enrollment details...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-200">
             <div className="w-full text-left p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
                            <h4 className="font-bold text-lg text-blue-600">{subject.name}</h4>
                            {originalBooking?.bookingType === 'Admission' && (
                                <>
                                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                                        Admitted
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDownloadReceipt(originalBooking); }}
                                        className="text-xs bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-md hover:bg-slate-300 transition-colors"
                                    >
                                        Receipt
                                    </button>
                                </>
                            )}
                            {originalBooking?.bookingType === 'Trial' && (
                                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                                    From Trial
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-600 font-medium mt-1">with {teacher.name}</p>
                        <p className="text-sm text-slate-500">{enrollment.batchName}</p>
                        <p className="text-sm font-semibold text-slate-600 mt-1">
                           {enrollment.days.join(', ')} at {formatTime12Hour(enrollment.time)}
                        </p>
                    </div>

                    <button onClick={() => setIsExpanded(!isExpanded)} className="flex-shrink-0 p-2 -mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
             {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in-fast">
                    <div className="bg-slate-50 rounded-lg p-4 border">
                        <h5 className="font-semibold text-slate-700 mb-3">Payment History & Dues</h5>
                        <div className="space-y-2">
                            {paymentStatusByMonth.map(({ month, year, status, amount, payment }) => (
                                <div key={`${month}-${year}`} className="p-3 bg-white rounded-md border flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div>
                                        <p className="font-medium text-slate-800">{month} {year}</p>
                                        <p className="text-xs text-slate-500">{status === 'Paid' && payment ? `Paid on ${payment.paymentDate?.toLocaleDateString()}` : 'Payment is due'}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                         <p className="font-semibold text-slate-800 text-sm">Tk {amount.toLocaleString()}</p>
                                         {status === 'Due' ? (
                                             <button onClick={() => onPayNow(month, year)} className="bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg hover:bg-blue-700 text-xs">Pay Now</button>
                                         ) : status === 'Pending' ? (
                                             <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">Pending</span>
                                         ) : payment ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-green-600 font-bold text-sm">Paid</span>
                                                <button onClick={() => onDownloadMonthlyReceipt(payment)} className="text-xs bg-slate-200 text-slate-700 font-semibold py-1 px-3 rounded-md hover:bg-slate-300">Receipt</button>
                                            </div>
                                         ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onUpdateUser, onUpdatePassword, onBack, allEnrollments, allPayments, allSubjects, allTeachers, allCenters, allBookings, onAddPayment, onDownloadReceipt, onDownloadMonthlyReceipt, onStartChat }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'enrollments' | 'password' | 'teachers'>('enrollments');
  const [formData, setFormData] = useState<User>(currentUser);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{enrollment: Enrollment, month: string, year: number} | null>(null);
  const tabsScrollRef = useDragToScroll();

  const myTeachers = useMemo(() => {
    const teacherIds = [...new Set(allEnrollments.map(e => e.teacherId))];
    return teacherIds.map(id => {
        const teacher = allTeachers.find(t => t.id === id);
        const enrollmentsWithThisTeacher = allEnrollments.filter(e => e.teacherId === id);
        const subjectsTaught = enrollmentsWithThisTeacher.map(e => {
            return allSubjects.find(s => s.id === e.subjectId);
        }).filter((s): s is Subject => !!s);
        return { teacher, subjects: subjectsTaught };
    }).filter((data): data is { teacher: Teacher, subjects: Subject[] } => !!data.teacher);
  }, [allEnrollments, allTeachers, allSubjects]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setSuccessMessage('Your profile has been updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
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

    setPasswordLoading(true);
    const result = await onUpdatePassword(currentUser.id, currentPassword, newPassword);
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

  const handlePayNow = (enrollment: Enrollment, month: string, year: number) => {
      setPaymentDetails({ enrollment, month, year });
      setIsPaymentModalOpen(true);
  };

  const TabButton: React.FC<{tabId: typeof activeTab, label: string}> = ({ tabId, label }) => (
      <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors flex-shrink-0 whitespace-nowrap ${activeTab === tabId ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
          {label}
      </button>
  );

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 max-w-2xl mx-auto">
        <div className="p-6 sm:p-8">
            <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Back
            </button>
            <div className="flex items-center space-x-4">
                {currentUser.imageUrl ? (
                    <img src={currentUser.imageUrl} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {currentUser.name.charAt(0)}
                    </div>
                )}
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{currentUser.name}</h2>
                    <p className="text-slate-500">{currentUser.email}</p>
                </div>
            </div>
        </div>

        <div ref={tabsScrollRef} className="px-6 border-b border-slate-200 flex flex-nowrap space-x-2 overflow-x-auto no-scrollbar horizontal-scroll">
           <TabButton tabId="enrollments" label="My Enrollments" />
           <TabButton tabId="teachers" label="My Teachers" />
           <TabButton tabId="profile" label="Profile Details" />
           <TabButton tabId="password" label="Change Password" />
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'profile' && (
            <div className="animate-fade-in-fast">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Update Your Information</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <InputField label="Email" id="email" name="email" type="email" value={formData.email} disabled readOnly />
                  <InputField label="Full Name" id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} required />
                  <InputField label="Phone Number" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                  <InputField label="Address" id="address" name="address" type="text" value={formData.address} onChange={handleInputChange} required />
                  <InputField label="Profile Picture URL" id="imageUrl" name="imageUrl" type="text" value={formData.imageUrl || ''} onChange={handleInputChange} placeholder="https://example.com/image.png" />
                  <div className="pt-4">
                       {successMessage && <div className="mb-4 text-center p-3 bg-green-100 text-green-800 rounded-lg">{successMessage}</div>}
                      <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save Changes</button>
                  </div>
              </form>
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div className="animate-fade-in-fast">
               <h3 className="text-xl font-bold text-slate-900 mb-6">My Enrollments</h3>
                {allEnrollments.length > 0 ? (
                    <div className="space-y-4">
                        {allEnrollments.map(enrollment => (
                            <EnrollmentCard
                                key={enrollment.id}
                                enrollment={enrollment}
                                payments={allPayments.filter(p => p.enrollmentId === enrollment.id)}
                                subject={allSubjects.find(s => s.id === enrollment.subjectId)}
                                teacher={allTeachers.find(t => t.id === enrollment.teacherId)}
                                center={allCenters.find(c => c.id === enrollment.centerId)}
                                originalBooking={allBookings.find(b => b.id === enrollment.originalBookingId)}
                                onPayNow={(month, year) => handlePayNow(enrollment, month, year)}
                                onDownloadReceipt={onDownloadReceipt}
                                onDownloadMonthlyReceipt={onDownloadMonthlyReceipt}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-lg"><p className="text-slate-500">You have no active enrollments.</p></div>
                )}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="animate-fade-in-fast">
                <h3 className="text-xl font-bold text-slate-900 mb-6">My Teachers</h3>
                <div className="space-y-4">
                    {myTeachers.length > 0 ? myTeachers.map(({ teacher, subjects }) => (
                        <div key={teacher.id} className="bg-white rounded-xl shadow-lg shadow-blue-500/5 p-4 flex items-center justify-between space-x-4 border border-slate-200">
                            <div className="flex items-center space-x-4 overflow-hidden">
                                <img src={teacher.imageUrl} alt={teacher.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0"/>
                                <div className="overflow-hidden">
                                    <h4 className="font-bold text-lg text-slate-800 truncate">{teacher.name}</h4>
                                    <p className="text-sm font-semibold text-blue-600 truncate">{subjects.map(s => s.name).join(', ')}</p>
                                    <div className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                        <span className="truncate">{teacher.email}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onStartChat(teacher)} 
                                disabled={!teacher.uid}
                                title={teacher.uid ? "Start a chat" : "This teacher has not activated their account for chat yet."}
                                className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 text-sm flex items-center space-x-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                                <span>Chat</span>
                            </button>
                        </div>
                    )) : (
                        <div className="text-center py-6 bg-slate-50 rounded-lg"><p className="text-slate-500">You are not enrolled with any teachers yet.</p></div>
                    )}
                </div>
            </div>
           )}

          {activeTab === 'password' && (
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

       {isPaymentModalOpen && paymentDetails && (
            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                enrollment={paymentDetails.enrollment}
                paymentForMonth={paymentDetails.month}
                paymentForYear={paymentDetails.year}
                onAddPayment={onAddPayment}
            />
        )}
    </div>
  );
};

export default ProfileView;