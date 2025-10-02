// Fix: Populating the types.ts file with all necessary type definitions for the application.
export interface User {
  id: number;
  name: string;
  phone: string;
  address: string;
  username: string;
  password?: string;
  isAdmin?: boolean;
}

export interface Subject {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface TeacherSchedule {
  day: string; // e.g., 'Monday'
  times: string[]; // e.g., ['09:00', '10:00']
}

export interface Experience {
  id: number;
  role: string;
  company: string;
  duration: string;
}

export interface Education {
  id: number;
  degree: string;
  institution: string;
  year: string;
}

export interface Review {
  id: number;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
}

export interface Teacher {
  id: number;
  name: string;
  phone?: string;
  subjectId: number;
  centerIds: number[];
  imageUrl: string;
  bannerUrl: string;
  bio: string;
  schedule: TeacherSchedule[];
  experience: Experience[];
  education: Education[];
  reviews: Review[];
}

export interface Center {
  id: number;
  name: string;
  location: string;
  imageUrl?: string;
}

export interface BookingDetails {
  curriculum: string;
  classLevel: string;
  teacherId: number;
  centerId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export type BookingStatus = 'Booked' | 'Completed' | 'Canceled' | 'Admitted' | 'Pending Admission';

export interface ConfirmedBookingDetails {
  id: number;
  userId: number;
  studentName: string;
  phone: string;
  subject: Subject;
  teacher: Teacher;
  center: Center;
  dateTime: Date;
  curriculum: string;
  classLevel: string;
  status: BookingStatus;
  paymentDetails?: {
    paymentMethod: 'Bkash' | 'Cash in Hand';
    bkashNumber?: string;
    transactionId?: string;
  }
}

export interface OfferSlide {
    id: number;
    imageUrl: string;
    title: string;
    description: string;
}

export interface Notice {
    id: number;
    text: string;
}

export interface StudentResult {
    id: number;
    subject: string;
    grade: string;
}

export interface DiamondStudent {
    id: number;
    name: string;
    imageUrl: string;
    level: 'O Level' | 'A Level';
    achievementYear: string;
    achievementDetails: string;
    results: StudentResult[];
}