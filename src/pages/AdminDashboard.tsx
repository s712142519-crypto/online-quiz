import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Question, Result } from '../types';
import { Plus, Edit2, Trash2, Save, X, LayoutDashboard, BrainCircuit, Trophy, Users, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'results'>('questions');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0
  });

  const fetchData = async () => {
    setLoading(true);
    const qSnap = await getDocs(collection(db, 'questions'));
    const rSnap = await getDocs(query(collection(db, 'results'), orderBy('date', 'desc')));
    
    setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    setResults(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result)));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'questions', editingId), formData);
      } else {
        await addDoc(collection(db, 'questions'), formData);
      }
      setEditingId(null);
      setFormData({ question: '', options: ['', '', '', ''], correct_answer: 0 });
      fetchData();
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await deleteDoc(doc(db, 'questions', id));
      fetchData();
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setFormData({
      question: q.question,
      options: [...q.options],
      correct_answer: q.correct_answer
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-stone-500 font-medium">Loading administrative data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Admin Header */}
      <div className="bg-emerald-950 text-white p-10 rounded-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-20 -mr-20 -mt-20" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-emerald-300 font-medium">Manage your quiz ecosystem and track user performance.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="bg-emerald-900/50 p-4 rounded-3xl border border-emerald-800/50">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Questions</p>
              <p className="text-3xl font-bold">{questions.length}</p>
            </div>
            <div className="bg-emerald-900/50 p-4 rounded-3xl border border-emerald-800/50">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Total Results</p>
              <p className="text-3xl font-bold">{results.length}</p>
            </div>
            <div className="bg-emerald-900/50 p-4 rounded-3xl border border-emerald-800/50">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Avg Score</p>
              <p className="text-3xl font-bold">
                {results.length > 0 
                  ? Math.round((results.reduce((acc, r) => acc + (r.score / r.total_questions), 0) / results.length) * 100) 
                  : 0}%
              </p>
            </div>
            <div className="bg-emerald-900/50 p-4 rounded-3xl border border-emerald-800/50">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Active Users</p>
              <p className="text-3xl font-bold">{new Set(results.map(r => r.user_id)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-3xl border border-stone-200 shadow-sm w-fit mx-auto">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'questions' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          <BrainCircuit size={20} />
          Questions
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'results' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          <Trophy size={20} />
          User Results
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'questions' ? (
          <motion.div 
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Question Form */}
            <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-stone-200 shadow-xl space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                  {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <h2 className="text-2xl font-bold text-emerald-950">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-500 uppercase tracking-widest">Question Text</label>
                  <textarea
                    required
                    value={formData.question}
                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                    className="w-full bg-stone-50 border-2 border-stone-100 rounded-3xl p-6 text-lg font-medium focus:border-emerald-500 focus:bg-white transition-all outline-none min-h-[120px]"
                    placeholder="Enter your question here..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest flex justify-between">
                        Option {String.fromCharCode(65 + idx)}
                        <span className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="correct_answer"
                            checked={formData.correct_answer === idx}
                            onChange={() => setFormData({ ...formData, correct_answer: idx })}
                            className="w-4 h-4 accent-emerald-600"
                          />
                          Correct
                        </span>
                      </label>
                      <input
                        required
                        type="text"
                        value={option}
                        onChange={e => {
                          const newOptions = [...formData.options];
                          newOptions[idx] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className={`w-full bg-stone-50 border-2 rounded-2xl px-6 py-4 font-medium transition-all outline-none ${formData.correct_answer === idx ? 'border-emerald-200 bg-emerald-50/30' : 'border-stone-100 focus:border-emerald-500 focus:bg-white'}`}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                  >
                    <Save size={20} />
                    {editingId ? 'Update Question' : 'Save Question'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ question: '', options: ['', '', '', ''], correct_answer: 0 });
                      }}
                      className="px-8 py-4 rounded-2xl font-bold text-stone-500 hover:bg-stone-50 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-emerald-950 px-4">Existing Questions ({questions.length})</h3>
              <div className="grid gap-4">
                {questions.map((q) => (
                  <div key={q.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-4 flex-1">
                        <p className="text-lg font-bold text-emerald-950 leading-tight">{q.question}</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className={`text-sm px-4 py-2 rounded-xl border ${q.correct_answer === idx ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-stone-50 border-stone-100 text-stone-500'}`}>
                              <span className="mr-2 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                              {opt}
                              {q.correct_answer === idx && <CheckCircle size={14} className="inline ml-2" />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(q)} className="p-3 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-3 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] border border-stone-200 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-8 py-6 text-xs font-bold text-stone-400 uppercase tracking-widest">User</th>
                    <th className="px-8 py-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Score</th>
                    <th className="px-8 py-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Accuracy</th>
                    <th className="px-8 py-6 text-xs font-bold text-stone-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-stone-100 w-10 h-10 rounded-full flex items-center justify-center text-stone-500">
                            <Users size={18} />
                          </div>
                          <span className="font-bold text-stone-900">{result.user_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-bold text-emerald-700">{result.score}</span>
                        <span className="text-stone-300 mx-1">/</span>
                        <span className="text-stone-500">{result.total_questions}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${result.score / result.total_questions >= 0.6 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${(result.score / result.total_questions) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-stone-700">{Math.round((result.score / result.total_questions) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-stone-500 text-sm">
                        {format(result.date.toDate(), 'MMM d, yyyy • h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.length === 0 && (
                <div className="p-20 text-center space-y-4">
                  <div className="bg-stone-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-stone-300">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-stone-500 font-medium">No results recorded yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheck({ size }: { size: number }) {
  return <Shield size={size} />;
}
