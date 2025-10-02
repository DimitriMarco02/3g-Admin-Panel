
import React, { useState, useMemo, useEffect } from 'react';
import type { ConfirmedBookingDetails, Subject, Teacher, Center, User, BookingStatus, TeacherSchedule, Experience, Education, Review, OfferSlide, Notice, DiamondStudent, StudentResult } from '../types';

interface AdminViewProps {
  logoUrl: string;
  allBookings: ConfirmedBookingDetails[];
  allSubjects: Subject[];
  allTeachers: Teacher[];
  allCenters: Center[];
  allUsers: User[];
  allSlides: OfferSlide[];
  allNotices: Notice[];
  allDiamondStudents: DiamondStudent[];
  onUpdateBooking: (booking: ConfirmedBookingDetails) => void;
  onDeleteBooking: (id: number) => void;
  onUpdateBookingStatus: (bookingId: number, status: BookingStatus) => void;
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: number) => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: number) => void;
  onAddCenter: (center: Omit<Center, 'id'>) => void;
  onUpdateCenter: (center: Center) => void;
  onDeleteCenter: (id: number) => void;
  onUpdateLogoUrl: (url: string) => void;
  onAddSlide: (slide: Omit<OfferSlide, 'id'>) => void;
  onUpdateSlide: (slide: OfferSlide) => void;
  onDeleteSlide: (id: number) => void;
  onAddNotice: (notice: Omit<Notice, 'id'>) => void;
  onUpdateNotice: (notice: Notice) => void;
  onDeleteNotice: (id: number) => void;
  onAddDiamondStudent: (student: Omit<DiamondStudent, 'id'>) => void;
  onUpdateDiamondStudent: (student: DiamondStudent) => void;
  onDeleteDiamondStudent: (id: number) => void;
}

type AdminTab = 'bookings' | 'subjects' | 'teachers' | 'centers' | 'home' | 'diamondStudents';


