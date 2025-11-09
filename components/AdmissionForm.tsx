

import React, { useState } from 'react';
import type { ConfirmedBookingDetails, ScheduleLevel, Subject } from '../types';

interface AdmissionPaymentModalProps {
    booking: Omit<ConfirmedBookingDetails, 'id'>;
    onClose: () => void;
    onSubmit: (paymentDetails: NonNullable<ConfirmedBookingDetails['paymentDetails']>) => void;
}

const AdmissionPaymentModal: React.FC<AdmissionPaymentModalProps> = ({ booking, onClose, onSubmit }) => {
    const [paymentMethod, setPaymentMethod] = useState<'Bkash' | 'Cash in Hand'>('Bkash');
    const [bkashNumber, setBkashNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fee = booking.teacher.admissionFee ?? 1000;
    
    const month = booking.dateTime.toLocaleString('default', { month: 'long' });
    const year = booking.dateTime.getFullYear();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentMethod === 'Bkash' && (!bkashNumber || !transactionId)) {
            setError('Please provide your Bkash number and the transaction ID.');
            return;
        }
        setLoading(true);
        setError('');

        const paymentDetails: NonNullable<ConfirmedBookingDetails['paymentDetails']> = 
            paymentMethod === 'Bkash'
            ? { paymentMethod: 'Bkash', bkashNumber, transactionId, amountPaid: fee }
            : { paymentMethod: 'Cash in Hand', amountPaid: fee };
        
        await onSubmit(paymentDetails);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 id="payment-modal-title" className="text-xl font-bold text-slate-800">Pay for {month} {year}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl font-bold" aria-label="Close payment modal">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-slate-600">Amount Due</p>
                        <p className="text-4xl font-bold text-blue-600">Tk {fee > 0 ? fee.toLocaleString() : 'N/A'}</p>
                    </div>

                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Bkash', 'Cash in Hand'] as const).map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`p-3 border rounded-lg text-sm font-semibold transition-colors ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:border-blue-400'}`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === 'Bkash' && (
                            <div className="space-y-3 pt-3 border-t animate-fade-in-fast">
                                <p className="text-sm text-slate-600 text-center">Send payment to Bkash number: <strong className="text-slate-800">01314412016</strong> and enter the details below.</p>
                                <div>
                                    <label htmlFor="bkashNumber" className="block text-sm font-medium text-slate-700 mb-1">Your Bkash Number</label>
                                    <input id="bkashNumber" type="tel" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} required className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="transactionId" className="block text-sm font-medium text-slate-700 mb-1">Transaction ID (TrxID)</label>
                                    <input id="transactionId" type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} required className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'Cash in Hand' && (
                            <div className="pt-3 border-t animate-fade-in-fast">
                                 <p className="text-sm text-slate-600 text-center">Your admission request will be sent for confirmation. Please pay the admission fee in cash at the coaching center.</p>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-600 text-sm font-medium text-center">{error}</p>}

                    <button type="submit" disabled={loading || fee === 0} className="w-full bg-amber-400 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-500 disabled:bg-amber-300 disabled:cursor-not-allowed">
                        {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdmissionPaymentModal;