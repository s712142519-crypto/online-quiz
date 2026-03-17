import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Result } from '../types';
import { Trophy, ArrowLeft, Share2, RotateCcw, BrainCircuit, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function ResultPage({ user }: { user: User }) {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      if (!resultId) return;
      const docRef = doc(db, 'results', resultId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setResult({ id: docSnap.id, ...docSnap.data() } as Result);
      }
      setLoading(false);
    };
    fetchResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-stone-500 font-medium">Calculating your brilliance...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="bg-stone-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-stone-400">
          <XCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-emerald-950">Result Not Found</h2>
        <p className="text-stone-600">We couldn't find the result you're looking for.</p>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold">Back to Home</button>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.total_questions) * 100);
  const isPassed = percentage >= 60;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-12"
    >
      {/* Score Card */}
      <div className="bg-white p-12 rounded-[40px] border border-stone-200 shadow-xl text-center space-y-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600 opacity-10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />

        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${isPassed ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-amber-500 text-white shadow-amber-100'}`}
        >
          {isPassed ? <Trophy size={56} /> : <BrainCircuit size={56} />}
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-emerald-950">
            {isPassed ? 'Outstanding Performance!' : 'Keep Practicing!'}
          </h2>
          <p className="text-stone-500 text-lg">
            Completed on {format(result.date.toDate(), 'MMMM d, yyyy • h:mm a')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 py-8 border-y border-stone-100">
          <div className="space-y-1">
            <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Score</p>
            <p className="text-5xl font-bold text-emerald-900">{result.score} <span className="text-2xl text-stone-300">/ {result.total_questions}</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Accuracy</p>
            <p className="text-5xl font-bold text-emerald-900">{percentage}%</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            to="/quiz" 
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <RotateCcw size={20} />
            Try Again
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-white border-2 border-stone-100 text-stone-700 px-8 py-4 rounded-2xl font-bold hover:bg-stone-50 transition-all"
          >
            <Share2 size={20} />
            Share Result
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Correct</p>
            <p className="text-xl font-bold text-stone-900">{result.score}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-2xl text-red-600">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Incorrect</p>
            <p className="text-xl font-bold text-stone-900">{result.total_questions - result.score}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
            <BrainCircuit size={24} />
          </div>
          <div>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Status</p>
            <p className={`text-xl font-bold ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>{isPassed ? 'Passed' : 'Failed'}</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link to="/" className="text-stone-400 hover:text-emerald-600 font-bold flex items-center justify-center gap-2 transition-colors">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </motion.div>
  );
}
