import React, { useMemo } from 'react';
import type { AdminViewProps } from './types';
import { Section } from './shared';

const DashboardView: React.FC<AdminViewProps> = ({ allPayments, allEnrollments, allBookings, allUsers, allSubjects, allTeachers, allCenters, allDiamondStudents }) => {
    const stats = useMemo(() => {
        const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
        const pendingPaymentDocs = allPayments.filter(p => p.status === 'pending');

        const totalRevenue = confirmedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        
        let calculatedPendingRevenue = pendingPaymentDocs.reduce((sum, p) => sum + p.amountPaid, 0);

        const activeEnrollments = allEnrollments.filter(e => e.isActive);
        activeEnrollments.forEach(enrollment => {
            const today = new Date();
            let currentDate = new Date(enrollment.startDate);
            currentDate.setDate(1); 

            while (currentDate <= today) {
                const month = currentDate.toLocaleString('default', { month: 'long' });
                const year = currentDate.getFullYear();
                
                const paymentExists = allPayments.some(p => 
                    p.enrollmentId === enrollment.id &&
                    p.paymentForMonth === month && 
                    p.paymentForYear === year
                );

                if (!paymentExists) {
                    calculatedPendingRevenue += enrollment.monthlyFee;
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        });

        const pendingRevenue = calculatedPendingRevenue;

        const activeStudentIds = new Set(allEnrollments.filter(e => e.isActive).map(e => e.userId));
        const totalStudents = activeStudentIds.size;

        const totalTeachers = allTeachers.length;
        const totalSubjects = allSubjects.length;
        const totalCenters = allCenters.length;

        const enrollmentsByTeacher: {[key: string]: number} = allEnrollments.reduce((acc, e) => {
            acc[e.teacherId] = (acc[e.teacherId] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});
        const topTeacherId = Object.keys(enrollmentsByTeacher).sort((a, b) => enrollmentsByTeacher[b] - enrollmentsByTeacher[a])[0];
        const topTeacher = topTeacherId ? allTeachers.find(t => t.id === topTeacherId) : null;
        const topTeacherData = topTeacher ? { name: topTeacher.name, studentCount: enrollmentsByTeacher[topTeacherId] } : { name: 'N/A', studentCount: 0 };
        
        const enrollmentsBySubject: {[key: string]: number} = allEnrollments.reduce((acc, e) => {
            acc[e.subjectId] = (acc[e.subjectId] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});
        const topSubjectId = Object.keys(enrollmentsBySubject).sort((a, b) => enrollmentsBySubject[b] - enrollmentsBySubject[a])[0];
        const topSubject = topSubjectId ? allSubjects.find(s => s.id === topSubjectId) : null;
        const topSubjectData = topSubject ? { name: topSubject.name, studentCount: enrollmentsBySubject[topSubjectId] } : { name: 'N/A', studentCount: 0 };
        
        const enrollmentsByCenter: {[key: string]: number} = allEnrollments.reduce((acc, e) => {
            acc[e.centerId] = (acc[e.centerId] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});
        const topCenterId = Object.keys(enrollmentsByCenter).sort((a, b) => enrollmentsByCenter[b] - enrollmentsByCenter[a])[0];
        const topCenter = topCenterId ? allCenters.find(c => c.id === topCenterId) : null;
        const topCenterData = topCenter ? { name: topCenter.name, studentCount: enrollmentsByCenter[topCenterId] } : { name: 'N/A', studentCount: 0 };
        
        const latestTopStudent = allDiamondStudents.length > 0 
            ? [...allDiamondStudents].sort((a, b) => parseInt(b.achievementYear) - parseInt(a.achievementYear))[0]
            : null;
        const latestTopStudentData = latestTopStudent ? { name: latestTopStudent.name, achievementYear: latestTopStudent.achievementYear, level: latestTopStudent.level } : { name: 'N/A', achievementYear: '', level: '' };

        return { 
            totalRevenue, 
            pendingRevenue, 
            totalStudents, 
            totalTeachers, 
            totalSubjects, 
            totalCenters,
            topTeacher: topTeacherData,
            topSubject: topSubjectData,
            topCenter: topCenterData,
            latestTopStudent: latestTopStudentData
        };
    }, [allPayments, allEnrollments, allTeachers, allSubjects, allCenters, allDiamondStudents]);

    const recentBookings = useMemo(() => 
        allBookings.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()).slice(0, 5),
    [allBookings]);

    const recentPendingPayments = useMemo(() =>
        allPayments
            .filter(p => p.status === 'pending')
            .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
            .slice(0, 5)
            .map(p => {
                const student = allUsers.find(u => u.id === p.userId);
                return { ...p, studentName: student?.name || 'Unknown' };
            }),
    [allPayments, allUsers]);

    const revenueByMonth = useMemo(() => {
        const months: { [key: string]: number } = {};
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = date.toLocaleString('default', { month: 'short' });
            months[monthKey] = 0;
        }

        allPayments.forEach(p => {
            if (p.status === 'confirmed') {
                const paymentDate = p.paymentDate;
                const monthDiff = (today.getFullYear() - paymentDate.getFullYear()) * 12 + (today.getMonth() - paymentDate.getMonth());
                if (monthDiff >= 0 && monthDiff < 6) {
                    const monthKey = paymentDate.toLocaleString('default', { month: 'short' });
                    months[monthKey] = (months[monthKey] || 0) + p.amountPaid;
                }
            }
        });

        return Object.entries(months).map(([label, value]) => ({ label, value }));
    }, [allPayments]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <StatCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    title="Total Revenue"
                    value={`Tk ${stats.totalRevenue.toLocaleString()}`}
                    colorClass="bg-green-100 text-green-800"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    title="Pending Revenue"
                    value={`Tk ${stats.pendingRevenue.toLocaleString()}`}
                    colorClass="bg-yellow-100 text-yellow-800"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    title="Active Students"
                    value={stats.totalStudents.toString()}
                    colorClass="bg-blue-100 text-blue-800"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1-3.72a4 4 0 00-3-3.72h-1a2 2 0 00-2 2v1" /></svg>}
                    title="Total Teachers"
                    value={stats.totalTeachers.toString()}
                    colorClass="bg-indigo-100 text-indigo-800"
                />
                 <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                    title="Total Subjects"
                    value={stats.totalSubjects.toString()}
                    colorClass="bg-purple-100 text-purple-800"
                />
                <StatCard
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    title="Total Centers"
                    value={stats.totalCenters.toString()}
                    colorClass="bg-pink-100 text-pink-800"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Section title="Last 6 Months Revenue" subtitle="Overview of confirmed payments.">
                        <BarChart data={revenueByMonth} />
                    </Section>

                    <Section title="At a Glance">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoBox
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>}
                                title="Top Teacher"
                                value={stats.topTeacher.name}
                                subtitle={`${stats.topTeacher.studentCount} students`}
                                colorClass="bg-blue-100 text-blue-800"
                            />
                             <InfoBox
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3.5a1 1 0 00.02 1.84l7 3.5a1 1 0 00.748 0l7-3.5a1 1 0 00.02-1.84l-7-3.5zM3 9.363l7 3.5v5.308l-7-3.5V9.363zM17 9.363v5.308l-7 3.5V12.863l7-3.5z" /></svg>}
                                title="Top Subject"
                                value={stats.topSubject.name}
                                subtitle={`${stats.topSubject.studentCount} students`}
                                colorClass="bg-purple-100 text-purple-800"
                            />
                            <InfoBox
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 21l-4.95-6.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
                                title="Most Popular Center"
                                value={stats.topCenter.name}
                                subtitle={`${stats.topCenter.studentCount} students`}
                                colorClass="bg-pink-100 text-pink-800"
                            />
                            <InfoBox
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>}
                                title="Latest Top Result"
                                value={stats.latestTopStudent.name}
                                subtitle={`${stats.latestTopStudent.achievementYear} - ${stats.latestTopStudent.level}`}
                                colorClass="bg-yellow-100 text-yellow-800"
                            />
                        </div>
                    </Section>
                </div>

                <div>
                    <Section title="Recent Activity" subtitle="Latest updates from students.">
                        <div className="space-y-4 max-h-[40rem] overflow-y-auto">
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Pending Payments</h4>
                                <div className="space-y-2">
                                {recentPendingPayments.map(p => (
                                    <div key={p.id} className="text-sm p-2 bg-yellow-50 rounded-md">
                                        <p className="font-semibold text-slate-700">Tk {p.amountPaid} for {p.studentName}</p>
                                        <p className="text-xs text-slate-500">{p.paymentForMonth} {p.paymentForYear}</p>
                                    </div>
                                ))}
                                {recentPendingPayments.length === 0 && <p className="text-sm text-slate-400">No pending payments.</p>}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">New Bookings</h4>
                                <div className="space-y-2">
                                {recentBookings.map(b => (
                                    <div key={b.id} className="text-sm p-2 bg-blue-50 rounded-md">
                                        <p className="font-semibold text-slate-700">{b.studentName}</p>
                                        <p className="text-xs text-slate-500">{allSubjects.find(s => s.id === b.subject.id)?.name || 'N/A'} on {b.dateTime.toLocaleDateString()}</p>
                                    </div>
                                ))}
                                {recentBookings.length === 0 && <p className="text-sm text-slate-400">No recent bookings.</p>}
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string, colorClass: string }> = ({ icon, title, value, colorClass }) => (
    <div className="bg-white rounded-xl shadow-lg shadow-blue-500/5 p-5 border border-slate-100 flex items-center space-x-4">
        <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const InfoBox: React.FC<{ icon: React.ReactNode, title: string, value: string, subtitle: string, colorClass: string }> = ({ icon, title, value, subtitle, colorClass }) => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center space-x-4`}>
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className="text-lg font-bold text-slate-800 truncate" title={value}>{value}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
    </div>
);


const BarChart: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    const formatValue = (value: number) => {
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return value.toString();
    };

    return (
        <div className="h-80 w-full bg-slate-50 p-4 rounded-lg flex flex-col">
            <div className="flex-grow flex items-end justify-around space-x-2">
                {data.map(({ label, value }) => {
                    const barHeight = `${(value / maxValue) * 100}%`;
                    return (
                        <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div className="text-xs font-bold text-slate-500 mb-1">{formatValue(value)}</div>
                            <div
                                className="w-4/5 bg-blue-400 rounded-t-md hover:bg-blue-500 transition-colors"
                                style={{ height: barHeight }}
                                title={`Tk ${value.toLocaleString()}`}
                            ></div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-around mt-2 border-t pt-2">
                {data.map(({ label }) => (
                    <div key={label} className="flex-1 text-center text-xs font-semibold text-slate-500">{label}</div>
                ))}
            </div>
        </div>
    );
};

export default DashboardView;