const AdminView: React.FC<AdminViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');
  
  const TabButton = ({ tab, label }: { tab: AdminTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-2 text-center sm:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 w-full sm:w-auto ${
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
      case 'home': return <HomeManager {...props} />;
      case 'bookings': return <BookingsManager {...props} />;
      case 'subjects': return <SubjectsManager {...props} />;
      case 'teachers': return <TeachersManager {...props} />;
      case 'centers': return <CentersManager {...props} />;
      case 'diamondStudents': return <DiamondStudentsManager {...props} />;
      default: return null;
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Panel</h2>
      </div>
      <div className="mb-8 bg-slate-100 p-1.5 rounded-xl grid grid-cols-3 gap-1.5 sm:flex sm:flex-row sm:space-x-1 sm:gap-0">
        <TabButton tab="bookings" label="Bookings" />
        <TabButton tab="subjects" label="Subjects" />
        <TabButton tab="teachers" label="Teachers" />
        <TabButton tab="centers" label="Centers" />
        <TabButton tab="home" label="Home Page" />
        <TabButton tab="diamondStudents" label="Students" />
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

const ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void; }> = ({ onEdit, onDelete }) => (
    <div className="flex items-center space-x-2 flex-shrink-0">
        <button onClick={onEdit} className="text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-slate-100" aria-label="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
        </button>
        <button onClick={onDelete} className={`text-slate-500 p-1.5 rounded-md transition-colors hover:text-red-600 hover:bg-red-100`} aria-label="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
        </button>
    </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b sticky top-0 bg-white z-10 rounded-t-xl flex-shrink-0">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700" aria-label="Close modal">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea {...props} rows={4} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; containerClassName?: string }> = ({ label, children, containerClassName, ...props }) => (
    <div className={`w-full ${containerClassName}`}>
        {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
        <select {...props} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {children}
        </select>
    </div>
);

const Section: React.FC<{ title: string; subtitle?: string; button?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, button, children }) => (
    <div className="bg-white rounded-xl shadow-lg shadow-blue-500/5 p-4 sm:p-6 border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
            <div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            {button}
        </div>
        <div>{children}</div>
    </div>
);

const BookingsManager: React.FC<AdminViewProps> = ({ allBookings, onDeleteBooking, onUpdateBookingStatus }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All Statuses'>('All Statuses');

    const filteredBookings = useMemo(() => {
        return allBookings
            .filter(b => statusFilter === 'All Statuses' || b.status === statusFilter)
            .filter(b => {
                const s = searchTerm.toLowerCase();
                if (!s) return true;
                return (
                    b.studentName.toLowerCase().includes(s) ||
                    b.subject.name.toLowerCase().includes(s) ||
                    b.teacher.name.toLowerCase().includes(s) ||
                    b.paymentDetails?.bkashNumber?.includes(s) ||
                    b.paymentDetails?.transactionId?.toLowerCase().includes(s)
                );
            })
            .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }, [allBookings, searchTerm, statusFilter]);

    const getStatusStyles = (status: BookingStatus) => {
        switch (status) {
            case 'Admitted': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Pending Admission': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'Canceled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const handleDelete = (booking: ConfirmedBookingDetails) => {
        if (window.confirm(`Are you sure you want to delete the booking for ${booking.studentName} on ${booking.dateTime.toLocaleDateString()}?`)) {
            onDeleteBooking(booking.id);
        }
    }
    
    return (
        <div className="space-y-6">
            <div className="p-4 bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
                <input
                    type="text"
                    placeholder="Search student, subject, teacher..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80 p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <SelectField label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} containerClassName="sm:w-auto" className="w-full sm:w-auto">
                    <option>All Statuses</option>
                    {(['Booked', 'Completed', 'Canceled', 'Pending Admission', 'Admitted'] as BookingStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                </SelectField>
            </div>
            
            {filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBookings.map(b => (
                        <div key={b.id} className="bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-slate-800 pr-2">{b.subject.name}</h4>
                                    <select
                                        value={b.status}
                                        onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as BookingStatus)}
                                        className={`text-xs font-semibold rounded-md p-1 border appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusStyles(b.status)}`}
                                    >
                                      {(['Booked', 'Completed', 'Canceled', 'Pending Admission', 'Admitted'] as BookingStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="text-sm text-slate-500 space-y-2 border-t pt-3 mt-3">
                                    <p><strong className="text-slate-700">Student:</strong> {b.studentName}</p>
                                    <p><strong className="text-slate-700">Teacher:</strong> {b.teacher.name}</p>
                                    <p><strong className="text-slate-700">Date:</strong> {new Date(b.dateTime).toLocaleDateString()} at {new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p><strong className="text-slate-700">Payment:</strong> {b.paymentDetails?.paymentMethod || 'N/A'}</p>
                                    {b.paymentDetails?.paymentMethod === 'Bkash' && 
                                      <div className="text-xs pl-4">
                                          <p>Num: {b.paymentDetails.bkashNumber}</p>
                                          <p>TrxID: {b.paymentDetails.transactionId}</p>
                                      </div>
                                    }
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t flex justify-end">
                                <button onClick={() => handleDelete(b)} className={`text-slate-500 p-1.5 rounded-md transition-colors hover:text-red-600 hover:bg-red-100`} aria-label="Delete Booking">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-inner border border-slate-100">
                    <p className="text-slate-500">No bookings match the current filters.</p>
                </div>
            )}
        </div>
    );
};


const SubjectsManager: React.FC<AdminViewProps> = ({ allSubjects, onAddSubject, onUpdateSubject, onDeleteSubject, allTeachers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | Omit<Subject, 'id'> | null>(null);

    const openModalForNew = () => { setEditingSubject({ name: '', description: '', imageUrl: '' }); setIsModalOpen(true); };
    const openModalForEdit = (subject: Subject) => { setEditingSubject(subject); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingSubject(null); };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubject) return;
        if ('id' in editingSubject) { onUpdateSubject(editingSubject); } 
        else { onAddSubject(editingSubject); }
        closeModal();
    };
    
    const isSubjectInUse = (id: number) => allTeachers.some(t => t.subjectId === id);
    
    const handleDelete = (subject: Subject) => {
        if (isSubjectInUse(subject.id)) {
            alert(`Cannot delete "${subject.name}". It is assigned to one or more teachers. Please reassign the teachers before deleting.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the subject "${subject.name}"?`)) {
            onDeleteSubject(subject.id);
        }
    };

    return (
        <Section title="Manage Subjects" button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">+ Add Subject</button>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSubjects.map(s => (
                    <div key={s.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                        <img src={s.imageUrl} alt={s.name} className="w-16 h-16 object-cover rounded-md mr-4 bg-slate-200 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                            <p className="font-bold text-slate-800">{s.name}</p>
                            <p className="text-sm text-slate-500 truncate" title={s.description}>{s.description}</p>
                        </div>
                        <ActionButtons onEdit={() => openModalForEdit(s)} onDelete={() => handleDelete(s)} />
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSubject && 'id' in editingSubject ? 'Edit Subject' : 'Add Subject'}>
                {editingSubject && <form onSubmit={handleSave} className="p-6 space-y-4"><InputField label="Name" value={editingSubject.name} onChange={e => setEditingSubject({...editingSubject, name: e.target.value})} required /><TextAreaField label="Description" value={editingSubject.description} onChange={e => setEditingSubject({...editingSubject, description: e.target.value})} required /><InputField label="Image URL" value={editingSubject.imageUrl} onChange={e => setEditingSubject({...editingSubject, imageUrl: e.target.value})} required /><button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button></form>}
            </Modal>
        </Section>
    );
};

const TeachersManager: React.FC<AdminViewProps> = ({ allTeachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher, allSubjects, allCenters }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | Omit<Teacher, 'id'> | null>(null);

    const openModalForNew = () => { 
        setEditingTeacher({ 
            name: '', phone: '', subjectId: allSubjects[0]?.id || 0, 
            centerIds: [], imageUrl: '', bannerUrl: '', bio: '', 
            schedule: [], experience: [], education: [], reviews: [] 
        }); 
        setIsModalOpen(true); 
    };
    const openModalForEdit = (teacher: Teacher) => { setEditingTeacher(JSON.parse(JSON.stringify(teacher))); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingTeacher(null); };

    const handleSave = (teacherToSave: Teacher | Omit<Teacher, 'id'>) => {
        if (!teacherToSave.subjectId || teacherToSave.centerIds.length === 0) {
            alert("Please select a subject and at least one center.");
            return;
        }
        if ('id' in teacherToSave) { 
            onUpdateTeacher(teacherToSave); 
        } else { 
            onAddTeacher(teacherToSave); 
        } 
        closeModal();
    };

    const handleDelete = (teacher: Teacher) => {
        if (window.confirm(`Are you sure you want to delete the teacher "${teacher.name}"?`)) {
            onDeleteTeacher(teacher.id);
        }
    };
    
    const getTeacherSubtitle = (teacher: Teacher) => {
        const subjectName = allSubjects.find(s => s.id === teacher.subjectId)?.name || '';
        const centerName = allCenters.find(c => teacher.centerIds.includes(c.id))?.name || '';
        return centerName ? `${subjectName} at ${centerName}` : subjectName;
    };

    return (
         <Section title="Manage Teachers" button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">+ Add Teacher</button>}>
            <div className="space-y-3">
                {allTeachers.map(t => (
                    <div key={t.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                        <img src={t.imageUrl} alt={t.name} className="w-12 h-12 object-cover rounded-full mr-4 bg-slate-200" />
                        <div className="flex-grow">
                            <p className="font-bold text-slate-800">{t.name}</p>
                            <p className="text-sm text-slate-500">{getTeacherSubtitle(t)}</p>
                        </div>
                        <ActionButtons onEdit={() => openModalForEdit(t)} onDelete={() => handleDelete(t)} />
                    </div>
                ))}
            </div>
            {isModalOpen && editingTeacher && <TeacherEditModal isOpen={isModalOpen} onClose={closeModal} teacher={editingTeacher} onSave={handleSave} allSubjects={allSubjects} allCenters={allCenters}/>}
        </Section>
    );
};

const TeacherEditModal: React.FC<{ isOpen: boolean, onClose: () => void, teacher: Teacher | Omit<Teacher, 'id'>, onSave: (t: Teacher | Omit<Teacher, 'id'>) => void, allSubjects: Subject[], allCenters: Center[] }> = ({ isOpen, onClose, teacher, onSave, allSubjects, allCenters}) => {
    const [formData, setFormData] = useState(teacher);
    
    // Local state to manage the raw string input for schedule fields.
    // This prevents the comma from disappearing while typing.
    const [scheduleStrings, setScheduleStrings] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        teacher.schedule.forEach(s => {
            initialState[s.day] = s.times.join(', ');
        });
        return initialState;
    });

    useEffect(() => {
        // Reset both states when the teacher prop changes (e.g., when opening the modal for a different teacher)
        setFormData(teacher);
        const initialScheduleStrings: Record<string, string> = {};
        teacher.schedule.forEach(s => {
            initialScheduleStrings[s.day] = s.times.join(', ');
        });
        setScheduleStrings(initialScheduleStrings);
    }, [teacher]);


    const handleInputChange = (field: keyof Omit<Teacher, 'id'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    // This now updates two pieces of state: the raw input string for the UI,
    // and the processed array of times for the actual form data.
    const handleScheduleChange = (day: string, value: string) => {
        setScheduleStrings(prev => ({ ...prev, [day]: value }));

        const newSchedule = [...formData.schedule];
        const dayIndex = newSchedule.findIndex(s => s.day === day);
        const times = value.split(',').map(t => t.trim()).filter(Boolean);

        if (times.length > 0) {
            if (dayIndex > -1) {
                newSchedule[dayIndex] = { ...newSchedule[dayIndex], times };
            } else {
                newSchedule.push({ day, times });
            }
        } else {
            if (dayIndex > -1) {
                newSchedule.splice(dayIndex, 1);
            }
        }
        setFormData(prev => ({...prev, schedule: newSchedule}));
    };

    const handleDynamicListChange = (list: 'experience' | 'education', index: number, field: string, value: string) => {
        const newList = [...formData[list]];
        (newList[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, [list]: newList }));
    };
    
    const addDynamicListItem = (list: 'experience' | 'education') => {
        const newItem = list === 'experience' 
            ? { id: Date.now(), role: '', company: '', duration: '' }
            : { id: Date.now(), degree: '', institution: '', year: '' };
        setFormData(prev => ({ ...prev, [list]: [...prev[list], newItem as any] }));
    };

    const removeDynamicListItem = (list: 'experience' | 'education', index: number) => {
        const newList = formData[list].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [list]: newList }));
    };
    
    const handleCenterChange = (centerId: number, isChecked: boolean) => {
        const newCenterIds = isChecked 
            ? [...formData.centerIds, centerId] 
            : formData.centerIds.filter(id => id !== centerId);
        handleInputChange('centerIds', newCenterIds);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return <Modal isOpen={isOpen} onClose={onClose} title={'id' in formData ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Basic Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Full Name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required />
                        <SelectField label="Subject" value={formData.subjectId} onChange={e => handleInputChange('subjectId', parseInt(e.target.value))} required>
                           <option value="" disabled>Select Subject</option>
                            {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </SelectField>
                        <InputField label="Image URL" value={formData.imageUrl} onChange={e => handleInputChange('imageUrl', e.target.value)} placeholder="Profile Image URL" required/>
                        <InputField label="Banner URL" value={formData.bannerUrl} onChange={e => handleInputChange('bannerUrl', e.target.value)} placeholder="Banner Image URL" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Center</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-slate-50">
                            {allCenters.map(center => (
                                <label key={center.id} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={formData.centerIds.includes(center.id)} onChange={e => handleCenterChange(center.id, e.target.checked)} className="rounded text-blue-600"/>
                                    <span className="text-sm text-black">{center.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <TextAreaField label="Brief biography" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} />
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Schedule</legend>
                    <p className="text-sm text-slate-500 -mt-2">Enter comma-separated times for each day. e.g. 10:00, 11:00, 14:00</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <InputField 
                                key={day} 
                                label={day} 
                                // Use the local scheduleStrings state for the value.
                                value={scheduleStrings[day] || ''} 
                                onChange={e => handleScheduleChange(day, e.target.value)}
                                placeholder="e.g. 15:00, 16:30"
                            />
                        ))}
                    </div>
                </fieldset>
                
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Professional Background</legend>
                    <div>
                        <h4 className="font-semibold text-slate-700">Work Experience</h4>
                        {formData.experience.map((exp, i) => (
                            <div key={exp.id || i} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 mt-2 border rounded-lg relative">
                                <InputField label="Role" value={exp.role} onChange={e => handleDynamicListChange('experience', i, 'role', e.target.value)} />
                                <InputField label="Company" value={exp.company} onChange={e => handleDynamicListChange('experience', i, 'company', e.target.value)} />
                                <InputField label="Duration" value={exp.duration} onChange={e => handleDynamicListChange('experience', i, 'duration', e.target.value)} />
                                <button type="button" onClick={() => removeDynamicListItem('experience', i)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addDynamicListItem('experience')} className="text-blue-600 font-semibold text-sm mt-2">+ Add Experience</button>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700">Education</h4>
                        {formData.education.map((edu, i) => (
                             <div key={edu.id || i} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 mt-2 border rounded-lg relative">
                                <InputField label="Degree" value={edu.degree} onChange={e => handleDynamicListChange('education', i, 'degree', e.target.value)} />
                                <InputField label="Institution" value={edu.institution} onChange={e => handleDynamicListChange('education', i, 'institution', e.target.value)} />
                                <InputField label="Year" value={edu.year} onChange={e => handleDynamicListChange('education', i, 'year', e.target.value)} />
                                <button type="button" onClick={() => removeDynamicListItem('education', i)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addDynamicListItem('education')} className="text-blue-600 font-semibold text-sm mt-2">+ Add Education</button>
                    </div>
                </fieldset>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button type="button" onClick={onClose} className="bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500">Save</button>
            </div>
        </form>
    </Modal>
}


const CentersManager: React.FC<AdminViewProps> = ({ allCenters, onAddCenter, onUpdateCenter, onDeleteCenter, allTeachers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCenter, setEditingCenter] = useState<Center | Omit<Center, 'id'> | null>(null);

    const openModalForNew = () => { setEditingCenter({ name: '', location: '', imageUrl: '' }); setIsModalOpen(true); };
    const openModalForEdit = (center: Center) => { setEditingCenter(center); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingCenter(null); };

    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!editingCenter) return; if ('id' in editingCenter) { onUpdateCenter(editingCenter); } else { onAddCenter(editingCenter); } closeModal(); };
    
    const isCenterInUse = (id: number) => allTeachers.some(t => t.centerIds.includes(id));
    
    const handleDelete = (center: Center) => {
        if (isCenterInUse(center.id)) {
            alert(`Cannot delete "${center.name}". It is assigned to one or more teachers. Please unassign teachers from this center first.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the center "${center.name}"?`)) {
            onDeleteCenter(center.id);
        }
    };

    return (
         <Section title="Manage Centers" button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">+ Add Center</button>}>
            <div className="space-y-3">
                {allCenters.map(c => (
                    <div key={c.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg mr-4 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 21l-4.95-6.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-sm text-slate-500">{c.location}</p>
                        </div>
                        <ActionButtons onEdit={() => openModalForEdit(c)} onDelete={() => handleDelete(c)} />
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCenter && 'id' in editingCenter ? 'Edit Center' : 'Add Center'}>
                {editingCenter && <form onSubmit={handleSave} className="p-6 space-y-4"><InputField label="Name" value={editingCenter.name} onChange={e => setEditingCenter({...editingCenter, name: e.target.value})} required /><InputField label="Location" value={editingCenter.location} onChange={e => setEditingCenter({...editingCenter, location: e.target.value})} required /><InputField label="Image URL" value={editingCenter.imageUrl || ''} onChange={e => setEditingCenter({...editingCenter, imageUrl: e.target.value})} /><button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button></form>}
            </Modal>
        </Section>
    );
};

const HomeManager: React.FC<AdminViewProps> = (props) => (
    <div className="space-y-6">
        <LogoManager logoUrl={props.logoUrl} onUpdateLogoUrl={props.onUpdateLogoUrl} />
        <SlidesManager {...props} />
        <NoticesManager {...props} />
    </div>
);

const LogoManager: React.FC<{logoUrl: string, onUpdateLogoUrl: (url: string) => void}> = ({ logoUrl, onUpdateLogoUrl }) => {
    const [newLogoUrl, setNewLogoUrl] = useState(logoUrl);

    const handleSave = () => {
        onUpdateLogoUrl(newLogoUrl);
        alert('Logo updated!');
    };

    return (
        <Section title="App Logo" subtitle="Update the logo shown in the header.">
            <div className="flex flex-col sm:flex-row items-end gap-4">
                <img src={newLogoUrl} alt="Logo Preview" className="h-16 w-16 p-2 rounded-lg bg-slate-800 object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64'; }}/>
                <div className="flex-grow w-full">
                    <InputField
                        label="Logo Image URL"
                        value={newLogoUrl}
                        onChange={e => setNewLogoUrl(e.target.value)}
                    />
                </div>
                <button onClick={handleSave} className="bg-amber-400 text-slate-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-500 text-sm h-fit w-full sm:w-auto">Save Logo</button>
            </div>
        </Section>
    );
};


const SlidesManager: React.FC<AdminViewProps> = ({ allSlides, onAddSlide, onUpdateSlide, onDeleteSlide }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<OfferSlide | Omit<OfferSlide, 'id'> | null>(null);
    const openModalForNew = () => { setEditingSlide({ title: '', description: '', imageUrl: '' }); setIsModalOpen(true); };
    const openModalForEdit = (slide: OfferSlide) => { setEditingSlide(slide); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!editingSlide) return; if ('id' in editingSlide) onUpdateSlide(editingSlide); else onAddSlide(editingSlide); closeModal(); };
    const handleDelete = (slide: OfferSlide) => { if (window.confirm(`Delete slide "${slide.title}"?`)) onDeleteSlide(slide.id); };
    return (<Section title="Manage Offer Slides" subtitle="Control the slides on the home page carousel." button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">Add Slide</button>}><div className="space-y-3">{allSlides.map(s => <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><p className="font-bold text-slate-800">{s.title}</p><ActionButtons onEdit={() => openModalForEdit(s)} onDelete={() => handleDelete(s)} /></div>)}</div><Modal isOpen={isModalOpen} onClose={closeModal} title={editingSlide && 'id' in editingSlide ? 'Edit Slide' : 'Add Slide'}>{editingSlide && <form onSubmit={handleSave} className="p-6 space-y-4"><InputField label="Title" value={editingSlide.title} onChange={e => setEditingSlide({...editingSlide, title: e.target.value})} required /><TextAreaField label="Description" value={editingSlide.description} onChange={e => setEditingSlide({...editingSlide, description: e.target.value})} required /><InputField label="Image URL" value={editingSlide.imageUrl} onChange={e => setEditingSlide({...editingSlide, imageUrl: e.target.value})} required /><button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button></form>}</Modal></Section>);
};

const NoticesManager: React.FC<AdminViewProps> = ({ allNotices, onAddNotice, onUpdateNotice, onDeleteNotice }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | Omit<Notice, 'id'> | null>(null);
    const openModalForNew = () => { setEditingNotice({ text: '' }); setIsModalOpen(true); };
    const openModalForEdit = (notice: Notice) => { setEditingNotice(notice); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!editingNotice) return; if ('id' in editingNotice) onUpdateNotice(editingNotice); else onAddNotice(editingNotice); closeModal(); };
    const handleDelete = (notice: Notice) => { if (window.confirm(`Delete this notice?`)) onDeleteNotice(notice.id); };
    return (<Section title="Manage Notices" subtitle="Update the home page notice board." button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">Add Notice</button>}><div className="space-y-3">{allNotices.map(n => <div key={n.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><p className="text-slate-800 text-sm">{n.text}</p><ActionButtons onEdit={() => openModalForEdit(n)} onDelete={() => handleDelete(n)} /></div>)}</div><Modal isOpen={isModalOpen} onClose={closeModal} title={editingNotice && 'id' in editingNotice ? 'Edit Notice' : 'Add Notice'}>{editingNotice && <form onSubmit={handleSave} className="p-6 space-y-4"><TextAreaField label="Notice Text" value={editingNotice.text} onChange={e => setEditingNotice({...editingNotice, text: e.target.value})} required /><button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button></form>}</Modal></Section>);
};

const DiamondStudentsManager: React.FC<AdminViewProps> = ({ allDiamondStudents, onAddDiamondStudent, onUpdateDiamondStudent, onDeleteDiamondStudent }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<DiamondStudent | Omit<DiamondStudent, 'id'> | null>(null);

    const openModalForNew = () => { setEditingStudent({ name: '', imageUrl: '', level: 'O Level', achievementYear: '', achievementDetails: '', results: [] }); setIsModalOpen(true); };
    const openModalForEdit = (student: DiamondStudent) => { setEditingStudent(JSON.parse(JSON.stringify(student))); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault(); 
        if (!editingStudent) return; 
        const finalStudent = {
            ...editingStudent,
            results: editingStudent.results.filter(r => r.subject && r.grade)
        };
        if ('id' in finalStudent) onUpdateDiamondStudent(finalStudent as DiamondStudent); 
        else onAddDiamondStudent(finalStudent); 
        closeModal(); 
    };

    const handleDelete = (student: DiamondStudent) => {
        if (window.confirm(`Are you sure you want to delete diamond student "${student.name}"?`)) {
            onDeleteDiamondStudent(student.id);
        }
    };

    const handleResultChange = (index: number, field: 'subject' | 'grade', value: string) => {
        if (!editingStudent) return;
        const newResults = [...editingStudent.results];
        newResults[index] = { ...newResults[index], [field]: value };
        setEditingStudent({ ...editingStudent, results: newResults });
    };

    const handleAddResult = () => {
        if (!editingStudent) return;
        const newResult: StudentResult = { id: Date.now(), subject: '', grade: '' };
        setEditingStudent({ ...editingStudent, results: [...editingStudent.results, newResult] });
    };

    const handleRemoveResult = (index: number) => {
        if (!editingStudent) return;
        setEditingStudent({ ...editingStudent, results: editingStudent.results.filter((_, i) => i !== index) });
    };

    return (
        <Section title="Manage Diamond Students" subtitle="Feature top-achieving students." button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">Add Student</button>}>
            <div className="space-y-3">{allDiamondStudents.map(s => <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><p className="font-bold text-slate-800">{s.name}</p><ActionButtons onEdit={() => openModalForEdit(s)} onDelete={() => handleDelete(s)} /></div>)}</div>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStudent && 'id' in editingStudent ? 'Edit Student' : 'Add Student'}>
                {editingStudent && 
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <InputField label="Name" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} required />
                        <InputField label="Image URL" value={editingStudent.imageUrl} onChange={e => setEditingStudent({...editingStudent, imageUrl: e.target.value})} required />
                        <SelectField label="Level" value={editingStudent.level} onChange={e => setEditingStudent({...editingStudent, level: e.target.value as 'O Level' | 'A Level'})}><option>O Level</option><option>A Level</option></SelectField>
                        <InputField label="Achievement Year" value={editingStudent.achievementYear} onChange={e => setEditingStudent({...editingStudent, achievementYear: e.target.value})} required />
                        <TextAreaField label="Achievement Details" value={editingStudent.achievementDetails} onChange={e => setEditingStudent({...editingStudent, achievementDetails: e.target.value})} required />

                        <div>
                            <h4 className="font-semibold text-slate-700">Results</h4>
                            <div className="space-y-2 mt-2">
                                {editingStudent.results.map((result, i) => (
                                    <div key={result.id || i} className="flex items-end gap-2 p-2 border rounded-lg bg-slate-50">
                                        <InputField label="" placeholder="Subject" value={result.subject} onChange={e => handleResultChange(i, 'subject', e.target.value)} />
                                        <InputField label="" placeholder="Grade" value={result.grade} onChange={e => handleResultChange(i, 'grade', e.target.value)} />
                                        <button type="button" onClick={() => handleRemoveResult(i)} className="h-11 w-11 flex-shrink-0 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={handleAddResult} className="text-blue-600 font-semibold text-sm mt-2">+ Add Result</button>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onClick={closeModal} className="bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200">Cancel</button>
                            <button type="submit" className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500">Save</button>
                        </div>
                    </form>
                }
            </Modal>
        </Section>
    );
};

export default AdminView;
