import React from 'react';
import type { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onSelect: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onSelect }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden transform hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
      onClick={() => onSelect(subject)}
      role="button"
      aria-label={`Select ${subject.name}`}
    >
      <div className="relative">
        <img className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" src={subject.imageUrl} alt={subject.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{subject.name}</h3>
        <p className="text-slate-600 text-sm mb-6 h-10">{subject.description}</p>
        <button className="w-full bg-amber-400 text-slate-900 font-semibold py-3 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all duration-300 ease-in-out">
          Book Trial
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;