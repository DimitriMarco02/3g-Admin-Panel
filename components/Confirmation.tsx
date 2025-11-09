
import React from 'react';
import type { ConfirmedBookingDetails } from '../types';

interface ConfirmationProps {
  bookingDetails: ConfirmedBookingDetails;
  onNewBooking: () => void;
}

const Confirmation: React.FC<ConfirmationProps> = ({ bookingDetails, onNewBooking }) => {
  const { studentName, subject, teacher, center, dateTime, phone, curriculum, classLevel, bookingType } = bookingDetails;
  
  const formattedDate = dateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="p-4 sm:p-6 animate-fade-in text-center max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-green-500/10 p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{bookingType} Booking Confirmed!</h2>
        <p className="text-slate-600 mb-8">
          Great work, {studentName}! Your {bookingType.toLowerCase()} class is scheduled. We'll send a reminder to {phone}.
        </p>

        <div className="text-left bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Booking Type:</span>
            <span className="text-slate-900 font-bold">{bookingType}</span>
          </div>
          <hr/>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Subject:</span>
            <span className="text-slate-900 font-bold">{subject.name}</span>
          </div>
          <hr/>
           <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Curriculum:</span>
            <span className="text-slate-900">{curriculum}</span>
          </div>
          <hr/>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Class Level:</span>
            <span className="text-slate-900">{classLevel}</span>
          </div>
          <hr/>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Teacher:</span>
            <span className="text-slate-900">{teacher.name}</span>
          </div>
          <hr/>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Center:</span>
            <span className="text-slate-900">{center.name}</span>
          </div>
          <hr/>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Date:</span>
            <span className="text-slate-900">{formattedDate}</span>
          </div>
          <hr/>
           <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Time:</span>
            <span className="text-slate-900">{formattedTime}</span>
          </div>
        </div>

        <button onClick={onNewBooking} className="mt-8 w-full bg-amber-400 text-slate-900 font-semibold py-3 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all">
          Book Another Class
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
