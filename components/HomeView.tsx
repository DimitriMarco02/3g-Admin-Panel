

import React, { useState, useMemo } from 'react';
import type { Subject, Teacher, Center, OfferSlide, Notice, DiamondStudent, Quiz, QuizSubmission } from '../types';
import SubjectCard from './SubjectCard';
import TeacherCard from './TeacherCard';
import Carousel from './Carousel';

// Custom hook for drag-to-scroll functionality
const useDragToScroll = () => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      el.classList.add('active-scroll');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      el.classList.remove('active-scroll');
    };

    const onMouseUp = () => {
      isDown = false;
      el.classList.remove('active-scroll');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2; // Adjust multiplier for scroll speed
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return ref;
};


interface HomeViewProps {
    subjects: Subject[];
    teachers: Teacher[];
    centers: Center[];
    slides: OfferSlide[];
    notices: Notice[];
    diamondStudents: DiamondStudent[];
    allQuizzes: Quiz[];
    allQuizSubmissions: QuizSubmission[];
    onSelectSubject: (subject: Subject) => void;
    onSelectTeacher: (teacher: Teacher) => void;
    onSelectDiamondStudent: (student: DiamondStudent) => void;
    onSelectCenter: (center: Center) => void;
    onNavigateToQuiz: () => void;
    mode?: 'full' | 'subjectsOnly';
    onBack?: () => void;
}

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="px-4 sm:px-6 mb-4">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm">{subtitle}</p>
    </div>
);

