import React, { useState, useMemo, useEffect } from 'react';
import type { Center } from '../../types';
import type { AdminViewProps } from './types';
import { ActionButtons, Modal, InputField, TextAreaField, SelectField, Section } from './shared';
import Pagination from '../Pagination';


const CentersManager: React.FC<AdminViewProps> = ({ allCenters, onAddCenter, onUpdateCenter, onDeleteCenter, allTeachers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCenter, setEditingCenter] = useState<Center | Omit<Center, 'id'> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(1);
    const centersPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    const filteredCenters = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return allCenters
            .filter(c => c.name.toLowerCase().includes(s) || c.location.toLowerCase().includes(s))
            .sort((a, b) => {
                switch (sortBy) {
                    case 'A-Z': return a.name.localeCompare(b.name);
                    case 'Z-A': return b.name.localeCompare(a.name);
                    case 'Oldest': return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
                    case 'Newest':
                    default: return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
                }
            });
    }, [allCenters, searchTerm, sortBy]);

    const totalPages = Math.ceil(filteredCenters.length / centersPerPage);
    const paginatedCenters = filteredCenters.slice((currentPage - 1) * centersPerPage, currentPage * centersPerPage);

    const openModalForNew = () => { setEditingCenter({ name: '', location: '', imageUrl: '', sliderImageUrls: [], latitude: 0, longitude: 0, phone: '', email: '', about: '' }); setIsModalOpen(true); };
    const openModalForEdit = (center: Center) => { setEditingCenter(center); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingCenter(null); };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCenter) return;

        const finalCenter = {
            ...editingCenter,
            sliderImageUrls: (editingCenter.sliderImageUrls || []).filter(url => url && url.trim() !== '')
        };

        if ('id' in finalCenter) {
            onUpdateCenter(finalCenter as Center);
        } else {
            onAddCenter(finalCenter);
        }
        closeModal();
    };
    
    const isCenterInUse = (id: string) => allTeachers.some(t => t.centerIds.includes(id));
    
    const handleDelete = (center: Center) => {
        if (isCenterInUse(center.id)) {
            alert(`Cannot delete "${center.name}". It is assigned to one or more teachers. Please unassign teachers from this center first.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete the center "${center.name}"?`)) {
            onDeleteCenter(center.id);
        }
    };

    return (
         <Section title="Manage Centers" button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">+ Add Center</button>}>
            <div className="p-4 mb-4 bg-slate-50 rounded-lg border flex flex-col sm:flex-row gap-4">
                 <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search by Name or Location</label>
                    <input type="text" placeholder="Search centers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black"/>
                </div>
                <div className="w-full sm:w-48">
                    <SelectField label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="Newest">Newest</option>
                        <option value="Oldest">Oldest</option>
                        <option value="A-Z">Name (A-Z)</option>
                        <option value="Z-A">Name (Z-A)</option>
                    </SelectField>
                </div>
            </div>
            {filteredCenters.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {paginatedCenters.map(c => (
                            <div key={c.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg mr-4 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 21l-4.95-6.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800">{c.name}</p>
                                    <p className="text-sm text-slate-500">{c.location}</p>
                                </div>
                                <ActionButtons onEdit={() => openModalForEdit(c)} onDelete={() => handleDelete(c)} />
                            </div>
                        ))}
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            ) : (
                <p className="text-center text-slate-500 p-8">No centers found for this selection.</p>
            )}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCenter && 'id' in editingCenter ? 'Edit Center' : 'Add Center'}>
                {editingCenter && <form onSubmit={handleSave} className="p-6 space-y-4">
                    <InputField label="Name" value={editingCenter.name} onChange={e => setEditingCenter({...editingCenter, name: e.target.value})} required />
                    <InputField label="Location" value={editingCenter.location} onChange={e => setEditingCenter({...editingCenter, location: e.target.value})} required />
                    <InputField label="Main Image URL" value={editingCenter.imageUrl || ''} onChange={e => setEditingCenter({...editingCenter, imageUrl: e.target.value})} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Latitude" type="number" step="any" value={editingCenter.latitude} onChange={e => setEditingCenter({...editingCenter, latitude: parseFloat(e.target.value) || 0})} required />
                      <InputField label="Longitude" type="number" step="any" value={editingCenter.longitude} onChange={e => setEditingCenter({...editingCenter, longitude: parseFloat(e.target.value) || 0})} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Phone" type="tel" value={editingCenter.phone} onChange={e => setEditingCenter({...editingCenter, phone: e.target.value})} required />
                      <InputField label="Email" type="email" value={editingCenter.email} onChange={e => setEditingCenter({...editingCenter, email: e.target.value})} required />
                    </div>
                    <TextAreaField label="About" value={editingCenter.about} onChange={e => setEditingCenter({...editingCenter, about: e.target.value})} required />
                    
                    <fieldset className="p-4 border rounded-lg bg-slate-50">
                        <legend className="font-semibold text-slate-700 px-2">Slider Images</legend>
                        <p className="text-xs text-slate-500 mb-2 px-2">Add URLs for the image slider on the center's detail page. The first image will be used as the main image if no separate Image URL is provided above.</p>
                        <div className="space-y-2 mt-2">
                            {(editingCenter.sliderImageUrls || []).map((url, index) => (
                                <div key={index} className="flex items-end gap-2">
                                    <InputField
                                        label={`Image URL ${index + 1}`}
                                        value={url}
                                        onChange={e => {
                                            const newUrls = [...(editingCenter.sliderImageUrls || [])];
                                            newUrls[index] = e.target.value;
                                            setEditingCenter({ ...editingCenter, sliderImageUrls: newUrls });
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newUrls = (editingCenter.sliderImageUrls || []).filter((_, i) => i !== index);
                                            setEditingCenter({ ...editingCenter, sliderImageUrls: newUrls });
                                        }}
                                        className="h-11 w-11 flex-shrink-0 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const newUrls = [...(editingCenter.sliderImageUrls || []), ''];
                                setEditingCenter({ ...editingCenter, sliderImageUrls: newUrls });
                            }}
                            className="text-blue-600 font-semibold text-sm mt-3"
                        >
                            + Add Image URL
                        </button>
                    </fieldset>
                    
                    <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button>
                    </form>}
            </Modal>
        </Section>
    );
};

export default CentersManager;
