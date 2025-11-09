import React, { useState, useMemo } from 'react';
import type { Quiz, Question, QuizSubmission } from '../../types';
import type { AdminViewProps } from './types';
import { Modal, InputField, TextAreaField, Section } from './shared';

const QuizzesManager: React.FC<AdminViewProps> = ({ allQuizzes, allQuizSubmissions, onAddQuiz, onUpdateQuiz, onDeleteQuiz, onSetActiveQuiz }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | Omit<Quiz, 'id' | 'isActive' | 'createdAt'> | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [viewingResultsFor, setViewingResultsFor] = useState<Quiz | null>(null);

  const openEditModalForNew = () => {
    const newQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
        id: `q_${Date.now()}_${i}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
    }));
    setEditingQuiz({ title: '', timeLimit: 10, questions: newQuestions });
    setIsEditModalOpen(true);
  };

  const openEditModalForEdit = (quiz: Quiz) => {
    setEditingQuiz(JSON.parse(JSON.stringify(quiz)));
    setIsEditModalOpen(true);
  };
  
  const closeModal = () => {
    setIsEditModalOpen(false);
    setEditingQuiz(null);
    setIsResultsModalOpen(false);
    setViewingResultsFor(null);
  };
  
  const handleSave = (quizToSave: Quiz | Omit<Quiz, 'id' | 'isActive' | 'createdAt'>) => {
    if (!quizToSave.title || quizToSave.timeLimit <= 0) {
        alert("Please provide a valid title and time limit.");
        return;
    }
    if (quizToSave.questions.some(q => !q.text || q.options.some(o => !o))) {
        alert("Please fill out all question and option fields.");
        return;
    }

    if ('id' in quizToSave) {
        onUpdateQuiz(quizToSave as Quiz);
    } else {
        onAddQuiz(quizToSave);
    }
    closeModal();
  };
  
  const handleDelete = (quiz: Quiz) => {
    if (window.confirm(`Are you sure you want to delete the quiz "${quiz.title}"? This cannot be undone.`)) {
        onDeleteQuiz(quiz.id);
    }
  };

  const handleSetActive = (quiz: Quiz) => {
      if (window.confirm(`Set "${quiz.title}" as the active weekly quiz? This will deactivate any other active quiz.`)) {
          onSetActiveQuiz(quiz.id);
      }
  };
  
  const handleViewResults = (quiz: Quiz) => {
      setViewingResultsFor(quiz);
      setIsResultsModalOpen(true);
  };

  const sortedQuizzes = useMemo(() => 
    [...allQuizzes].sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)), 
  [allQuizzes]);

  return (
    <Section title="Manage Quizzes" button={<button onClick={openEditModalForNew} className="bg-amber-400 text-slate-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-500 text-sm">+ Add Quiz</button>}>
        <div className="space-y-4">
            {sortedQuizzes.length > 0 ? sortedQuizzes.map(quiz => (
                <div key={quiz.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                            <div className="flex items-center space-x-3">
                                <h4 className="font-bold text-slate-800 text-lg">{quiz.title}</h4>
                                {quiz.isActive && <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-sm text-slate-500">{quiz.questions.length} Questions • {quiz.timeLimit} min limit</p>
                        </div>
                        <div className="flex items-center space-x-2 mt-3 sm:mt-0 flex-wrap gap-2">
                             {!quiz.isActive && <button onClick={() => handleSetActive(quiz)} className="text-xs bg-green-100 text-green-800 font-semibold py-1.5 px-3 rounded-md hover:bg-green-200">Set Active</button>}
                            <button onClick={() => handleViewResults(quiz)} className="text-xs bg-blue-100 text-blue-800 font-semibold py-1.5 px-3 rounded-md hover:bg-blue-200">View Results</button>
                            <button onClick={() => openEditModalForEdit(quiz)} className="text-xs bg-slate-100 text-slate-800 font-semibold py-1.5 px-3 rounded-md hover:bg-slate-200">Edit</button>
                            <button onClick={() => handleDelete(quiz)} className="text-xs bg-red-100 text-red-800 font-semibold py-1.5 px-3 rounded-md hover:bg-red-200">Delete</button>
                        </div>
                    </div>
                </div>
            )) : <p className="text-center text-slate-500 p-8">No quizzes created yet. Click "Add Quiz" to start.</p>}
        </div>
        
        {isEditModalOpen && editingQuiz && (
            <QuizEditModal
                quiz={editingQuiz}
                onClose={closeModal}
                onSave={handleSave}
            />
        )}

        {isResultsModalOpen && viewingResultsFor && (
            <QuizResultsModal
                quiz={viewingResultsFor}
                submissions={allQuizSubmissions.filter(s => s.quizId === viewingResultsFor.id)}
                onClose={closeModal}
            />
        )}
    </Section>
  );
};

const QuizEditModal: React.FC<{
    quiz: Quiz | Omit<Quiz, 'id' | 'isActive' | 'createdAt'>;
    onClose: () => void;
    onSave: (quiz: Quiz | Omit<Quiz, 'id' | 'isActive' | 'createdAt'>) => void;
}> = ({ quiz, onClose, onSave }) => {
    const [formData, setFormData] = useState(quiz);

    const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
        const newQuestions = JSON.parse(JSON.stringify(formData.questions));
        (newQuestions[qIndex] as any)[field] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = JSON.parse(JSON.stringify(formData.questions));
        newQuestions[qIndex].options[oIndex] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    return (
        <Modal isOpen={true} onClose={onClose} title={'id' in formData ? 'Edit Quiz' : 'Add New Quiz'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6">
                    <InputField label="Quiz Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    <InputField label="Time Limit (minutes)" type="number" min="1" value={formData.timeLimit} onChange={e => setFormData({...formData, timeLimit: parseInt(e.target.value, 10) || 0})} required />

                    <div className="space-y-4">
                        {formData.questions.map((q, qIndex) => (
                            <div key={q.id || qIndex} className="p-4 border rounded-lg bg-slate-50">
                                <h4 className="font-semibold text-slate-700 mb-2">Question {qIndex + 1}</h4>
                                <TextAreaField label="Question Text" value={q.text} onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} required />
                                <div className="mt-2 space-y-2">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center space-x-2">
                                            <input type="radio" name={`correct_${q.id}`} checked={q.correctAnswerIndex === oIndex} onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)} className="mt-7" />
                                            <InputField label={`Option ${oIndex + 1} ${q.correctAnswerIndex === oIndex ? '(Correct)' : ''}`} value={opt} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} required />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="p-6 border-t bg-white sticky bottom-0 z-10 rounded-b-xl">
                    <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-500">Save Quiz</button>
                </div>
            </form>
        </Modal>
    )
};

const QuizResultsModal: React.FC<{
    quiz: Quiz;
    submissions: QuizSubmission[];
    onClose: () => void;
}> = ({ quiz, submissions, onClose }) => {
    const sortedSubmissions = useMemo(() => {
        return [...submissions].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);
    }, [submissions]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Results for "${quiz.title}"`}>
            <div className="p-6">
                {sortedSubmissions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-center">Time Taken</th>
                                    <th className="px-4 py-3">Submitted At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSubmissions.map((sub, index) => (
                                    <tr key={sub.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-4 py-3 font-bold">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{sub.studentName}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-blue-600">{sub.score} / {quiz.questions.length}</td>
                                        <td className="px-4 py-3 text-center">{Math.floor(sub.timeTaken / 60)}m {sub.timeTaken % 60}s</td>
                                        <td className="px-4 py-3 text-slate-500">{sub.submittedAt.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-10">No submissions for this quiz yet.</p>
                )}
            </div>
        </Modal>
    );
};

export default QuizzesManager;
