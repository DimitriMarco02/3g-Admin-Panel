import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Subject, Teacher, Center, BookingDetails, User } from '../types';
import { CURRICULUMS, CLASS_LEVELS } from '../constants';
import Calendar from './Calendar';
import TeachersList from './TeachersList';

interface BookingFormProps {
  subject: Subject;
  currentUser: User;
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

const BookingForm: React.FC<BookingFormProps> = ({ subject, currentUser, allTeachers, allCenters, onSubmit, onBack }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [error, setError] = useState('');
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState<'top' | 'bottom'>('bottom');
  
  const dateInputRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDate]);

  const availableTimesForDay = useMemo(() => {
    if (!dayOfWeek) return [];
    const subjectTeachers = allTeachers.filter(t => t.subjectId === subject.id);
    const times = new Set<string>();
    subjectTeachers.forEach(teacher => {
      const daySchedule = teacher.schedule.find(s => s.day === dayOfWeek);
      if (daySchedule) {
        daySchedule.times.forEach(time => times.add(time));
      }
    });
    return Array.from(times).sort((a, b) => a.localeCompare(b));
  }, [dayOfWeek, allTeachers, subject.id]);

  const teachersForSelectedDateTime = useMemo(() => {
    if (!dayOfWeek || !selectedTime) return [];
    const subjectTeachers = allTeachers.filter(t => t.subjectId === subject.id);
    return subjectTeachers.filter(teacher => {
      const daySchedule = teacher.schedule.find(s => s.day === dayOfWeek);
      return daySchedule && daySchedule.times.includes(selectedTime);
    });
  }, [dayOfWeek, selectedTime, allTeachers, subject.id]);

  const centersForSelectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return [];
    const teacher = allTeachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return [];
    return allCenters.filter(center => teacher.centerIds.includes(center.id));
  }, [selectedTeacherId, allTeachers, allCenters]);
  
  useEffect(() => {
    setSelectedTime('');
    setSelectedTeacherId(null);
  }, [selectedDate]);

  useEffect(() => {
    setSelectedTeacherId(null);
  }, [selectedTime]);

  useEffect(() => {
    setSelectedCenterId(null);
  }, [selectedTeacherId]);

  const handleDateInputClick = () => {
    if (dateInputRef.current) {
      const rect = dateInputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calendarHeightEstimate = 380;
      
      if (spaceBelow < calendarHeightEstimate && rect.top > spaceBelow) {
        setCalendarPosition('top');
      } else {
        setCalendarPosition('bottom');
      }
    }
    setCalendarOpen(prev => !prev);
  }
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCalendarOpen && dateInputRef.current && !dateInputRef.current.contains(event.target as Node) && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurriculum || !selectedClassLevel || !selectedDate || !selectedTime || !selectedTeacherId || !selectedCenterId) {
      setError('Please complete all steps to book your trial.');
      return;
    }
    setError('');
    
    onSubmit({
      curriculum: selectedCurriculum,
      classLevel: selectedClassLevel,
      teacherId: selectedTeacherId,
      centerId: selectedCenterId,
      date: selectedDate,
      time: selectedTime,
    });
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        Back to Subjects
      </button>
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Book Trial Class</h2>
        <p className="text-slate-600 mb-2">Subject: <span className="font-semibold text-blue-600">{subject.name}</span></p>
        <p className="text-slate-600 mb-8">Booking for: <span className="font-semibold text-blue-600">{currentUser.name}</span></p>

        <form onSubmit={handleSubmit} className="space-y-6">
           <hr/>
           {/* --- ACADEMIC INFO --- */}
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

          {/* --- STEP 1: DATE --- */}
          <div className="relative" ref={dateInputRef}>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">1. Select a Date</h3>
              <div onClick={handleDateInputClick} className="w-full p-3 border border-slate-300 rounded-lg text-black cursor-pointer flex justify-between items-center bg-white">
                <span>{selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : <span className="text-slate-400">Click to pick a date</span>}</span>
                 <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
              </div>
            {isCalendarOpen && (
              <div ref={calendarRef} className={`absolute z-20 mt-2 w-full ${calendarPosition === 'top' ? 'bottom-full mb-2' : 'top-full'}`}>
                  <Calendar selectedDate={selectedDate} onDateSelect={(date) => { setSelectedDate(date); setCalendarOpen(false); }} minDate={minDateString}/>
              </div>
            )}
          </div>
          
          {/* --- SUBSEQUENT STEPS --- */}
          {selectedDate && (
            <div className="space-y-6 animate-fade-in">
              <hr/>
              {/* --- STEP 2: TIME --- */}
               <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">2. Select a Time</h3>
                  {availableTimesForDay.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableTimesForDay.map(time => (
                        <button type="button" key={time} onClick={() => setSelectedTime(time)}
                          className={`p-3 border rounded-lg text-center transition-all duration-200 ${
                            selectedTime === time
                              ? 'bg-amber-400 text-slate-900 border-amber-400 shadow-lg font-semibold'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-400'
                          }`}
                        >
                          {formatTime12Hour(time)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No available times for this subject on the selected day.</p>
                  )}
                </div>

              {/* --- STEP 3: TEACHER --- */}
              {selectedTime && (
                <div className="animate-fade-in">
                  <hr/>
                  <TeachersList teachers={teachersForSelectedDateTime} selectedTeacherId={selectedTeacherId} onSelectTeacher={setSelectedTeacherId} />
                </div>
              )}
              
              <hr/>
              
              {/* --- STEP 4: CENTER --- */}
              {selectedTeacherId && centersForSelectedTeacher.length > 0 &&
                <div className="animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">4. Select a Center</h3>
                    <select id="center" value={selectedCenterId || ''} onChange={e => setSelectedCenterId(e.target.value ? parseInt(e.target.value) : null)} required className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="" disabled>Choose a center...</option>
                    {centersForSelectedTeacher.map(center => <option key={center.id} value={center.id}>{center.name}</option>)}
                    </select>
                </div>
              }
            </div>
          )}

          {error && <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}

          <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-4 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all duration-300 ease-in-out text-lg">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;