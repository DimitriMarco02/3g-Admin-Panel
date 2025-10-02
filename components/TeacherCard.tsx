import React from 'react';
import type { Teacher } from '../types';

interface TeacherCardProps {
  teacher: Teacher;
  subjectName: string;
  onClick: () => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, subjectName, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden transform hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
      role="button"
      aria-label={`View details for ${teacher.name}`}
    >
      <div>
        <img className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" src={teacher.imageUrl} alt={teacher.name} />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-slate-900">{teacher.name}</h3>
        <p className="text-blue-600 text-sm font-medium">{subjectName}</p>
      </div>
    </div>
  );
};

export default TeacherCard;