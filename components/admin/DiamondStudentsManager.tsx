import React, { useState, useMemo, useEffect } from 'react';
import type { DiamondStudent, StudentResult } from '../../types';
import type { AdminViewProps } from './types';
import { ActionButtons, Modal, InputField, TextAreaField, SelectField, Section } from './shared';
import Pagination from '../Pagination';

const DiamondStudentsManager: React.FC<AdminViewProps> = ({ allDiamondStudents, onAddDiamondStudent, onUpdateDiamondStudent, onDeleteDiamondStudent }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<DiamondStudent | Omit<DiamondStudent, 'id'> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('A-Z');
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    const filteredStudents = useMemo(() => {
        return allDiamondStudents
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'Z-A': return b.name.localeCompare(a.name);
                    case 'Newest Year': return b.achievementYear.localeCompare(a.achievementYear);
                    case 'Oldest Year': return a.achievementYear.localeCompare(b.achievementYear);
                    case 'A-Z':
                    default: return a.name.localeCompare(b.name);
                }
            });
    }, [allDiamondStudents, searchTerm, sortBy]);

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);

    const openModalForNew = () => { setEditingStudent({ name: '', imageUrl: '', level: 'O Level', achievementYear: '', achievementDetails: '', results: [] }); setIsModalOpen(true); };
    const openModalForEdit = (student: DiamondStudent) => {
        const studentCopy: DiamondStudent = {
            id: student.id,
            name: student.name,
            imageUrl: student.imageUrl,
            level: student.level,
            achievementYear: student.achievementYear,
            achievementDetails: student.achievementDetails,
            results: student.results.map(r => ({ ...r })),
        };
        setEditingStudent(studentCopy);
        setIsModalOpen(true);
    };
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
        const newResult: StudentResult = { id: `res_${Date.now()}`, subject: '', grade: '' };
        setEditingStudent({ ...editingStudent, results: [...editingStudent.results, newResult] });
    };

    const handleRemoveResult = (index: number) => {
        if (!editingStudent) return;
        setEditingStudent({ ...editingStudent, results: editingStudent.results.filter((_, i) => i !== index) });
    };

    return (
        <Section title="Manage Diamond Students" subtitle="Feature top-achieving students." button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">Add Student</button>}>
            <div className="p-4 mb-4 bg-slate-50 rounded-lg border flex flex-col sm:flex-row gap-4">
                 <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search by Name</label>
                    <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black"/>
                </div>
                <div className="w-full sm:w-48">
                    <SelectField label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="A-Z">Name (A-Z)</option>
                        <option value="Z-A">Name (Z-A)</option>
                        <option value="Newest Year">Year (Newest)</option>
                        <option value="Oldest Year">Year (Oldest)</option>
                    </SelectField>
                </div>
            </div>
            {filteredStudents.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {paginatedStudents.map(s => 
                            <div key={s.id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                                <img src={s.imageUrl} alt={s.name} className="w-10 h-10 object-cover rounded-full mr-4 bg-slate-200" />
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800">{s.name}</p>
                                    <p className="text-sm text-slate-500">{s.level} - {s.achievementYear}</p>
                                </div>
                                <ActionButtons onEdit={() => openModalForEdit(s)} onDelete={() => handleDelete(s)} />
                            </div>
                        )}
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                <p className="text-center text-slate-500 p-8">No diamond students found for this selection.</p>
            )}
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

export default DiamondStudentsManager;
