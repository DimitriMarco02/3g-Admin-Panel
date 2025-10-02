import React, { useRef, useEffect } from 'react';
import type { Subject, Teacher, Center, OfferSlide, Notice, DiamondStudent } from '../types';
import SubjectCard from './SubjectCard';
import TeacherCard from './TeacherCard';
import Carousel from './Carousel';

// --- Reusable Drag-to-Scroll Hook ---
const useDragToScroll = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        const handleMouseDown = (e: MouseEvent) => {
            isDown = true;
            el.classList.add('active-scroll');
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
            el.classList.remove('active-scroll');
        };

        const handleMouseUp = () => {
            isDown = false;
            el.classList.remove('active-scroll');
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast multiplier
            el.scrollLeft = scrollLeft - walk;
        };

        el.addEventListener('mousedown', handleMouseDown);
        el.addEventListener('mouseleave', handleMouseLeave);
        el.addEventListener('mouseup', handleMouseUp);
        el.addEventListener('mousemove', handleMouseMove);

        return () => {
            el.removeEventListener('mousedown', handleMouseDown);
            el.removeEventListener('mouseleave', handleMouseLeave);
            el.removeEventListener('mouseup', handleMouseUp);
            el.removeEventListener('mousemove', handleMouseMove);
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
    onSelectSubject: (subject: Subject) => void;
    onSelectTeacher: (teacher: Teacher) => void;
    onSelectDiamondStudent: (student: DiamondStudent) => void;
    mode?: 'full' | 'subjectsOnly';
}

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="px-4 sm:px-6 mb-4">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 text-sm">{subtitle}</p>
    </div>
);

const HomeView: React.FC<HomeViewProps> = ({ subjects, teachers, centers, slides, notices, diamondStudents, onSelectSubject, onSelectTeacher, onSelectDiamondStudent, mode = 'full' }) => {
    
    const teachersRef = useDragToScroll<HTMLDivElement>();
    const subjectsRef = useDragToScroll<HTMLDivElement>();
    const centersRef = useDragToScroll<HTMLDivElement>();
    const studentsRef = useDragToScroll<HTMLDivElement>();

    const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || 'N/A';
    
    if (mode === 'subjectsOnly') {
        return (
            <div className="p-4 sm:p-6 animate-fade-in">
              <h2 className="text-3xl font-bold text-slate-800 mb-2 px-2">Book a Trial Class</h2>
              <p className="text-slate-600 mb-8 px-2">Select a subject to get started.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map(subject => (
                  <SubjectCard key={subject.id} subject={subject} onSelect={onSelectSubject} />
                ))}
              </div>
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

            {/* Teachers Section */}
            <section>
                <SectionHeader title="Our Teachers" subtitle="Meet our expert instructors" />
                <div ref={teachersRef} className="w-full overflow-x-auto pb-4 no-scrollbar horizontal-scroll">
                    <div className="flex space-x-4 px-4 sm:px-6">
                        {teachers.slice(0, 4).map(teacher => (
                            <div key={teacher.id} className="flex-shrink-0 w-64">
                                <TeacherCard 
                                    teacher={teacher} 
                                    subjectName={getSubjectName(teacher.subjectId)}
                                    onClick={() => onSelectTeacher(teacher)} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Subject Offers Section */}
            <section>
                <SectionHeader title="Our Subjects" subtitle="Find the right subject for you" />
                <div ref={subjectsRef} className="w-full overflow-x-auto pb-4 no-scrollbar horizontal-scroll">
                     <div className="flex space-x-6 px-4 sm:px-6">
                        {subjects.map(subject => (
                            <div key={subject.id} className="flex-shrink-0 w-80">
                                <SubjectCard subject={subject} onSelect={onSelectSubject} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Centers Section */}
            <section>
                <SectionHeader title="Our Centers" subtitle="Find a location near you" />
                 <div ref={centersRef} className="w-full overflow-x-auto pb-4 no-scrollbar horizontal-scroll">
                    <div className="flex space-x-4 px-4 sm:px-6">
                       {centers.map(center => (
                            <div key={center.id} className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden group">
                                 <img className="w-full h-40 object-cover" src={center.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'} alt={center.name} />
                                 <div className="p-4">
                                     <h3 className="font-bold text-slate-800">{center.name}</h3>
                                     <p className="text-sm text-slate-500">{center.location}</p>
                                 </div>
                            </div>
                       ))}
                    </div>
                </div>
            </section>

             {/* Diamond Students Section */}
            <section>
                <SectionHeader title="Our Diamond Students" subtitle="Celebrating academic excellence" />
                <div ref={studentsRef} className="w-full overflow-x-auto pb-4 no-scrollbar horizontal-scroll">
                    <div className="flex space-x-4 px-4 sm:px-6">
                        {diamondStudents.map(student => (
                            <div 
                                key={student.id} 
                                onClick={() => onSelectDiamondStudent(student)}
                                className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-lg shadow-blue-500/5 overflow-hidden group transform hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                            >
                                <img className="w-full h-48 object-cover object-top" src={student.imageUrl} alt={student.name} />
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-800">{student.name}</h3>
                                    <p className="text-sm text-slate-500">{student.level} - {student.achievementYear}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomeView;