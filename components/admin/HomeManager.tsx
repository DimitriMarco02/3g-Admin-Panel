import React, { useState, useMemo, useEffect } from 'react';
import type { OfferSlide, Notice, Teacher } from '../../types';
import type { AdminViewProps } from './types';
import { ActionButtons, Modal, InputField, TextAreaField, Section } from './shared';

const HomeManager: React.FC<AdminViewProps> = (props) => (
    <div className="space-y-6">
        <LogoManager logoUrl={props.logoUrl} onUpdateLogoUrl={props.onUpdateLogoUrl} />
        <SlidesManager {...props} />
        <NoticesManager {...props} />
        <HomeTeachersManager {...props} />
    </div>
);


const LogoManager: React.FC<{logoUrl: string, onUpdateLogoUrl: (url: string) => void}> = ({ logoUrl, onUpdateLogoUrl }) => {
    const [newLogoUrl, setNewLogoUrl] = useState(logoUrl);

    useEffect(() => {
        setNewLogoUrl(logoUrl);
    }, [logoUrl]);

    const handleSave = () => {
        onUpdateLogoUrl(newLogoUrl);
        alert('Logo updated!');
    };

    return (
        <Section title="App Logo" subtitle="Update the logo shown in the header.">
            <div className="flex flex-col sm:flex-row items-end gap-4">
                <img src={newLogoUrl} alt="Logo Preview" className="h-16 w-16 p-2 rounded-lg bg-slate-800 object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64'; }}/>
                <div className="flex-grow w-full">
                    <InputField
                        label="Logo Image URL"
                        value={newLogoUrl}
                        onChange={e => setNewLogoUrl(e.target.value)}
                    />
                </div>
                <button onClick={handleSave} className="bg-amber-400 text-slate-900 font-semibold py-2.5 px-4 rounded-lg hover:bg-amber-500 text-sm h-fit w-full sm:w-auto">Save Logo</button>
            </div>
        </Section>
    );
};

const SlidesManager: React.FC<AdminViewProps> = ({ allSlides, onAddSlide, onUpdateSlide, onDeleteSlide }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<OfferSlide | Omit<OfferSlide, 'id'> | null>(null);
    const openModalForNew = () => { setEditingSlide({ title: '', description: '', imageUrl: '' }); setIsModalOpen(true); };
    const openModalForEdit = (slide: OfferSlide) => { setEditingSlide(slide); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!editingSlide) return; if ('id' in editingSlide) onUpdateSlide(editingSlide); else onAddSlide(editingSlide); closeModal(); };
    const handleDelete = (slide: OfferSlide) => { if (window.confirm(`Delete slide "${slide.title}"?`)) onDeleteSlide(slide.id); };
    return (<Section title="Manage Offer Slides" subtitle="Control the slides on the home page carousel." button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">Add Slide</button>}><div className="space-y-3">{allSlides.map(s => <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><p className="font-bold text-slate-800">{s.title}</p><ActionButtons onEdit={() => openModalForEdit(s)} onDelete={() => handleDelete(s)} /></div>)}</div><Modal isOpen={isModalOpen} onClose={closeModal} title={editingSlide && 'id' in editingSlide ? 'Edit Slide' : 'Add Slide'}>{editingSlide && <form onSubmit={handleSave} className="p-6 space-y-4"><InputField label="Title" value={editingSlide.title} onChange={e => setEditingSlide({...editingSlide, title: e.target.value})} required /><TextAreaField label="Description" value={editingSlide.description} onChange={e => setEditingSlide({...editingSlide, description: e.target.value})} required /><InputField label="Image URL" value={editingSlide.imageUrl} onChange={e => setEditingSlide({...editingSlide, imageUrl: e.target.value})} required /><button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button></form>}</Modal></Section>);
};

