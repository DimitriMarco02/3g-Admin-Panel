import type { Teacher, ConfirmedBookingDetails, ScheduleLevel } from './types';
import { Timestamp } from 'firebase/firestore';

export const getScheduleKeyForClassLevel = (classLevel: string): ScheduleLevel | null => {
    if (classLevel === "O Level" || classLevel === "IGCSE") return 'O-Level';
    if (classLevel === "AS Level") return 'AS-Level';
    if (classLevel === "A2 Level") return 'A2';
    return null;
};

export const formatTime12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    const dummyDate = new Date(`1970-01-01T${time24}:00`);
    return dummyDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const teacherTransformer = (data: any): Teacher => {
    return {
        ...(data as Omit<Teacher, 'subjectIds' | 'centerIds' | 'experience' | 'education' | 'reviews' | 'batches'>),
        subjectIds: Array.isArray(data.subjectIds) ? [...data.subjectIds] : [],
        centerIds: Array.isArray(data.centerIds) ? [...data.centerIds] : [],
        batches: Array.isArray(data.batches) ? data.batches.map((b: any) => ({ ...b })) : [],
        experience: Array.isArray(data.experience) ? data.experience.map((e: any) => ({ ...e })) : [],
        education: Array.isArray(data.education) ? data.education.map((e: any) => ({ ...e })) : [],
        reviews: Array.isArray(data.reviews) ? data.reviews.map((r: any) => ({ ...r })) : [],
        showOnHome: data.showOnHome || false,
    };
};

export const bookingTransformer = (data: any): ConfirmedBookingDetails => {
    const plainData: any = { ...data };

    plainData.dateTime = data.dateTime && typeof data.dateTime.toDate === 'function'
        ? (data.dateTime as Timestamp).toDate()
        : new Date(0);
    
    plainData.bookingType = data.bookingType || 'Trial';

    if (data.batchId) plainData.batchId = data.batchId;
    if (data.batchName) plainData.batchName = data.batchName;
    if (data.days) plainData.days = data.days;
    if (data.time) plainData.time = data.time;

    plainData.subject = data.subject ? { ...data.subject } : { name: 'N/A' };
    plainData.center = data.center ? { ...data.center } : { name: 'N/A' };
    
    if (data.teacher) {
        plainData.teacher = teacherTransformer(data.teacher);
    } else {
        plainData.teacher = { name: 'N/A', centerIds: [], batches: [], experience: [], education: [], reviews: [], subjectIds: [] };
    }
    
    return plainData;
};