const QuizLeaderboard: React.FC<{
    quizzes: Quiz[];
    submissions: QuizSubmission[];
    onNavigateToQuiz: () => void;
}> = ({ quizzes, submissions, onNavigateToQuiz }) => {
    const activeQuiz = useMemo(() => quizzes.find(q => q.isActive), [quizzes]);
    
    const leaderboard = useMemo(() => {
        if (!activeQuiz) return [];
        return submissions
            .filter(s => s.quizId === activeQuiz.id)
            .sort((a, b) => b.score - a.score || a.timeTaken - a.timeTaken)
            .slice(0, 5); // Top 5
    }, [activeQuiz, submissions]);

    if (!activeQuiz) return null;

    return (
        <section>
            <SectionHeader title="Weekly Quiz Leaderboard" subtitle={`Top performers for "${activeQuiz.title}"`} />
            <div className="px-4 sm:px-6">
                <div className="bg-white rounded-xl shadow-lg shadow-blue-500/5 p-4 border border-slate-100 space-y-3">
                    {leaderboard.length > 0 ? (
                        leaderboard.map((sub, index) => (
                            <div key={sub.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="font-bold text-lg text-slate-400 w-6 text-center">{index + 1}</span>
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                        {sub.studentName.charAt(0)}
                                    </div>
                                    <p className="font-semibold text-slate-800">{sub.studentName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600">{sub.score} / {activeQuiz.questions.length}</p>
                                    <p className="text-xs text-slate-500">{Math.floor(sub.timeTaken / 60)}m {sub.timeTaken % 60}s</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-4">No submissions for this week's quiz yet. Be the first!</p>
                    )}
                     <button 
                        onClick={onNavigateToQuiz}
                        className="w-full mt-4 bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all"
                    >
                        Take This Week's Quiz
                    </button>
                </div>
            </div>
        </section>
    );
};


const HomeView: React.FC<HomeViewProps> = ({ subjects, teachers, centers, slides, notices, diamondStudents, allQuizzes, allQuizSubmissions, onSelectSubject, onSelectTeacher, onSelectDiamondStudent, onSelectCenter, onNavigateToQuiz, mode = 'full', onBack }) => {
    
    const [subjectSearch, setSubjectSearch] = useState('');

    const teachersScrollRef = useDragToScroll();
    const subjectsScrollRef = useDragToScroll();
    const centersScrollRef = useDragToScroll();
    const studentsScrollRef = useDragToScroll();
    
    const getSubjectNames = (subjectIds: string[]) => {
        return subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
    }

    const filteredSubjects = useMemo(() => {
        if (mode === 'subjectsOnly') {
             return subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()));
        }
        return subjects;
    }, [subjects, subjectSearch, mode]);

    const homePageTeachers = useMemo(() => {
        return teachers.filter(t => t.showOnHome);
    }, [teachers]);
    
    if (mode === 'subjectsOnly') {
        return (
            <div className="p-4 sm:p-6 animate-fade-in">
              {onBack && <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Back
                </button>}
              <h2 className="text-3xl font-bold text-slate-800 mb-2 px-0">Subjects</h2>
              <p className="text-slate-600 mb-6 px-0">Select a subject to see more details.</p>

              <div className="mb-8 p-4 bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100">
                  <label htmlFor="subject-search" className="block text-sm font-medium text-slate-700 mb-1">Search Subjects</label>
                  <input
                      id="subject-search"
                      type="text"
                      placeholder="e.g., Physics"
                      value={subjectSearch}
                      onChange={e => setSubjectSearch(e.target.value)}
                      className="w-full p-2.5 border bg-slate-50 border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {filteredSubjects.map(subject => (
                  <SubjectCard key={subject.id} subject={subject} onSelect={onSelectSubject} />
                ))}
              </div>
              {filteredSubjects.length === 0 && (
                <p className="text-center text-slate-500 col-span-full mt-8">No subjects found matching your search.</p>
              )}
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in">

            {/* Offers Slides */}
            <div className="px-4 sm:px-0">
                 <Carousel slides={slides} />
            </div>
            
            {/* Notice Board */}
            <section>
                <SectionHeader title="Notice Board" subtitle="Latest updates and announcements" />
                <div className="px-4 sm:px-6">
                    <div className="bg-white rounded-xl shadow-lg shadow-blue-500/5 p-4 border border-slate-100 space-y-3">
                        {notices.map(notice => (
                            <div key={notice.id} className="flex items-start space-x-3 text-sm text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                <span>{notice.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Quiz Leaderboard */}
            <QuizLeaderboard quizzes={allQuizzes} submissions={allQuizSubmissions} onNavigateToQuiz={onNavigateToQuiz} />
            
            {/* Teachers Section */}
            <section>
                <SectionHeader title="Teachers" subtitle="Meet our expert instructors" />
                <div ref={teachersScrollRef} className="flex overflow-x-auto gap-4 px-4 sm:px-6 py-2 no-scrollbar horizontal-scroll">
                    {homePageTeachers.map(teacher => (
                         <div key={teacher.id} className="flex-shrink-0 w-40">
                            <TeacherCard 
                                teacher={teacher} 
                                subjectNames={getSubjectNames(teacher.subjectIds)}
                                onClick={() => onSelectTeacher(teacher)} 
                            />
                        </div>
                    ))}
                    {homePageTeachers.length === 0 && (
                        <div className="px-4">
                            <p className="text-slate-500">
                                No teachers are currently featured on the home page.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Subject Offers Section */}
            <section>
                <SectionHeader title="Subjects" subtitle="Find the right subject for you" />
                 <div ref={subjectsScrollRef} className="flex overflow-x-auto gap-4 px-4 sm:px-6 py-2 no-scrollbar horizontal-scroll">
                    {filteredSubjects.map(subject => (
                        <div key={subject.id} className="flex-shrink-0 w-44 h-full">
                            <SubjectCard subject={subject} onSelect={onSelectSubject} />
                        </div>
                    ))}
                    {filteredSubjects.length === 0 && <p className="text-slate-500 px-4">No subjects match your search.</p>}
                </div>
            </section>

            {/* Our Centers Section */}
            <section>
                <SectionHeader title="Centers" subtitle="Find a location near you" />
                 <div ref={centersScrollRef} className="flex overflow-x-auto gap-4 px-4 sm:px-6 py-2 no-scrollbar horizontal-scroll">
                   {centers.map(center => (
                        <div key={center.id} className="flex-shrink-0 w-44">
                            <div 
                                onClick={() => onSelectCenter(center)}
                                className="bg-white rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden group transform hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
                                role="button"
                                aria-label={`View details for ${center.name}`}
                            >
                                <img className="w-full h-32 object-cover" src={center.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'} alt={center.name} />
                                <div className="p-3">
                                    <h3 className="font-semibold text-base text-slate-800">{center.name}</h3>
                                    <p className="text-xs text-slate-500">{center.location}</p>
                                </div>
                            </div>
                        </div>
                   ))}
                </div>
            </section>

             {/* Diamond Students Section */}
            <section>
                <SectionHeader title="Diamond Students" subtitle="Celebrating academic excellence" />
                <div ref={studentsScrollRef} className="flex overflow-x-auto gap-4 px-4 sm:px-6 py-2 no-scrollbar horizontal-scroll">
                    {diamondStudents.map(student => (
                        <div key={student.id} className="flex-shrink-0 w-40">
                            <div 
                                onClick={() => onSelectDiamondStudent(student)}
                                className="bg-white rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden group transform hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
                            >
                                <img className="w-full h-40 object-cover object-top" src={student.imageUrl} alt={student.name} />
                                <div className="p-3">
                                    <h3 className="font-semibold text-base text-slate-800">{student.name}</h3>
                                    <p className="text-xs text-slate-500">{student.level} - {student.achievementYear}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomeView;