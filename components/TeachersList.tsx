import React from 'react';
import type { Teacher } from '../types';

interface TeachersListProps {
  teachers: Teacher[];
  selectedTeacherId: string | null;
  onSelectTeacher: (id: string) => void;
}

const TeachersList: React.FC<TeachersListProps> = ({ teachers, selectedTeacherId, onSelectTeacher }) => {
  if (teachers.length === 0) {
    return <p className="text-slate-500 text-sm">No teachers available for this subject.</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-3">3. Select a Teacher</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {teachers.map((teacher) => (
          <button
            type="button"
            key={teacher.id}
            onClick={() => onSelectTeacher(teacher.id)}
            className={`p-3 border rounded-lg text-center transition-all duration-200 ${
              selectedTeacherId === teacher.id
                ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-lg font-semibold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-400'
            }`}
          >
            <span className="font-medium">{teacher.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeachersList;
