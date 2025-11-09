
import React, { useMemo, useState, useEffect } from 'react';
import type { Subject, Teacher } from '../types';
import TeacherCard from './TeacherCard';

interface SubjectDetailViewProps {
  subject: Subject;
  allTeachers: Teacher[];
  allSubjects: Subject[]; // Needed for TeacherCard to resolve subject names
  onBack: () => void;
  onSelectTeacher: (teacher: Teacher) => void;
  onBook: (subject: Subject, type: 'Trial' | 'Admission') => void;
}

const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ subject, allTeachers, allSubjects, onBack, onSelectTeacher, onBook }) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ day: string; time: string } | null>(null);
  const [activeDayTab, setActiveDayTab] = useState<string>('');
  
  const subjectTeachers = useMemo(() => allTeachers.filter(t => t.subjectIds.includes(subject.id)), [allTeachers, subject.id]);

  // Fix: Updated logic to use the new `batches` data structure instead of the old `schedule` property.
  const availableSlotsByDay = useMemo(() => {
    const slots: { [day: string]: Set<string> } = {};
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    dayOrder.forEach(day => slots[day] = new Set());

    subjectTeachers.forEach(teacher => {
      const subjectBatches = teacher.batches.filter(b => b.subjectId === subject.id);
      
      subjectBatches.forEach(batch => {
          batch.days.forEach(day => {
              if (slots[day]) {
                  batch.boardTimeGroups.forEach(boardGroup => {
                      Object.values(boardGroup.levelSlots).forEach(times => {
                          if (Array.isArray(times)) {
                              times.forEach(time => slots[day].add(time));
                          }
                      });
                  });
              }
          });
      });
    });
    
    const sortedSlots: { [day: string]: string[] } = {};

    dayOrder.forEach(day => {
        if (slots[day] && slots[day].size > 0) {
            sortedSlots[day] = Array.from(slots[day]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        }
    });

    return sortedSlots;
  }, [subjectTeachers, subject.id]);

  useEffect(() => {
    const availableDays = Object.keys(availableSlotsByDay);
    if (availableDays.length > 0 && !availableDays.includes(activeDayTab)) {
        setActiveDayTab(availableDays[0]);
    } else if (availableDays.length === 0) {
        setActiveDayTab('');
    }
  }, [availableSlotsByDay, activeDayTab]);


  const handleTimeSlotClick = (day: string, time: string) => {
      if (selectedTimeSlot && selectedTimeSlot.day === day && selectedTimeSlot.time === time) {
          setSelectedTimeSlot(null); // Deselect if clicked again
      } else {
          setSelectedTimeSlot({ day, time });
      }
  };
  
  // Fix: Updated filtering logic to use the new `batches` data structure.
  const filteredTeachers = useMemo(() => {
    if (!selectedTimeSlot) {
        return subjectTeachers;
    }

    return subjectTeachers.filter(teacher => {
        const subjectBatches = teacher.batches.filter(b => b.subjectId === subject.id);

        return subjectBatches.some(batch => {
            if (!batch.days.includes(selectedTimeSlot.day)) {
                return false;
            }
            return batch.boardTimeGroups.some(boardGroup => 
                Object.values(boardGroup.levelSlots).some(times => 
                    Array.isArray(times) && times.includes(selectedTimeSlot.time)
                )
            );
        });
    });
  }, [selectedTimeSlot, subjectTeachers, subject.id]);


  const getSubjectNames = (subjectIds: string[]) => {
      // Fix: The original code iterated over `allSubjects` which caused `id` to be a Subject object,
      // leading to a type error when comparing `s.id === id`. Changed to iterate over `subjectIds`.
      return subjectIds.map(id => allSubjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
  }

  return (
    <div className="relative animate-fade-in -mt-8 sm:-mt-12">
       <button onClick={onBack} className="absolute top-12 left-4 sm:left-6 z-20 text-blue-600 font-semibold flex items-center group bg-white/80 backdrop-blur-sm py-2 px-3 rounded-full hover:bg-white transition-colors">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
         Back
       </button>
      <div className="bg-white rounded-b-2xl shadow-xl shadow-blue-500/10 overflow-hidden">
        {/* Profile Header */}
        <div>
            <div className="h-48 bg-slate-200">
                <img src={subject.imageUrl} alt={`${subject.name} banner`} className="w-full h-full object-cover"/>
            </div>
            <div className="px-6 pb-6">
                <div className="-mt-16">
                    <div className="h-32 w-32 rounded-full ring-4 ring-white bg-slate-100 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                       </svg>
                    </div>
                </div>
                <div className="mt-4">
                    <h1 className="text-3xl font-extrabold text-slate-900">{subject.name}</h1>
                    <p className="text-slate-600 mt-2 max-w-prose">{subject.description}</p>
                </div>
                 <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => onBook(subject, 'Trial')} 
                        className="w-full sm:w-auto bg-amber-400 text-slate-900 font-semibold py-3 px-6 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all text-base"
                    >
                        Book Trial
                    </button>
                    <button 
                        onClick={() => onBook(subject, 'Admission')} 
                        className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all text-base"
                    >
                        Take Admission
                    </button>
                 </div>
            </div>
        </div>

        {/* Time Slots Section */}
        <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Available Time Slots</h2>
            {Object.keys(availableSlotsByDay).length > 0 ? (
                <div>
                    <div className="flex space-x-1 border-b mb-4 overflow-x-auto no-scrollbar">
                        {Object.keys(availableSlotsByDay).map(day => (
                            <button
                                key={day}
                                onClick={() => setActiveDayTab(day)}
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors -mb-px flex-shrink-0 ${
                                    activeDayTab === day
                                    ? 'bg-white border-x border-t text-blue-600'
                                    : 'text-slate-500 hover:bg-slate-100 border-transparent'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {activeDayTab && Array.isArray(availableSlotsByDay[activeDayTab]) && (
                        <div className="flex flex-wrap gap-2 animate-fade-in-fast">
                            {availableSlotsByDay[activeDayTab].map(time => {
                                const isSelected = selectedTimeSlot?.day === activeDayTab && selectedTimeSlot?.time === time;
                                return (
                                    <button
                                        key={time}
                                        onClick={() => handleTimeSlotClick(activeDayTab, time)}
                                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                            isSelected 
                                            ? 'bg-blue-600 text-white border-blue-600 font-semibold' 
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-400'
                                        }`}
                                    >
                                        {formatTime12Hour(time)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-slate-500">No specific time slots are currently scheduled for this subject.</p>
            )}
        </div>
        
        {/* Teachers List */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-200">
             <h2 className="text-xl font-bold text-slate-800 mb-4">
                {selectedTimeSlot 
                    ? `Teachers Available on ${selectedTimeSlot.day} at ${formatTime12Hour(selectedTimeSlot.time)}`
                    : `Teachers for ${subject.name}`
                }
            </h2>
            {filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredTeachers.map(teacher => (
                        <TeacherCard 
                            key={teacher.id} 
                            teacher={teacher} 
                            subjectNames={getSubjectNames(teacher.subjectIds)} 
                            onClick={() => onSelectTeacher(teacher)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                     <p className="text-slate-500">
                        {selectedTimeSlot 
                            ? "No teachers are available at this specific time."
                            : "No teachers are currently available for this subject."
                        }
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailView;
