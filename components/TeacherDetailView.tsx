

import React, { useState, useMemo } from 'react';
import type { Teacher, Subject, Center, User, Review } from '../types';

interface TeacherDetailViewProps {
  teacher: Teacher;
  allSubjects: Subject[];
  allCenters: Center[];
  currentUser: User | null;
  onBack: () => void;
  onBook: (subject: Subject) => void;
  onAddReview: (teacherId: string, review: Omit<Review, 'id'>) => void;
}

const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

type TeacherTab = 'biography' | 'experience' | 'education' | 'schedule' | 'reviews';

const TeacherDetailView: React.FC<TeacherDetailViewProps> = ({ teacher, allSubjects, allCenters, currentUser, onBack, onBook, onAddReview }) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('schedule');
  const teacherCenters = allCenters.filter(c => teacher.centerIds.includes(c.id));
  const teacherSubjects = useMemo(() => {
    return teacher.subjectIds.map(id => allSubjects.find(s => s.id === id)).filter((s): s is Subject => !!s);
  }, [teacher.subjectIds, allSubjects]);

  const TabButton: React.FC<{tabId: TeacherTab; label: string}> = ({ tabId, label }) => (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors ${
            activeTab === tabId 
            ? 'bg-blue-100 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {label}
      </button>
  );

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
                <img src={teacher.bannerUrl} alt={`${teacher.name} banner`} className="w-full h-full object-cover"/>
            </div>
            <div className="px-6 pb-6">
                <div className="-mt-16">
                    <img src={teacher.imageUrl} alt={teacher.name} className="h-32 w-32 rounded-full object-cover ring-4 ring-white bg-slate-300"/>
                </div>
                <div className="mt-4">
                    <h1 className="text-3xl font-extrabold text-slate-900">{teacher.name}</h1>
                    <p className="text-blue-600 font-bold mt-1">{teacherSubjects.map(s => s.name).join(' & ')} Instructor</p>
                    <p className="text-slate-500 text-sm">at {teacherCenters.map(c => c.name).join(' & ')}</p>
                </div>
                 <div className="mt-6">
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-800">Take Admission for:</h3>
                        <div className="flex flex-wrap gap-2">
                           {teacherSubjects.map(subject => (
                              <button key={subject.id} onClick={() => onBook(subject)} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all text-sm">
                                  {subject.name}
                              </button>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 flex space-x-2 flex-wrap">
            <TabButton tabId="schedule" label="Schedule" />
            <TabButton tabId="biography" label="Biography" />
            <TabButton tabId="experience" label="Experience" />
            <TabButton tabId="education" label="Education" />
            <TabButton tabId="reviews" label="Reviews" />
        </div>

        {/* Tab Content */}
        <div className="p-6">
            {activeTab === 'biography' && <BiographyTab teacher={teacher} />}
            {activeTab === 'schedule' && <ScheduleTab teacher={teacher} allCenters={allCenters} allSubjects={allSubjects} />}
            {activeTab === 'experience' && <ExperienceTab teacher={teacher} />}
            {activeTab === 'education' && <EducationTab teacher={teacher} />}
            {activeTab === 'reviews' && <ReviewsTab teacher={teacher} currentUser={currentUser} onAddReview={onAddReview} />}
        </div>
      </div>
    </div>
  );
};

const BiographyTab: React.FC<{teacher: Teacher}> = ({ teacher }) => (
    <div className="animate-fade-in-fast">
        <h3 className="text-xl font-bold text-slate-800 mb-4">About {teacher.name.split(' ')[0]}</h3>
        <p className="text-slate-600 text-sm max-w-prose whitespace-pre-line">{teacher.bio}</p>
    </div>
);

const ScheduleTab: React.FC<{teacher: Teacher, allCenters: Center[], allSubjects: Subject[]}> = ({ teacher, allCenters, allSubjects }) => {
    return (
        <div className="animate-fade-in-fast">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Weekly Batches</h3>
            <div className="space-y-4">
                {teacher.batches.length > 0 ? teacher.batches.map(batch => {
                    const subject = allSubjects.find(s => s.id === batch.subjectId);
                    const center = allCenters.find(c => c.id === batch.centerId);
                    if (!subject || !center) return null;

                    return (
                        <div key={batch.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-800 text-lg">{batch.batchName}</h4>
                            <p className="text-sm text-slate-500">{subject.name} at {center.name}</p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">{batch.days.join(' - ')}</p>

                            <div className="mt-3 space-y-3">
                                {batch.boardTimeGroups.map(boardGroup => (
                                    <div key={boardGroup.boardName}>
                                        <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">{boardGroup.boardName}</p>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {Object.entries(boardGroup.levelSlots).map(([level, times]) =>
                                                // Fix: Add Array.isArray check to correctly narrow the type of 'times' and prevent errors.
                                                (Array.isArray(times) && times.length > 0) && (
                                                    <div key={level} className="flex items-baseline space-x-2 bg-white p-2 rounded-lg border">
                                                        <span className="font-semibold text-sm text-slate-700">{level}:</span>
                                                        <span className="text-sm text-slate-600">{times.map(formatTime12Hour).join(', ')}</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }) : <p className="text-center text-slate-500 py-8">No batches have been scheduled for this teacher.</p>}
            </div>
        </div>
    );
};

const ExperienceTab: React.FC<{teacher: Teacher}> = ({ teacher }) => (
    <div className="animate-fade-in-fast">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Work Experience</h3>
        {teacher.experience.length > 0 ? (
            <div className="space-y-4 border-l-2 border-slate-200 pl-6">
                {teacher.experience.map(exp => (
                    <div key={exp.id}>
                        <p className="font-bold text-slate-800">{exp.role}</p>
                        <p className="text-slate-600">{exp.company}</p>
                        <p className="text-sm text-slate-400">{exp.duration}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-slate-500">No work experience listed.</p>}
    </div>
);

const EducationTab: React.FC<{teacher: Teacher}> = ({ teacher }) => (
    <div className="animate-fade-in-fast">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Education</h3>
        {teacher.education.length > 0 ? (
             <div className="space-y-4 border-l-2 border-slate-200 pl-6">
                {teacher.education.map(edu => (
                    <div key={edu.id}>
                        <p className="font-bold text-slate-800">{edu.degree}</p>
                        <p className="text-slate-600">{edu.institution}</p>
                        <p className="text-sm text-slate-400">Graduated: {edu.year}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-slate-500">No education history listed.</p>}
    </div>
);

const ReviewsTab: React.FC<{
    teacher: Teacher;
    currentUser: User | null;
    onAddReview: (teacherId: string, review: Omit<Review, 'id'>) => void;
}> = ({ teacher, currentUser, onAddReview }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (comment && rating > 0 && currentUser) {
            onAddReview(teacher.id, { reviewerName: currentUser.name, rating, comment });
            setRating(0);
            setComment('');
        }
    };
    
    return (
        <div className="animate-fade-in-fast">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Student Reviews</h3>
            <div className="space-y-6">
                {teacher.reviews.length > 0 ? teacher.reviews.map(review => (
                    <div key={review.id} className="flex space-x-4">
                         <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                           {review.reviewerName.charAt(0)}
                         </div>
                         <div>
                            <div className="flex items-center space-x-2">
                                <p className="font-semibold text-slate-800">{review.reviewerName}</p>
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                            </div>
                            <p className="text-slate-600 mt-1">{review.comment}</p>
                         </div>
                    </div>
                )) : <p className="text-slate-500">No reviews yet.</p>}
            </div>

            {currentUser && (
                <div className="mt-8 pt-6 border-t">
                     <h4 className="font-bold text-slate-800 mb-2">Leave a Review</h4>
                     <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-black">Rating</label>
                            <div className="flex space-x-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <button key={i} type="button" onClick={() => setRating(i + 1)}>
                                        <svg className={`h-6 w-6 transition-colors ${i < rating ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." required rows={3} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-black"></textarea>
                        <button type="submit" className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 transition-colors">Submit Review</button>
                     </form>
                </div>
            )}
        </div>
    );
}

export default TeacherDetailView;