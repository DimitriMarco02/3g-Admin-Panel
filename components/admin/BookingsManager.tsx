import React, { useState, useMemo, useEffect } from 'react';
import type { ConfirmedBookingDetails, BookingStatus } from '../../types';
import type { AdminViewProps } from './types';
import { SelectField } from './shared';
import Pagination from '../Pagination';

const BookingsManager: React.FC<AdminViewProps> = ({ allBookings, onDeleteBooking, onUpdateBookingStatus }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All Statuses'>('All Statuses');
    const [sortBy, setSortBy] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 9;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy]);

    const filteredBookings = useMemo(() => {
        return allBookings
            .filter(b => b.status !== 'Admitted')
            .filter(b => statusFilter === 'All Statuses' || b.status === statusFilter)
            .filter(b => {
                const s = searchTerm.toLowerCase();
                if (!s) return true;
                return (
                    b.studentName.toLowerCase().includes(s) ||
                    b.subject.name.toLowerCase().includes(s) ||
                    b.teacher.name.toLowerCase().includes(s) ||
                    b.paymentDetails?.bkashNumber?.includes(s) ||
                    b.paymentDetails?.transactionId?.toLowerCase().includes(s)
                );
            })
            .sort((a, b) => {
                switch(sortBy) {
                    case 'Oldest': return a.dateTime.getTime() - b.dateTime.getTime();
                    case 'Student Name (A-Z)': return a.studentName.localeCompare(b.studentName);
                    case 'Teacher Name (A-Z)': return b.teacher.name.localeCompare(b.teacher.name);
                    case 'Newest':
                    default:
                        return b.dateTime.getTime() - a.dateTime.getTime();
                }
            });
    }, [allBookings, searchTerm, statusFilter, sortBy]);

    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
    const currentBookings = filteredBookings.slice((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage);

    const getStatusStyles = (status: BookingStatus) => {
        switch (status) {
            case 'Admitted': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Pending Admission': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'Canceled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const handleDelete = (booking: ConfirmedBookingDetails) => {
        if (window.confirm(`Are you sure you want to delete the booking for ${booking.studentName} on ${booking.dateTime.toLocaleDateString()}?`)) {
            onDeleteBooking(booking.id);
        }
    }
    
    return (
        <div className="space-y-6">
            <div className="p-4 bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                    <input
                        type="text"
                        placeholder="Student, subject, teacher..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                 <SelectField label="Filter by Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                    <option>All Statuses</option>
                    {(['Booked', 'Completed', 'Canceled', 'Pending Admission'] as BookingStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                </SelectField>
                 <SelectField label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option>Newest</option>
                    <option>Oldest</option>
                    <option>Student Name (A-Z)</option>
                    <option>Teacher Name (A-Z)</option>
                </SelectField>
            </div>
            
            {filteredBookings.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentBookings.map(b => (
                            <div key={b.id} className="bg-white rounded-xl shadow-lg shadow-blue-500/5 border border-slate-100 p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-slate-800 pr-2">{b.subject.name}</h4>
                                        <select
                                            value={b.status}
                                            onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as BookingStatus)}
                                            className={`text-xs font-semibold rounded-md p-1 border appearance-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${getStatusStyles(b.status)}`}
                                        >
                                        {(['Booked', 'Completed', 'Canceled', 'Pending Admission', 'Admitted'] as BookingStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="text-sm text-slate-500 space-y-2 border-t pt-3 mt-3">
                                        <p><strong className="text-slate-700">Student:</strong> {b.studentName}</p>
                                        <p><strong className="text-slate-700">Type:</strong> <span className="font-semibold">{b.bookingType}</span></p>
                                        <p><strong className="text-slate-700">Teacher:</strong> {b.teacher.name}</p>
                                        <p><strong className="text-slate-700">Date:</strong> {new Date(b.dateTime).toLocaleDateString()} at {new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p><strong className="text-slate-700">Payment:</strong> {b.paymentDetails?.paymentMethod || 'N/A'}</p>
                                        {b.paymentDetails?.paymentMethod === 'Bkash' && 
                                        <div className="text-xs pl-4">
                                            <p>Num: {b.paymentDetails.bkashNumber}</p>
                                            <p>TrxID: {b.paymentDetails.transactionId}</p>
                                        </div>
                                        }
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t flex justify-end">
                                    <button onClick={() => handleDelete(b)} className={`text-slate-500 p-1.5 rounded-md transition-colors hover:text-red-600 hover:bg-red-100`} aria-label="Delete Booking">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-inner border border-slate-100">
                    <p className="text-slate-500">No bookings match the current filters.</p>
                </div>
            )}
        </div>
    );
};

export default BookingsManager;
