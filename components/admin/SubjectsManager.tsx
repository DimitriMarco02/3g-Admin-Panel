import React, { useState, useMemo, useEffect } from 'react';
import type { Subject, ScheduleLevel } from '../../types';
import { scheduleLevels } from '../../types';
import type { AdminViewProps } from './types';
import { ActionButtons, Modal, InputField, TextAreaField, SelectField, Section } from './shared';
import Pagination from '../Pagination';

const SubjectsManager: React.FC<AdminViewProps> = ({ allSubjects, onAddSubject, onUpdateSubject, onDeleteSubject, allTeachers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | Omit<Subject, 'id'> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(1);
    const subjectsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    const filteredSubjects = useMemo(() => {
        return allSubjects
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'A-Z': return a.name.localeCompare(b.name);
                    case 'Z-A': return b.name.localeCompare(a.name);
                    case 'Oldest': return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
                    case 'Newest':
                    default: return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
                }
            });
    }, [allSubjects, searchTerm, sortBy]);

    const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);
    const paginatedSubjects = filteredSubjects.slice((currentPage - 1) * subjectsPerPage, currentPage * subjectsPerPage);

    const openModalForNew = () => { setEditingSubject({ name: '', description: '', imageUrl: '', bannerUrl: '', feesByLevel: {} }); setIsModalOpen(true); };
    const openModalForEdit = (subject: Subject) => { setEditingSubject(subject); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingSubject(null); };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubject) return;
        if ('id' in editingSubject) { onUpdateSubject(editingSubject); } 
        else { onAddSubject(editingSubject); }
        closeModal();
    };
    
    const handleFeeChange = (level: ScheduleLevel, value: string) => {
        if (!editingSubject) return;
        const newFees = { ...editingSubject.feesByLevel };
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) {
            newFees[level] = numValue;
        } else {
            delete newFees[level];
        }
        setEditingSubject({ ...editingSubject, feesByLevel: newFees });
    };

    const isSubjectInUse = (id: string) => allTeachers.some(t => t.subjectIds.includes(id));
    
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
            <div className="p-4 mb-4 bg-slate-50 rounded-lg border flex flex-col sm:flex-row gap-4">
                 <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search by Name</label>
                    <input type="text" placeholder="Search subjects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black"/>
                </div>
                <div className="w-full sm:w-48">
                    <SelectField label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                        <option value="A-Z">Name (A-Z)</option>
                        <option value="Z-A">Name (Z-A)</option>
                    </SelectField>
                </div>
            </div>
            {filteredSubjects.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedSubjects.map(s => (
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
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                <p className="text-center text-slate-500 p-8">No subjects found for this selection.</p>
            )}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSubject && 'id' in editingSubject ? 'Edit Subject' : 'Add Subject'}>
                {editingSubject && (
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <InputField label="Name" value={editingSubject.name} onChange={e => setEditingSubject({...editingSubject, name: e.target.value})} required />
                        <TextAreaField label="Description" value={editingSubject.description} onChange={e => setEditingSubject({...editingSubject, description: e.target.value})} required />
                        <InputField label="Image URL (for cards)" value={editingSubject.imageUrl} onChange={e => setEditingSubject({...editingSubject, imageUrl: e.target.value})} required />
                        <InputField label="Banner URL (for detail page, optional)" value={editingSubject.bannerUrl || ''} onChange={e => setEditingSubject({...editingSubject, bannerUrl: e.target.value})} placeholder="If empty, card image URL is used" />
                        
                        <fieldset className="p-4 border rounded-lg bg-slate-50">
                            <legend className="font-semibold text-slate-700 px-2">Fees by Class Level</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                {scheduleLevels.map(level => (
                                    <InputField 
                                        key={level}
                                        label={`${level} Fee`} 
                                        type="number" 
                                        value={editingSubject.feesByLevel?.[level] || ''} 
                                        onChange={e => handleFeeChange(level, e.target.value)}
                                        placeholder="e.g. 5000"
                                    />
                                ))}
                            </div>
                        </fieldset>

                        <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button>
                    </form>
                )}
            </Modal>
        </Section>
    );
};

export default SubjectsManager;