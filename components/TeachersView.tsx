import React, { useState, useMemo } from 'react';
import type { Teacher, Subject, Center } from '../types';
import TeacherCard from './TeacherCard';

interface TeachersViewProps {
  teachers: Teacher[];
  subjects: Subject[];
  centers: Center[];
  onSelectTeacher: (teacher: Teacher) => void;
}

const TeachersView: React.FC<TeachersViewProps> = ({ teachers, subjects, centers, onSelectTeacher }) => {
    const [filterSubjectId, setFilterSubjectId] = useState<number | null>(null);
    const [filterCenterId, setFilterCenterId] = useState<number | null>(null);
    
    const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || 'N/A';

    const filteredTeachers = useMemo(() => {
        return teachers.filter(teacher => {
            const subjectMatch = !filterSubjectId || teacher.subjectId === filterSubjectId;
            const centerMatch = !filterCenterId || teacher.centerIds.includes(filterCenterId);
            return subjectMatch && centerMatch;
        });
    }, [teachers, filterSubjectId, filterCenterId]);

    return (
        <div className="p-4 sm:p-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-800 mb-2 px-2">Our Teachers</h2>
            <p className="text-slate-600 mb-6 px-2">Browse our talented instructors.</p>

            <div className="px-2 mb-8 flex flex-col sm:flex-row gap-4">
                <div>
                    <label htmlFor="subject-filter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Subject</label>
                    <select
                        id="subject-filter"
                        value={filterSubjectId || ''}
                        onChange={(e) => setFilterSubjectId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full sm:w-auto p-3 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="center-filter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Center</label>
                    <select
                        id="center-filter"
                        value={filterCenterId || ''}
                        onChange={(e) => setFilterCenterId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full sm:w-auto p-3 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Centers</option>
                        {centers.map(center => (
                            <option key={center.id} value={center.id}>
                                {center.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map(teacher => (
                    <TeacherCard 
                        key={teacher.id} 
                        teacher={teacher} 
                        subjectName={getSubjectName(teacher.subjectId)}
                        onClick={() => onSelectTeacher(teacher)} 
                    />
                ))}
            </div>
            {filteredTeachers.length === 0 && (
                <p className="text-center text-slate-500 col-span-full mt-8">No teachers found for this selection.</p>
            )}
        </div>
    );
};

export default TeachersView;