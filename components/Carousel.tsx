import React, { useState, useEffect, useCallback } from 'react';

interface Slide {
    id: number;
    imageUrl: string;
    title: string;
    description: string;
}

interface CarouselProps {
    slides: Slide[];
}

const Carousel: React.FC<CarouselProps> = ({ slides }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
    }, [slides.length]);

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
        return () => clearInterval(slideInterval);
    }, [nextSlide]);

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    if (!slides || slides.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full max-w-4xl mx-auto h-64 sm:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
            <div
                className="flex transition-transform ease-in-out duration-700 h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {slides.map(slide => (
                    <div key={slide.id} className="relative w-full flex-shrink-0 h-full">
                        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 flex flex-col justify-end">
                            <h2 className="text-white text-2xl font-bold">{slide.title}</h2>
                            <p className="text-white/90 text-sm mt-1">{slide.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {slides.map((_, slideIndex) => (
                    <button
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`h-2 w-2 rounded-full transition-all ${
                            currentIndex === slideIndex ? 'bg-white w-4' : 'bg-white/50'
                        }`}
                        aria-label={`Go to slide ${slideIndex + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Carousel;