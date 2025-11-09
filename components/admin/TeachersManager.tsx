import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Subject, Center, Batch, BoardTimeGroup, ScheduleLevel, Curriculum } from '../../types';
import { scheduleLevels } from '../../types';
import { CURRICULUMS } from '../../constants';
import type { AdminViewProps } from './types';
import { ActionButtons, Modal, InputField, TextAreaField, SelectField, Section } from './shared';
import Pagination from '../Pagination';


const TeachersManager: React.FC<AdminViewProps> = ({ allTeachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher, allSubjects, allCenters }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | Omit<Teacher, 'id'> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubjectId, setFilterSubjectId] = useState('all');
    const [filterCenterId, setFilterCenterId] = useState('all');
    const [sortBy, setSortBy] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(1);
    const teachersPerPage = 10;

    const deepCopyTeacher = (teacher: Teacher | Omit<Teacher, 'id'>): any => {
        const copy = { ...teacher } as any;
        
        copy.subjectIds = [...teacher.subjectIds];
        copy.centerIds = [...teacher.centerIds];
        
        copy.batches = teacher.batches.map(b => ({
            ...b,
            days: [...b.days],
            boardTimeGroups: b.boardTimeGroups.map(bg => ({
                ...bg,
                levelSlots: Object.fromEntries(
                    Object.entries(bg.levelSlots).map(([level, slots]) => [level, [...(slots || [])]])
                )
            }))
        }));
        
        copy.experience = teacher.experience.map(e => ({...e}));
        copy.education = teacher.education.map(e => ({...e}));
        copy.reviews = teacher.reviews.map(r => ({...r}));
        
        if (copy.createdAt) {
            copy.createdAt = new Date(copy.createdAt);
        }
    
        return copy;
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSubjectId, filterCenterId, sortBy]);

    const filteredTeachers = useMemo(() => {
        return allTeachers
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(t => filterSubjectId === 'all' || t.subjectIds.includes(filterSubjectId))
            .filter(t => filterCenterId === 'all' || t.centerIds.includes(filterCenterId))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'A-Z': return a.name.localeCompare(b.name);
                    case 'Z-A': return b.name.localeCompare(a.name);
                    case 'Oldest': return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
                    case 'Newest':
                    default: return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
                }
            });
    }, [allTeachers, searchTerm, filterSubjectId, filterCenterId, sortBy]);
    
    const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
    const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * teachersPerPage, currentPage * teachersPerPage);

    const openModalForNew = () => { 
        setEditingTeacher({ 
            name: '', email: '', phone: '', subjectIds: [], 
            centerIds: [], imageUrl: '', bannerUrl: '', bio: '', 
            batches: [],
            experience: [], education: [], reviews: [],
            showOnHome: false,
            admissionFee: 1000,
            status: 'pending',
        }); 
        setIsModalOpen(true); 
    };
    const openModalForEdit = (teacher: Teacher) => {
        const teacherCopy = deepCopyTeacher(teacher);
        setEditingTeacher(teacherCopy);
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setEditingTeacher(null); };

    const handleSave = (teacherToSave: Teacher | Omit<Teacher, 'id'>) => {
        if (teacherToSave.subjectIds.length === 0 || teacherToSave.centerIds.length === 0) {
            alert("Please select at least one subject and one center.");
            return;
        }

        const cleanedTeacher = deepCopyTeacher(teacherToSave);

        cleanedTeacher.batches = cleanedTeacher.batches.map((batch: Batch) => {
            batch.boardTimeGroups = batch.boardTimeGroups.map((group: BoardTimeGroup) => {
                const cleanedLevelSlots: Partial<Record<ScheduleLevel, string[]>> = {};
                for (const level in group.levelSlots) {
                    const scheduleLevel = level as ScheduleLevel;
                    const timesValue = group.levelSlots[scheduleLevel];
                    
                    if (Array.isArray(timesValue)) {
                        const times = timesValue
                            .map(s => String(s || '').trim())
                            .filter(Boolean);
        
                        if (times.length > 0) {
                            cleanedLevelSlots[scheduleLevel] = times;
                        }
                    }
                }
                group.levelSlots = cleanedLevelSlots;
                return group;
            }).filter((group: BoardTimeGroup) => Object.keys(group.levelSlots).length > 0);
            return batch;
        }).filter((batch: Batch) => batch.days.length > 0 && batch.boardTimeGroups.length > 0);

        if ('id' in cleanedTeacher) { 
            onUpdateTeacher(cleanedTeacher as Teacher); 
        } else { 
            onAddTeacher(cleanedTeacher); 
        } 
        closeModal();
    };

    const handleDelete = (teacher: Teacher) => {
        if (window.confirm(`Are you sure you want to delete the teacher "${teacher.name}"?`)) {
            onDeleteTeacher(teacher.id);
        }
    };
    
    const getTeacherSubtitle = (teacher: Teacher) => {
        const subjectNames = teacher.subjectIds.map(id => allSubjects.find(s => s.id === id)?.name).filter(Boolean).join(', ');
        const centerName = allCenters.find(c => teacher.centerIds.includes(c.id))?.name || '';
        return centerName ? `${subjectNames} at ${centerName}` : subjectNames;
    };

    return (
         <Section title="Manage Teachers" button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">+ Add Teacher</button>}>
            <div className="p-4 mb-4 bg-slate-50 rounded-lg border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search by Name</label>
                    <input type="text" placeholder="Search teachers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black"/>
                </div>
                <SelectField label="Filter by Subject" value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)}>
                    <option value="all">All Subjects</option>
                    {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </SelectField>
                 <SelectField label="Filter by Center" value={filterCenterId} onChange={e => setFilterCenterId(e.target.value)}>
                    <option value="all">All Centers</option>
                    {allCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SelectField>
                 <SelectField label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                        <option value="A-Z">Name (A-Z)</option>
                        <option value="Z-A">Name (Z-A)</option>
                </SelectField>
            </div>
            {filteredTeachers.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {paginatedTeachers.map(t => {
                            const status = t.status || 'pending';
                            return (
                                <div key={t.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <img src={t.imageUrl} alt={t.name} className="w-12 h-12 object-cover rounded-full mr-4 bg-slate-200" />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <p className="font-bold text-slate-800">{t.name}</p>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate" title={getTeacherSubtitle(t)}>{getTeacherSubtitle(t)}</p>
                                    </div>
                                    <ActionButtons onEdit={() => openModalForEdit(t)} onDelete={() => handleDelete(t)} />
                                </div>
                            );
                        })}
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                <p className="text-center text-slate-500 p-8">No teachers found for this selection.</p>
            )}
            {isModalOpen && editingTeacher && <TeacherEditModal isOpen={isModalOpen} onClose={closeModal} teacher={editingTeacher} onSave={handleSave} allSubjects={allSubjects} allCenters={allCenters}/>}
        </Section>
    );
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TeacherEditModal: React.FC<{ isOpen: boolean, onClose: () => void, teacher: Teacher | Omit<Teacher, 'id'>, onSave: (t: Teacher | Omit<Teacher, 'id'>) => void, allSubjects: Subject[], allCenters: Center[] }> = ({ isOpen, onClose, teacher, onSave, allSubjects, allCenters}) => {
    const [formData, setFormData] = useState(teacher);
    const isEditing = 'id' in formData;

    useEffect(() => {
        setFormData(teacher);
    }, [teacher]);

    const handleInputChange = (field: keyof Omit<Teacher, 'id'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDynamicListChange = (list: 'experience' | 'education', index: number, field: string, value: string) => {
        const newList = [...formData[list]];
        (newList[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, [list]: newList }));
    };
    
    const addDynamicListItem = (list: 'experience' | 'education') => {
        const newItem = list === 'experience' 
            ? { id: `exp_${Date.now()}`, role: '', company: '', duration: '' }
            : { id: `edu_${Date.now()}`, degree: '', institution: '', year: '' };
        setFormData(prev => ({ ...prev, [list]: [...prev[list], newItem as any] }));
    };

    const removeDynamicListItem = (list: 'experience' | 'education', index: number) => {
        const newList = formData[list].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [list]: newList }));
    };
    
    const handleCenterChange = (centerId: string, isChecked: boolean) => {
        const newCenterIds = isChecked 
            ? [...formData.centerIds, centerId] 
            : formData.centerIds.filter(id => id !== centerId);
        handleInputChange('centerIds', newCenterIds);
    };

    const handleSubjectChange = (subjectId: string, isChecked: boolean) => {
        const newSubjectIds = isChecked
            ? [...formData.subjectIds, subjectId]
            : formData.subjectIds.filter(id => id !== subjectId);
        handleInputChange('subjectIds', newSubjectIds);
    }
    
    const handleAddBatch = () => {
        const newBatch: Batch = {
            id: `batch_${Date.now()}`,
            batchName: 'New Batch',
            subjectId: formData.subjectIds[0] || '',
            centerId: formData.centerIds[0] || '',
            days: [],
            boardTimeGroups: CURRICULUMS.map(c => ({ boardName: c as Curriculum, levelSlots: {} }))
        };
        setFormData(prev => ({ ...prev, batches: [...prev.batches, newBatch] }));
    };

    const handleBatchChange = (updatedBatch: Batch, index: number) => {
        const newBatches = [...formData.batches];
        newBatches[index] = updatedBatch;
        setFormData(prev => ({ ...prev, batches: newBatches }));
    };

    const handleDeleteBatch = (index: number) => {
        const newBatches = formData.batches.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, batches: newBatches }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const status = (formData as Teacher).status || 'pending';

    return <Modal isOpen={isOpen} onClose={onClose} title={'id' in formData ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">

                {status === 'pending' && (
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200 text-sm">
                        <p className="font-bold mb-1">Activation Required</p>
                        <p>This teacher's profile is currently pending. To activate their account so they can log in and use features like chat, the teacher must sign up using the email address: <strong className="font-mono">{formData.email}</strong></p>
                    </div>
                )}
                 {status === 'active' && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm font-semibold flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span>This teacher's account is active.</span>
                    </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Full Name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required />
                    <InputField label="Email Address" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required disabled={isEditing} title={isEditing ? "Email cannot be changed after creation." : ""} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Phone Number" value={formData.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} placeholder="Teacher's contact number"/>
                    <InputField label="Admission Fee" type="number" value={formData.admissionFee || ''} onChange={e => handleInputChange('admissionFee', Number(e.target.value))} placeholder="e.g. 1000"/>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Image URL" value={formData.imageUrl} onChange={e => handleInputChange('imageUrl', e.target.value)} placeholder="Profile Image URL" required/>
                    <InputField label="Banner URL" value={formData.bannerUrl} onChange={e => handleInputChange('bannerUrl', e.target.value)} placeholder="Banner Image URL" required/>
                 </div>
                 <TextAreaField label="Brief biography" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50">
                           {allSubjects.map(subject => (
                                <label key={subject.id} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={formData.subjectIds.includes(subject.id)} onChange={e => handleSubjectChange(subject.id, e.target.checked)} className="rounded text-blue-600"/>
                                    <span className="text-sm text-black">{subject.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Centers</label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50">
                            {allCenters.map(center => (
                                <label key={center.id} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={formData.centerIds.includes(center.id)} onChange={e => handleCenterChange(center.id, e.target.checked)} className="rounded text-blue-600"/>
                                    <span className="text-sm text-black">{center.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                
                <fieldset>
                    <legend className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Batches & Schedules</legend>
                    <div className="space-y-4">
                        {formData.batches.map((batch, index) => (
                            <BatchForm
                                key={batch.id}
                                batch={batch}
                                index={index}
                                onBatchChange={handleBatchChange}
                                onDeleteBatch={handleDeleteBatch}
                                assignedSubjects={allSubjects.filter(s => formData.subjectIds.includes(s.id))}
                                assignedCenters={allCenters.filter(c => formData.centerIds.includes(c.id))}
                            />
                        ))}
                        <button type="button" onClick={handleAddBatch} className="w-full bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">+ Add Batch</button>
                    </div>
                </fieldset>
                
                <fieldset>
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
                    <div className="mt-4">
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

const BatchForm: React.FC<{
    batch: Batch;
    index: number;
    onBatchChange: (batch: Batch, index: number) => void;
    onDeleteBatch: (index: number) => void;
    assignedSubjects: Subject[];
    assignedCenters: Center[];
}> = ({ batch, index, onBatchChange, onDeleteBatch, assignedSubjects, assignedCenters }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleFieldChange = (field: keyof Batch, value: any) => {
        onBatchChange({ ...batch, [field]: value }, index);
    };

    const handleDayToggle = (day: string) => {
        const newDays = batch.days.includes(day)
            ? batch.days.filter(d => d !== day)
            : [...batch.days, day];
        handleFieldChange('days', newDays);
    };
    
    const handleTimeChange = (boardName: Curriculum, level: ScheduleLevel, value: string) => {
        const newBoardGroups = JSON.parse(JSON.stringify(batch.boardTimeGroups));
        const boardGroup = newBoardGroups.find((bg: BoardTimeGroup) => bg.boardName === boardName);
        if(boardGroup) {
            const times = value.split(',').map(t => t.trim());
            if (value.trim() === '') {
                delete boardGroup.levelSlots[level];
            } else {
                 boardGroup.levelSlots[level] = times;
            }
        }
        handleFieldChange('boardTimeGroups', newBoardGroups);
    }

    return (
        <div className="border rounded-lg bg-slate-50 relative">
            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-3 bg-slate-100 hover:bg-slate-200">
                <span className="font-semibold text-slate-700">{batch.batchName || "New Batch"}</span>
                <div className="flex items-center">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteBatch(index); }} className="text-red-500 hover:text-red-700 p-1 mr-2"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
            </button>
            {isExpanded && (
                <div className="p-4 space-y-4">
                    <InputField label="Batch Name" value={batch.batchName} onChange={e => handleFieldChange('batchName', e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <SelectField label="Subject" value={batch.subjectId} onChange={e => handleFieldChange('subjectId', e.target.value)}>
                            {assignedSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </SelectField>
                        <SelectField label="Center" value={batch.centerId} onChange={e => handleFieldChange('centerId', e.target.value)}>
                            {assignedCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </SelectField>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Days of Week</label>
                        <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map(day => (
                                <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`px-3 py-1 text-sm rounded-full border ${batch.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}>{day.substring(0,3)}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Times</label>
                        <p className="text-xs text-slate-500 -mt-2 mb-2">Enter comma-separated times (e.g. 10:00, 11:00)</p>
                        <div className="space-y-3">
                            {batch.boardTimeGroups.map(boardGroup => (
                                <div key={boardGroup.boardName} className="p-3 bg-white rounded-lg border">
                                    <h5 className="font-semibold text-slate-700">{boardGroup.boardName}</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                                        {scheduleLevels.map(level => (
                                            <InputField
                                                key={level}
                                                label={level}
                                                value={(boardGroup.levelSlots[level] || []).join(', ')}
                                                onChange={e => handleTimeChange(boardGroup.boardName, level, e.target.value)}
                                                placeholder="e.g. 15:00, 16:30"
                                            />
                                        ))}
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

export default TeachersManager;