const NoticesManager: React.FC<AdminViewProps> = ({ allNotices, onAddNotice, onUpdateNotice, onDeleteNotice }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | Omit<Notice, 'id'> | null>(null);
    const openModalForNew = () => { setEditingNotice({ text: '' }); setIsModalOpen(true); };
    const openModalForEdit = (notice: Notice) => { setEditingNotice(notice); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (!editingNotice) return; if ('id' in editingNotice) onUpdateNotice(editingNotice); else onAddNotice(editingNotice); closeModal(); };
    const handleDelete = (notice: Notice) => { if (window.confirm(`Delete this notice?`)) onDeleteNotice(notice.id); };
    return (<Section title="Manage Notices" subtitle="Update the home page notice board." button={<button onClick={openModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">Add Notice</button>}><div className="space-y-3">{allNotices.map(n => <div key={n.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><p className="text-slate-800 text-sm">{n.text}</p><ActionButtons onEdit={() => openModalForEdit(n)} onDelete={() => handleDelete(n)} /></div>)}</div><Modal isOpen={isModalOpen} onClose={closeModal} title={editingNotice && 'id' in editingNotice ? 'Edit Notice' : 'Add Notice'}>{editingNotice && <form onSubmit={handleSave} className="p-6 space-y-4"><TextAreaField label="Notice Text" value={editingNotice.text} onChange={e => setEditingNotice({...editingNotice, text: e.target.value})} required /><button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save</button></form>}</Modal></Section>);
};

const HomeTeachersManager: React.FC<AdminViewProps> = ({ allTeachers, onUpdateTeacher }) => {
    const [availableSearch, setAvailableSearch] = useState('');
    const [featuredSearch, setFeaturedSearch] = useState('');

    const featuredTeachers = useMemo(() =>
        allTeachers
            .filter(t => t.showOnHome && t.name.toLowerCase().includes(featuredSearch.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [allTeachers, featuredSearch]
    );

    const availableTeachers = useMemo(() =>
        allTeachers
            .filter(t => !t.showOnHome && t.name.toLowerCase().includes(availableSearch.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [allTeachers, availableSearch]
    );

    const handleFeatureTeacher = (teacher: Teacher) => {
        onUpdateTeacher({ ...teacher, showOnHome: true });
    };

    const handleUnfeatureTeacher = (teacher: Teacher) => {
        onUpdateTeacher({ ...teacher, showOnHome: false });
    };

    const TeacherListItem: React.FC<{ teacher: Teacher; action: 'add' | 'remove'; onClick: (t: Teacher) => void }> = ({ teacher, action, onClick }) => (
        <div className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
            <div className="flex items-center space-x-2 overflow-hidden">
                <img src={teacher.imageUrl} alt={teacher.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <span className="text-sm font-medium text-slate-800 truncate">{teacher.name}</span>
            </div>
            <button
                onClick={() => onClick(teacher)}
                className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                    action === 'add'
                    ? 'text-green-600 bg-green-100 hover:bg-green-200'
                    : 'text-red-600 bg-red-100 hover:bg-red-200'
                }`}
                aria-label={action === 'add' ? `Feature ${teacher.name}` : `Remove ${teacher.name} from featured`}
            >
                {action === 'add' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                )}
            </button>
        </div>
    );

    return (
        <Section title="Featured Teachers on Home Page" subtitle="Add or remove teachers from the home page.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <h4 className="font-bold text-slate-800 mb-2">Available Teachers ({availableTeachers.length})</h4>
                    <input
                        type="text"
                        placeholder="Search to add..."
                        value={availableSearch}
                        onChange={e => setAvailableSearch(e.target.value)}
                        className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                    />
                    <div className="space-y-2 h-80 overflow-y-auto border rounded-lg p-2 bg-slate-50">
                        {availableTeachers.map(teacher => (
                            <TeacherListItem key={teacher.id} teacher={teacher} action="add" onClick={handleFeatureTeacher} />
                        ))}
                         {availableTeachers.length === 0 && <p className="text-sm text-slate-500 text-center p-4">No available teachers match your search.</p>}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-slate-800 mb-2">Featured Teachers ({featuredTeachers.length})</h4>
                     <input
                        type="text"
                        placeholder="Search featured..."
                        value={featuredSearch}
                        onChange={e => setFeaturedSearch(e.target.value)}
                        className="w-full p-2.5 border bg-white border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                    />
                    <div className="space-y-2 h-80 overflow-y-auto border rounded-lg p-2 bg-blue-50/50">
                       {featuredTeachers.map(teacher => (
                            <TeacherListItem key={teacher.id} teacher={teacher} action="remove" onClick={handleUnfeatureTeacher} />
                        ))}
                        {featuredTeachers.length === 0 && <p className="text-sm text-slate-500 text-center p-4">No teachers are featured.</p>}
                    </div>
                </div>
            </div>
        </Section>
    );
};

export default HomeManager;
