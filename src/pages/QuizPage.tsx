import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Question } from '../types';
import { Clock, ArrowRight, ArrowLeft, Send, BrainCircuit, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function QuizPage({ user }: { user: User }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      const querySnapshot = await getDocs(collection(db, 'questions'));
      const qList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(qList);
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        score++;
      }
    });

    try {
      const resultDoc = await addDoc(collection(db, 'results'), {
        user_id: user.uid,
        user_name: user.name,
        score,
        total_questions: questions.length,
        date: serverTimestamp()
      });
      navigate(`/result/${resultDoc.id}`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setSubmitting(false);
    }
  }, [answers, questions, user, navigate, submitting]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, questions.length, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-stone-500 font-medium">Preparing your challenge...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="bg-stone-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-stone-400">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-emerald-950">No Questions Available</h2>
        <p className="text-stone-600">The quiz is currently empty. Please check back later or contact an administrator.</p>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold">Back to Home</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm sticky top-20 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-2 rounded-xl text-white">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-950">Question {currentIndex + 1} of {questions.length}</h2>
            <div className="w-48 h-2 bg-stone-100 rounded-full mt-1 overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-mono font-bold text-xl ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-stone-50 text-stone-700'}`}>
          <Clock size={24} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white p-8 sm:p-12 rounded-[40px] border border-stone-200 shadow-xl space-y-10"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-emerald-950 leading-tight">
            {currentQuestion.question}
          </h3>

          <div className="grid gap-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                className={`flex items-center gap-4 p-6 rounded-3xl text-left transition-all border-2 group ${
                  answers[currentQuestion.id] === idx 
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-md' 
                    : 'bg-white border-stone-100 text-stone-700 hover:border-emerald-200 hover:bg-stone-50'
                }`}
              >
                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors ${
                  answers[currentQuestion.id] === idx ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-lg font-medium">{option}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft size={20} />
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
            <Send size={20} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            Next
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
