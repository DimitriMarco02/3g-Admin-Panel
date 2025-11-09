

import React, { useState, useMemo, useEffect } from 'react';
import type { Subject, Teacher, Center, BookingDetails, User, ScheduleLevel, Batch } from '../types';
import { CURRICULUMS, CLASS_LEVELS } from '../constants';
import Calendar from './Calendar';

interface BookingFormProps {
  subject: Subject;
  currentUser: User;
  bookingType: 'Trial' | 'Admission';
  allTeachers: Teacher[];
  allCenters: Center[];
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}

const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getScheduleKeyForClassLevel = (classLevel: string): ScheduleLevel | null => {
    if (classLevel === "O Level" || classLevel === "IGCSE") return 'O-Level';
    if (classLevel === "AS Level") return 'AS-Level';
    if (classLevel === "A2 Level") return 'A2';
    return null;
};

const getNextDateForDays = (daysOfWeek: string[]): Date => {
    if (!daysOfWeek || daysOfWeek.length === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }
    const dayMap: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const targetDays = daysOfWeek.map(d => dayMap[d]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        if (targetDays.includes(testDate.getDay())) {
            return testDate;
        }
    }
    return today; // Fallback
};


const BookingForm: React.FC<BookingFormProps> = ({ subject, currentUser, bookingType, allTeachers, allCenters, onSubmit, onBack }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selection, setSelection] = useState<{ teacherId: string; centerId: string; time: string; batchId?: string; } | null>(null);
  const [error, setError] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDate]);

  const subjectTeachers = useMemo(() => allTeachers.filter(t => t.subjectIds.includes(subject.id)), [allTeachers, subject.id]);

  useEffect(() => {
    setSelection(null);
  }, [selectedDate, selectedClassLevel, selectedCurriculum]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurriculum || !selectedClassLevel || !selectedDate || !selection) {
      setError('Please complete all steps to book your class.');
      return;
    }
    setError('');
    
    onSubmit({
      curriculum: selectedCurriculum,
      classLevel: selectedClassLevel,
      teacherId: selection.teacherId,
      centerId: selection.centerId,
      date: selectedDate,
      time: selection.time,
      batchId: selection.batchId,
    });
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
        <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Back to Subjects
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Book {bookingType} for {subject.name}</h2>
        <p className="text-slate-600 mb-8">Booking for: <span className="font-semibold text-blue-600">{currentUser.name}</span></p>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="curriculum" className="block text-sm font-medium text-slate-700 mb-1">Select Curriculum</label>
              <select id="curriculum" value={selectedCurriculum} onChange={e => setSelectedCurriculum(e.target.value)} required className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="" disabled>Choose a curriculum...</option>
                {CURRICULUMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="class-level" className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
              <select id="class-level" value={selectedClassLevel} onChange={e => setSelectedClassLevel(e.target.value)} required className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="" disabled>Choose a class level...</option>
                {CLASS_LEVELS.map(cl => <option key={cl} value={cl}>{cl}</option>)}
              </select>
            </div>
           </div>
           <hr/>

            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Select a Teacher & Schedule</h3>
                <div className="space-y-3">
                    {subjectTeachers.map(teacher => 
                        bookingType === 'Trial' ? (
                            <TeacherScheduleAccordion 
                                key={teacher.id}
                                teacher={teacher}
                                subject={subject}
                                allCenters={allCenters}
                                isExpanded={expandedTeacherId === teacher.id}
                                onToggle={() => setExpandedTeacherId(expandedTeacherId === teacher.id ? null : teacher.id)}
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                dayOfWeek={dayOfWeek}
                                selectedCurriculum={selectedCurriculum}
                                selectedClassLevel={selectedClassLevel}
                                selection={selection}
                                onSelectSlot={(centerId, time) => setSelection({teacherId: teacher.id, centerId, time})}
                                minDate={minDateString}
                            />
                        ) : (
                             <TeacherAdmissionAccordion
                                key={teacher.id}
                                teacher={teacher}
                                subject={subject}
                                allCenters={allCenters}
                                isExpanded={expandedTeacherId === teacher.id}
                                onToggle={() => {
                                    setExpandedTeacherId(expandedTeacherId === teacher.id ? null : teacher.id);
                                }}
                                selectedCurriculum={selectedCurriculum}
                                selectedClassLevel={selectedClassLevel}
                                selection={selection}
                                onSelectSlot={(centerId, days, time, batchId) => {
                                    const nextDate = getNextDateForDays(days);
                                    const dateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
                                    setSelectedDate(dateString);
                                    setSelection({ teacherId: teacher.id, centerId, time, batchId });
                                }}
                            />
                        )
                    )}
                </div>
            </div>

          {error && <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-4 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all duration-300 ease-in-out text-lg">
             {bookingType === 'Trial' ? 'Confirm Booking' : 'Confirm Admission'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface TeacherScheduleAccordionProps {
    teacher: Teacher;
    subject: Subject;
    allCenters: Center[];
    isExpanded: boolean;
    onToggle: () => void;
    selectedDate: string;
    onDateSelect: (date: string) => void;
    dayOfWeek: string | null;
    selectedCurriculum: string;
    selectedClassLevel: string;
    selection: { teacherId: string; centerId: string; time: string; } | null;
    onSelectSlot: (centerId: string, time: string) => void;
    minDate: string;
}

const TeacherScheduleAccordion: React.FC<TeacherScheduleAccordionProps> = ({ teacher, subject, allCenters, isExpanded, onToggle, selectedDate, onDateSelect, dayOfWeek, selectedCurriculum, selectedClassLevel, selection, onSelectSlot, minDate }) => {
    
    const scheduleKey = getScheduleKeyForClassLevel(selectedClassLevel);

    const availableSlotsByCenter = useMemo(() => {
        if (!scheduleKey || !dayOfWeek || !selectedCurriculum) {
            return [];
        }
        
        const slotsByCenter: { [centerId: string]: { center: Center, times: Set<string> } } = {};
        
        const relevantBatches = teacher.batches.filter(b => b.subjectId === subject.id);

        relevantBatches.forEach(batch => {
            if (batch.days.includes(dayOfWeek)) {
                const boardGroup = batch.boardTimeGroups.find(bg => bg.boardName === selectedCurriculum);
                if (boardGroup) {
                    const times = boardGroup.levelSlots[scheduleKey];
                    if (times && times.length > 0) {
                        const center = allCenters.find(c => c.id === batch.centerId);
                        if (center) {
                            if (!slotsByCenter[center.id]) {
                                slotsByCenter[center.id] = { center, times: new Set() };
                            }
                            times.forEach(time => slotsByCenter[center.id].times.add(time));
                        }
                    }
                }
            }
        });
        
        return Object.values(slotsByCenter).map(data => ({
            center: data.center,
            times: Array.from(data.times).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))
        }));
    }, [teacher.batches, subject.id, scheduleKey, dayOfWeek, selectedCurriculum, allCenters]);
    
    const teacherCenters = useMemo(() => allCenters.filter(c => teacher.centerIds.includes(c.id)), [allCenters, teacher.centerIds]);

    return (
        <div className="border rounded-lg overflow-hidden transition-all duration-300">
            <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100">
                <div className="flex items-center space-x-3 text-left">
                    <img src={teacher.imageUrl} alt={teacher.name} className="h-12 w-12 rounded-full object-cover"/>
                    <div>
                        <p className="font-bold text-slate-800">{teacher.name}</p>
                        <p className="text-xs text-slate-500">{teacherCenters.map(c => c.name).join(', ')}</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white animate-fade-in-fast">
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">1. Pick a date</h4>
                        <Calendar selectedDate={selectedDate} onDateSelect={onDateSelect} minDate={minDate} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">2. Pick a time</h4>
                        {!selectedCurriculum ? <p className="text-sm text-slate-400">Please select a curriculum first.</p>
                        : !selectedClassLevel ? <p className="text-sm text-slate-400">Please select a class level first.</p>
                        : !selectedDate ? <p className="text-sm text-slate-400">Please select a date.</p>
                        : (
                            <div className="space-y-4">
                                {availableSlotsByCenter.length > 0 ? (
                                    availableSlotsByCenter.map(({ center, times }) => (
                                        <div key={center.id}>
                                            <p className="font-medium text-sm text-slate-600 mb-2">{center.name}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {times.map(time => {
                                                    const isSelected = selection?.teacherId === teacher.id && selection?.centerId === center.id && selection?.time === time;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={time}
                                                            onClick={() => onSelectSlot(center.id, time)}
                                                            className={`p-2 border rounded-md text-sm text-center transition-all ${isSelected ? 'bg-amber-400 text-slate-900 border-amber-400 font-semibold' : 'bg-white hover:bg-amber-50 hover:border-amber-300'}`}
                                                        >
                                                            {formatTime12Hour(time)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400">No available slots for this teacher on the selected day/curriculum.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface TeacherAdmissionAccordionProps {
    teacher: Teacher;
    subject: Subject;
    allCenters: Center[];
    isExpanded: boolean;
    onToggle: () => void;
    selectedCurriculum: string;
    selectedClassLevel: string;
    selection: { teacherId: string; centerId: string; time: string; } | null;
    onSelectSlot: (centerId: string, days: string[], time: string, batchId: string) => void;
}

const TeacherAdmissionAccordion: React.FC<TeacherAdmissionAccordionProps> = ({ teacher, subject, allCenters, isExpanded, onToggle, selectedCurriculum, selectedClassLevel, selection, onSelectSlot }) => {
    
    const scheduleKey = getScheduleKeyForClassLevel(selectedClassLevel);

    const subjectBatches = useMemo(() => {
        return teacher.batches.filter(b => b.subjectId === subject.id);
    }, [teacher.batches, subject.id]);

    const getTimesForBatch = (batch: Batch): string[] => {
        if (!scheduleKey || !selectedCurriculum) return [];
        const boardGroup = batch.boardTimeGroups.find(bg => bg.boardName === selectedCurriculum);
        if (boardGroup && boardGroup.levelSlots[scheduleKey]) {
            return Array.from(boardGroup.levelSlots[scheduleKey] as string[]).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
        }
        return [];
    };
    
    const teacherCenters = useMemo(() => allCenters.filter(c => teacher.centerIds.includes(c.id)), [allCenters, teacher.centerIds]);

    return (
        <div className="border rounded-lg overflow-hidden transition-all duration-300">
            <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100">
                <div className="flex items-center space-x-3 text-left">
                    <img src={teacher.imageUrl} alt={teacher.name} className="h-12 w-12 rounded-full object-cover"/>
                    <div>
                        <p className="font-bold text-slate-800">{teacher.name}</p>
                        <p className="text-xs text-slate-500">{teacherCenters.map(c => c.name).join(', ')}</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isExpanded && (
                <div className="p-4 bg-white animate-fade-in-fast space-y-3">
                    <h4 className="font-semibold text-slate-700 mb-2">Select a batch</h4>
                    {!selectedCurriculum || !selectedClassLevel ? (
                        <p className="text-sm text-slate-400">Please select curriculum and class level first.</p>
                    ) : (() => {
                        if (subjectBatches.length === 0) {
                            return <p className="text-sm text-slate-400">No batches available for this teacher and subject.</p>;
                        }

                        const renderedBatches = subjectBatches.map(batch => {
                            const center = allCenters.find(c => c.id === batch.centerId);
                            const availableTimes = getTimesForBatch(batch);
                            if (availableTimes.length === 0) return null;
                            
                            return (
                                <div key={batch.id} className="border rounded-lg">
                                    <div className="w-full text-left p-3 bg-slate-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{batch.batchName}</p>
                                            <p className="text-xs text-slate-500">{center?.name} - {batch.days.join(', ')}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {availableTimes.map((time: string) => {
                                            const isSelected = selection?.teacherId === teacher.id && selection?.centerId === batch.centerId && selection?.time === time;
                                            return (
                                                <button
                                                    type="button"
                                                    key={time}
                                                    onClick={() => onSelectSlot(batch.centerId, batch.days, time, batch.id)}
                                                    className={`p-2 border rounded-md text-sm text-center transition-all ${isSelected ? 'bg-amber-400 text-slate-900 border-amber-400 font-semibold' : 'bg-white hover:bg-amber-50 hover:border-amber-300'}`}
                                                >
                                                    {formatTime12Hour(time)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        }).filter(Boolean);

                        if (renderedBatches.length > 0) {
                            return <div className="space-y-3">{renderedBatches}</div>;
                        } else {
                            return <p className="text-sm text-slate-400">No batches match the selected curriculum/level for this teacher.</p>;
                        }
                    })()}
                </div>
            )}
        </div>
    );
};

export default BookingForm;