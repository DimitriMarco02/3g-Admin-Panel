import React from 'react';
import type { DiamondStudent } from '../types';

interface DiamondStudentDetailViewProps {
  student: DiamondStudent;
  onBack: () => void;
}

const DiamondStudentDetailView: React.FC<DiamondStudentDetailViewProps> = ({ student, onBack }) => {
  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 overflow-hidden relative">
        <button onClick={onBack} className="absolute top-4 left-4 z-10 text-blue-600 font-semibold flex items-center group bg-white/80 backdrop-blur-sm py-2 px-3 rounded-full hover:bg-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Back
        </button>
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img className="h-64 w-full object-cover md:w-64" src={student.imageUrl} alt={student.name} />
          </div>
          <div className="p-8 flex flex-col justify-center">
            <div className="uppercase tracking-wide text-sm text-blue-500 font-semibold">{student.level} - {student.achievementYear}</div>
            <h1 className="block mt-1 text-3xl leading-tight font-extrabold text-black">{student.name}</h1>
            <p className="mt-4 text-slate-600">{student.achievementDetails}</p>
          </div>
        </div>

        <div className="p-8 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Results</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Subject</th>
                            <th scope="col" className="px-6 py-3 text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {student.results.map((result) => (
                            <tr key={result.id} className="bg-white border-b hover:bg-slate-50">
                                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                    {result.subject}
                                </th>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${result.grade.includes('A') ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                      {result.grade}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DiamondStudentDetailView;