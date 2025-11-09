import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Center, Teacher, Subject } from '../types';
import TeacherCard from './TeacherCard';

// Custom hook for drag-to-scroll functionality
const useDragToScroll = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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


interface CenterDetailViewProps {
  center: Center;
  allTeachers: Teacher[];
  allSubjects: Subject[];
  onBack: () => void;
  onSelectTeacher: (teacher: Teacher) => void;
}

const CenterDetailView: React.FC<CenterDetailViewProps> = ({ center, allTeachers, allSubjects, onBack, onSelectTeacher }) => {

  const teachersAtCenter = useMemo(() => {
    return allTeachers.filter(teacher => teacher.centerIds.includes(center.id));
  }, [allTeachers, center.id]);

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds.map(id => allSubjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
  }

  const mapSrc = `https://maps.google.com/maps?q=${center.latitude},${center.longitude}&z=15&output=embed`;

  const imageUrls = useMemo(() => {
    if (center.sliderImageUrls && center.sliderImageUrls.length > 0) {
        return center.sliderImageUrls;
    }
    if (center.imageUrl) {
        return [center.imageUrl];
    }
    // Default fallback image if no images are provided
    return ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'];
  }, [center]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
      setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
      setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };
  
  useEffect(() => {
    // Reset index if center changes to avoid out-of-bounds error
    setCurrentImageIndex(0);
  }, [center]);

  const teachersScrollRef = useDragToScroll();

  return (
    <div className="animate-fade-in p-4 sm:p-6 space-y-8">
        {/* Slider Section */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10">
            
            {/* Image Slider */}
            <div className="relative h-64 sm:h-80 bg-slate-200">
                <button onClick={onBack} className="absolute top-4 left-4 z-20 text-blue-600 font-semibold flex items-center group bg-white/80 backdrop-blur-sm py-2 px-3 rounded-full hover:bg-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Back
                </button>
                <div className="flex transition-transform ease-in-out duration-500 h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                    {imageUrls.map((url, index) => (
                         <img key={index} src={url} alt={`${center.name} view ${index + 1}`} className="w-full h-full object-cover flex-shrink-0" />
                    ))}
                </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                 {imageUrls.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full text-slate-800 transition-colors z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full text-slate-800 transition-colors z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                            {imageUrls.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    className={`h-2 w-2 rounded-full transition-all ${currentImageIndex === index ? 'bg-white w-4' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">{center.name}</h1>
        <p className="text-slate-500 font-semibold mt-1 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 21l-4.95-6.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            {center.location}
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">About This Center</h2>
                    <p className="text-slate-600 text-sm max-w-prose whitespace-pre-line">{center.about}</p>
                </section>
                
                {/* Contact Section */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-3">Contact Information</h2>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
                        <div className="flex items-center text-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                            <a href={`tel:${center.phone}`} className="hover:underline hover:text-blue-600">{center.phone}</a>
                        </div>
                        <div className="flex items-center text-slate-700">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                            <a href={`mailto:${center.email}`} className="hover:underline hover:text-blue-600">{center.email}</a>
                        </div>
                    </div>
                </section>
            </div>
            {/* Map Section */}
            <div className="lg:col-span-1">
                 <h2 className="text-xl font-bold text-slate-800 mb-3">Find Us</h2>
                <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-slate-200">
                    <iframe
                        width="100%"
                        height="100%"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapSrc}
                        className="border-0"
                    ></iframe>
                </div>
            </div>
        </div>
      </div>
       {/* Teachers Section */}
        <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 px-4 sm:px-0">Instructors at this Center</h2>
            {teachersAtCenter.length > 0 ? (
                <div ref={teachersScrollRef} className="flex overflow-x-auto gap-4 py-2 no-scrollbar horizontal-scroll -mx-4 sm:-mx-0 px-4 sm:px-0">
                    {teachersAtCenter.map(teacher => (
                         <div key={teacher.id} className="flex-shrink-0 w-44">
                            <TeacherCard 
                                teacher={teacher} 
                                subjectNames={getSubjectNames(teacher.subjectIds)}
                                onClick={() => onSelectTeacher(teacher)} 
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg p-8 text-center">
                    <p className="text-slate-500 text-sm">No instructors are currently assigned to this center.</p>
                </div>
            )}
        </section>
    </div>
  );
};

export default CenterDetailView;