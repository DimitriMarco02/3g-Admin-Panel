
import React from 'react';
import type { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onSelect: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(subject)}
      className="bg-white rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden group h-full flex flex-col cursor-pointer transform hover:-translate-y-1 transition-transform duration-300"
      role="button"
      aria-label={`View details for ${subject.name}`}
    >
      <div>
        <img className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" src={subject.imageUrl} alt={subject.name} />
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-semibold text-slate-900">{subject.name}</h3>
      </div>
    </div>
  );
};

export default SubjectCard;