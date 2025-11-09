import React from 'react';
import type { ConfirmedBookingDetails, User, BookingStatus } from '../types';

interface BookingsListProps {
  allBookings: ConfirmedBookingDetails[];
  currentUser: User | null;
  onTakeAdmission: (booking: ConfirmedBookingDetails) => void;
  onTakeAdmissionForAll: (bookings: ConfirmedBookingDetails[]) => void;
  onDownloadReceipt: (booking: ConfirmedBookingDetails) => void;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onBack: () => void;
}

const BookingsList: React.FC<BookingsListProps> = ({ allBookings, currentUser, onTakeAdmission, onTakeAdmissionForAll, onDownloadReceipt, onUpdateBookingStatus, onBack }) => {
  
  const userBookings = currentUser ? allBookings.filter(b => b.userId === currentUser.id) : [];
  const eligibleForAdmission = userBookings.filter(b => b.status === 'Booked' || b.status === 'Completed');

  const getStatusStyles = (status: ConfirmedBookingDetails['status']) => {
    switch (status) {
      case 'Admitted': return 'bg-purple-100 text-purple-800';
      case 'Pending Admission': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Canceled': return 'bg-red-100 text-red-800';
      case 'Booked': default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Back
      </button>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">My Bookings</h2>
        {eligibleForAdmission.length > 1 && (
            <button
                onClick={() => onTakeAdmissionForAll(eligibleForAdmission)}
                className="bg-green-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all text-sm"
            >
                Take Admission for All ({eligibleForAdmission.length})
            </button>
        )}
      </div>

      {userBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-slate-500">Go back to the home page to book a trial class.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userBookings.slice().sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime()).map((booking) => (
            <div key={booking.id} className="bg-white p-5 rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <p className="font-bold text-xl text-blue-600">{booking.subject.name}</p>
                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyles(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">For <span className="font-semibold text-slate-800">{booking.studentName}</span></p>
                </div>
                <div className="mt-4 sm:mt-0 sm:text-right flex-shrink-0">
                  <p className="font-semibold text-slate-800">{booking.dateTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  <p className="text-slate-500">{booking.dateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500 grid grid-cols-2 sm:flex sm:flex-row sm:space-x-6 gap-y-2 sm:space-y-0">
                <span>Curriculum: <span className="font-medium text-slate-700">{booking.curriculum}</span></span>
                <span>Level: <span className="font-medium text-slate-700">{booking.classLevel}</span></span>
                <span>Teacher: <span className="font-medium text-slate-700">{booking.teacher.name}</span></span>
                <span>Center: <span className="font-medium text-slate-700">{booking.center.name}</span></span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-3 items-center">
                  {(booking.status === 'Booked' || booking.status === 'Completed') && (
                      <button 
                          onClick={() => onTakeAdmission(booking)}
                          className="w-full sm:w-auto bg-green-400 text-slate-900 font-semibold py-2 px-5 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 ease-in-out text-sm">
                          Take Admission
                      </button>
                  )}
                  {booking.status === 'Booked' && (
                      <>
                          <button
                              onClick={() => onUpdateBookingStatus(booking.id, 'Completed')}
                              className="bg-green-100 text-green-800 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 text-sm transition-colors"
                          >
                              Mark as Completed
                          </button>
                          <button
                              onClick={() => {
                                  if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
                                      onUpdateBookingStatus(booking.id, 'Canceled');
                                  }
                              }}
                              className="bg-red-100 text-red-800 font-semibold py-2 px-4 rounded-lg hover:bg-red-200 text-sm transition-colors"
                          >
                              Cancel Booking
                          </button>
                      </>
                  )}
                  {booking.status === 'Admitted' && (
                      <div className="flex items-center space-x-4">
                        <p className="text-purple-700 font-semibold text-sm flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Admission Approved!
                        </p>
                         <button 
                              onClick={() => onDownloadReceipt(booking)}
                              className="w-full sm:w-auto bg-slate-700 text-slate-100 font-semibold py-2 px-5 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400 transition-all duration-300 ease-in-out text-sm flex items-center justify-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span>Download Receipt</span>
                          </button>
                      </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsList;