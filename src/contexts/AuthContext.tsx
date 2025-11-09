import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, auth } from '../../firebase';
import { getDoc, doc, setDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    // Fix: Alias the imported `updatePassword` function to avoid shadowing the local function.
    updatePassword as firebaseUpdatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential,
    sendPasswordResetEmail
} from 'firebase/auth';

import type { User, Teacher } from '../../types';

interface AuthContextType {
    currentUser: User | null;
    currentTeacher: Teacher | null;
    authLoading: boolean;
    login: (email: string, password: string, onLoginSuccess: (role: 'admin' | 'teacher' | 'student') => void) => Promise<boolean>;
    logout: () => Promise<void>;
    signup: (newUser: Omit<User, 'id'>, onSignupSuccess: (role: 'teacher' | 'student') => void) => Promise<boolean>;
    updatePassword: (userId: string, currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
    requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const { uid } = user;
                const userDocRef = doc(db, 'users', uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setCurrentUser({ id: uid, ...userDocSnap.data() } as User);
                    setCurrentTeacher(null);
                } else {
                    const teacherUidMapRef = doc(db, 'teacher_uids', uid);
                    const teacherUidMapSnap = await getDoc(teacherUidMapRef);
    
                    if (teacherUidMapSnap.exists()) {
                        const teacherDocId = teacherUidMapSnap.data().teacherDocId;
                        const teacherDocRef = doc(db, 'teachers', teacherDocId);
                        const teacherDocSnap = await getDoc(teacherDocRef);
    
                        if (teacherDocSnap.exists()) {
                            setCurrentTeacher({ id: teacherDocSnap.id, ...teacherDocSnap.data() } as Teacher);
                            setCurrentUser(null);
                        } else {
                             console.error("Teacher UID mapping exists but profile document is missing.");
                             await signOut(auth);
                        }
                    } else if (userDocSnap.exists()) {
                        setCurrentUser({ id: uid, ...userDocSnap.data() } as User);
                        setCurrentTeacher(null);
                    } else {
                        console.error("User exists in Auth but not in any recognized collection. Logging out.");
                        await signOut(auth);
                        setCurrentUser(null);
                        setCurrentTeacher(null);
                    }
                }
            } else {
                setCurrentUser(null);
                setCurrentTeacher(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string, onLoginSuccess: (role: 'admin' | 'teacher' | 'student') => void): Promise<boolean> => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().isAdmin) {
                onLoginSuccess('admin');
                return true;
            }
            const teacherUidMapRef = doc(db, 'teacher_uids', user.uid);
            const teacherUidMapSnap = await getDoc(teacherUidMapRef);
            if (teacherUidMapSnap.exists()) {
                onLoginSuccess('teacher');
                return true;
            }
            if (userDoc.exists()) {
                onLoginSuccess('student');
                return true;
            }
            await signOut(auth);
            return false;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };
    
    const logout = async () => {
        await signOut(auth);
    };

    const signup = async (newUser: Omit<User, 'id'>, onSignupSuccess: (role: 'teacher' | 'student') => void): Promise<boolean> => {
        if (!newUser.email || !newUser.password) {
            console.error("Email and password are required for signup.");
            return false;
        }
        try {
            const teacherQuery = query(collection(db, "teachers"), where("email", "==", newUser.email), where("status", "==", "pending"));
            const teacherSnapshot = await getDocs(teacherQuery);
    
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
            const user = userCredential.user;
    
            if (!teacherSnapshot.empty) {
                const tempTeacherDoc = teacherSnapshot.docs[0];
                const tempTeacherId = tempTeacherDoc.id;
                const batch = writeBatch(db);
                const teacherRef = doc(db, "teachers", tempTeacherId);
                batch.update(teacherRef, { uid: user.uid, status: 'active' });
                const uidMapRef = doc(db, "teacher_uids", user.uid);
                batch.set(uidMapRef, { teacherDocId: tempTeacherId });
                await batch.commit();
                onSignupSuccess('teacher');
            } else {
                const { password, ...profileData } = newUser;
                await setDoc(doc(db, 'users', user.uid), { ...profileData, isAdmin: false });
                onSignupSuccess('student');
            }
            return true;
        } catch (error: any) {
             if (error.code === 'auth/email-already-in-use') {
                return false;
            }
            console.error("Signup failed:", error);
            return false;
        }
    };

    const updatePassword = async (userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
        const user = auth.currentUser;
        if (!user || user.uid !== userId || !user.email) {
            return { success: false, message: 'User not authenticated or email missing.' };
        }
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPass);
            await reauthenticateWithCredential(user, credential);
            // Fix: Use the aliased `firebaseUpdatePassword` to call the Firebase SDK function.
            await firebaseUpdatePassword(user, newPass);
            return { success: true, message: 'Password updated successfully!' };
        } catch (error: any) {
            console.error("Password update failed:", error);
            let message = 'An error occurred. Please try again.';
            if (error.code === 'auth/wrong-password') message = 'Current password does not match.';
            else if (error.code === 'auth/weak-password') message = 'New password is too weak.';
            return { success: false, message };
        }
    };
    
    const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: "Password reset email sent! Please check your inbox." };
        } catch (error: any) {
            console.error("Password reset failed:", error);
            let message = "An error occurred. Please try again.";
            if (error.code === 'auth/user-not-found') {
                message = "No user found with this email address.";
            }
            return { success: false, message };
        }
    };

    const value = { currentUser, currentTeacher, authLoading, login, logout, signup, updatePassword, requestPasswordReset };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};