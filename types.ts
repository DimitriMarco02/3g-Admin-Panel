// Fix: Populating the types.ts file with all necessary type definitions for the application.
import { CURRICULUMS } from './constants';

export type Curriculum = typeof CURRICULUMS[number];

export interface User {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
  studentId?: string;
  imageUrl?: string;
}

export interface Subject {
  id:string;
  name: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  feesByLevel?: {
    [key in ScheduleLevel]?: number;
  };
  createdAt?: Date;
}

export type ScheduleLevel = 'O-Level' | 'AS-Level' | 'A2';
export const scheduleLevels: ScheduleLevel[] = ['O-Level', 'AS-Level', 'A2'];

export interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface Review {
  id: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
}

export interface BoardTimeGroup {
    boardName: Curriculum;
    levelSlots: Partial<Record<ScheduleLevel, string[]>>;
}

export interface Batch {
    id: string;
    batchName: string;
    subjectId: string;
    centerId: string;
    days: string[]; // e.g., ["Sunday", "Tuesday", "Thursday"]
    boardTimeGroups: BoardTimeGroup[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subjectIds: string[];
  centerIds: string[];
  imageUrl: string;
  bannerUrl: string;
  bio: string;
  batches: Batch[];
  experience: Experience[];
  education: Education[];
  reviews: Review[];
  admissionFee?: number;
  createdAt?: Date;
  showOnHome?: boolean;
  uid?: string;
  status?: 'pending' | 'active';
}

export interface Center {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
  sliderImageUrls?: string[];
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  about: string;
  createdAt?: Date;
}

export interface BookingDetails {
  curriculum: string;
  classLevel: string;
  teacherId: string;
  centerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  batchId?: string;
}

export type BookingStatus = 'Booked' | 'Completed' | 'Canceled' | 'Admitted' | 'Pending Admission';

export interface ConfirmedBookingDetails {
  id: string;
  userId: string;
  studentName: string;
  phone: string;
  subject: Subject;
  teacher: Teacher;
  center: Center;
  dateTime: Date;
  curriculum: string;
  classLevel: string;
  status: BookingStatus;
  bookingType: 'Trial' | 'Admission';
  paymentDetails?: {
    paymentMethod: 'Bkash' | 'Cash in Hand';
    bkashNumber?: string;
    transactionId?: string;
    amountPaid?: number;
  }
  batchId?: string;
  batchName?: string;
  days?: string[];
  time?: string;
}

export interface OfferSlide {
    id: string;
    imageUrl: string;
    title: string;
    description: string;
}

export interface Notice {
    id: string;
    text: string;
    createdAt?: Date;
}

export interface StudentResult {
    id: string;
    subject: string;
    grade: string;
}

export interface DiamondStudent {
    id: string;
    name: string;
    imageUrl: string;
    level: 'O Level' | 'A Level';
    achievementYear: string;
    achievementDetails: string;
    results: StudentResult[];
}

export interface Enrollment {
    id: string;
    userId: string;
    studentName: string;
    subjectId: string;
    teacherId: string;
    centerId: string;
    curriculum: string;
    classLevel: string;
    startDate: Date;
    monthlyFee: number;
    isActive: boolean;
    originalBookingId: string;
    batchId: string;
    batchName: string;
    days: string[];
    time: string;
}

export interface Payment {
    id: string;
    enrollmentId: string;
    userId: string;
    paymentForMonth: string; // e.g. "January"
    paymentForYear: number; // e.g. 2024
    amountPaid: number;
    paymentDate: Date;
    paymentMethod: string; // e.g. 'Bkash', 'Cash'
    bkashNumber?: string;
    transactionId?: string;
    status: 'pending' | 'confirmed';
}

export interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctAnswerIndex: number; // 0-3
}

export interface Quiz {
  id: string;
  title: string;
  timeLimit: number; // in minutes
  questions: Question[];
  isActive: boolean;
  createdAt?: Date;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  studentName: string;
  score: number;
  timeTaken: number; // in seconds
  submittedAt: Date;
}

export interface ChatParticipantInfo {
    name: string;
    imageUrl?: string;
    type: 'teacher' | 'student';
}

export interface Chat {
    id: string;
    participants: string[];
    participantInfo: { [key: string]: ChatParticipantInfo };
    lastMessageText?: string;
    lastMessageTimestamp?: Date;
    lastMessageSenderId?: string;
    // New fields for group chat
    type: 'private' | 'group';
    groupName?: string;
    ownerId?: string; // The teacher who created the group
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
}