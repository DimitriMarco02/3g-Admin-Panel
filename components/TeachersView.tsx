import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, Subject, Center } from '../types';
import TeacherCard from './TeacherCard';
import Pagination from './Pagination';

interface TeachersViewProps {
  teachers: Teacher[];
  subjects: Subject[];
  centers: Center[];
  onSelectTeacher: (teacher: Teacher) => void;
  onBack: () => void;
}

const TeachersView: React.FC<TeachersViewProps> = ({ teachers, subjects, centers, onSelectTeacher, onBack }) => {
    const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);
    const [filterCenterId, setFilterCenterId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const teachersPerPage = 15;
    
    const getSubjectNames = (subjectIds: string[]) => {
      return subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
    }

    const filteredTeachers = useMemo(() => {
        return teachers.filter(teacher => {
            const subjectMatch = !filterSubjectId || teacher.subjectIds.includes(filterSubjectId);
            const centerMatch = !filterCenterId || teacher.centerIds.includes(filterCenterId);
            const nameMatch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
            return subjectMatch && centerMatch && nameMatch;
        });
    }, [teachers, filterSubjectId, filterCenterId, searchTerm]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterSubjectId, filterCenterId, searchTerm]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
    const indexOfLastTeacher = currentPage * teachersPerPage;
    const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
    const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div className="p-4 sm:p-6 animate-fade-in">
            <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Back
            </button>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Teachers</h2>
            <p className="text-slate-600 mb-6">Browse our talented instructors.</p>

            <div className="mb-8 p-4 bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label htmlFor="teacher-search" className="block text-sm font-medium text-slate-700 mb-1">Search by Name</label>
                    <input
                        id="teacher-search"
                        type="text"
                        placeholder="e.g., Dr. Evelyn Reed"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2.5 border bg-slate-50 border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="subject-filter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Subject</label>
                    <select
                        id="subject-filter"
                        value={filterSubjectId || ''}
                        onChange={(e) => setFilterSubjectId(e.target.value ? e.target.value : null)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        onChange={(e) => setFilterCenterId(e.target.value ? e.target.value : null)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {filteredTeachers.length > 0 ? (
                 <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {currentTeachers.map(teacher => (
                            <TeacherCard 
                                key={teacher.id} 
                                teacher={teacher} 
                                subjectNames={getSubjectNames(teacher.subjectIds)}
                                onClick={() => onSelectTeacher(teacher)} 
                            />
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <p className="text-center text-slate-500 col-span-full mt-8">No teachers found for this selection.</p>
            )}
        </div>
    );
};

export default TeachersView;