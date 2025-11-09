import React from 'react';
import type { Teacher } from '../types';

interface TeacherCardProps {
  teacher: Teacher;
  subjectNames: string;
  onClick: () => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, subjectNames, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full"
      role="button"
      aria-label={`View details for ${teacher.name}`}
    >
      <div>
        <img className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" src={teacher.imageUrl} alt={teacher.name} />
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold text-slate-900">{teacher.name}</h3>
        <p className="text-blue-600 text-xs font-medium truncate">{subjectNames}</p>
      </div>
    </div>
  );
};

export default TeacherCard;