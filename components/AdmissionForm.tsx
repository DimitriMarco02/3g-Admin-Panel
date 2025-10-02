import React, { useState } from 'react';
import type { ConfirmedBookingDetails } from '../types';

interface AdmissionFormProps {
    bookings: ConfirmedBookingDetails[];
    onSubmit: (paymentDetails: { paymentMethod: 'Bkash' | 'Cash in Hand', bkashNumber?: string, transactionId?: string }) => void;
    onBack: () => void;
}

const AdmissionForm: React.FC<AdmissionFormProps> = ({ bookings, onSubmit, onBack }) => {
    const [paymentMethod, setPaymentMethod] = useState<'Bkash' | 'Cash in Hand' | ''>('');
    const [bkashNumber, setBkashNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethod) {
            setError('Please select a payment method.');
            return;
        }
        if (paymentMethod === 'Bkash' && (!bkashNumber || !transactionId)) {
            setError('Please provide your Bkash number and the transaction ID.');
            return;
        }
        setError('');
        onSubmit({
            paymentMethod,
            ...(paymentMethod === 'Bkash' && { bkashNumber, transactionId }),
        });
    };

    return (
        <div className="p-4 sm:p-6 animate-fade-in">
            <button onClick={onBack} className="mb-6 text-blue-600 font-semibold hover:underline flex items-center group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                Back to My Bookings
            </button>
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Confirm Your Admission</h2>
                <p className="text-slate-600 mb-2">You are taking admission for the following trial class(es):</p>
                <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
                    {bookings.map(b => (
                        <p key={b.id} className="font-semibold text-blue-600">- {b.subject.name}</p>
                    ))}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Payment Information</h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 space-y-2">
                           <p>Please complete your payment using one of the methods below.</p>
                           <p><strong>Bkash:</strong> Send payment to <strong>01234567890</strong> and provide the transaction details.</p>
                           <p><strong>Cash in Hand:</strong> Visit our office to complete the payment in person.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Payment Method</label>
                        <div className="flex space-x-4">
                           { (['Bkash', 'Cash in Hand'] as const).map(method => (
                                <label key={method} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method}
                                        checked={paymentMethod === method}
                                        onChange={() => setPaymentMethod(method)}
                                        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">{method}</span>
                                </label>
                           ))}
                        </div>
                    </div>

                    {paymentMethod === 'Bkash' && (
                        <div className="space-y-4 animate-fade-in-fast p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                            <div>
                                <label htmlFor="bkashNumber" className="block text-sm font-medium text-slate-700 mb-1">Your Bkash Number</label>
                                <input
                                    id="bkashNumber"
                                    type="tel"
                                    value={bkashNumber}
                                    onChange={e => setBkashNumber(e.target.value)}
                                    placeholder="e.g., 01xxxxxxxxx"
                                    required
                                    className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="transactionId" className="block text-sm font-medium text-slate-700 mb-1">Transaction ID (TrxID)</label>
                                <input
                                    id="transactionId"
                                    type="text"
                                    value={transactionId}
                                    onChange={e => setTransactionId(e.target.value)}
                                    placeholder="e.g., 9A4B8C1D3E"
                                    required
                                    className="w-full p-3 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                    
                    <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-4 px-4 rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all duration-300 ease-in-out text-lg">
                        Confirm Admission
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdmissionForm;