import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Result } from '../types';
import { Trophy, Clock, Brain, ArrowRight, Play, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Home({ user }: { user: User | null }) {
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchResults = async () => {
        const q = query(
          collection(db, 'results'),
          where('user_id', '==', user.uid),
          orderBy('date', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));
        setRecentResults(results);
        setLoading(false);
      };
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <motion.h1 
          className="text-5xl sm:text-7xl font-bold tracking-tight text-emerald-950"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          Master Your <span className="text-emerald-600 italic serif">Knowledge</span>
        </motion.h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto">
          Challenge yourself with our curated quizzes. Track your progress, compete with others, and become a master in your field.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          {user ? (
            <Link 
              to="/quiz" 
              className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              Start New Quiz <Play size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
            >
              Sign In to Start <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          { icon: <Clock className="text-emerald-600" />, title: "Timed Challenges", desc: "10 minutes to prove your speed and accuracy." },
          { icon: <Brain className="text-emerald-600" />, title: "Diverse Topics", desc: "Questions ranging from tech to general knowledge." },
          { icon: <Trophy className="text-emerald-600" />, title: "Instant Results", desc: "Get your score and performance breakdown immediately." }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">{feature.title}</h3>
            <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Recent Activity */}
      {user && (
        <section className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <LayoutDashboard size={24} className="text-emerald-600" />
              Your Recent Activity
            </h2>
            <Link to="/quiz" className="text-emerald-600 font-semibold text-sm hover:underline">Take another quiz</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {loading ? (
              <div className="p-12 text-center text-stone-400">Loading your history...</div>
            ) : recentResults.length > 0 ? (
              recentResults.map((result) => (
                <Link 
                  key={result.id} 
                  to={`/result/${result.id}`}
                  className="flex items-center justify-between p-6 hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">Score: {result.score} / {result.total_questions}</p>
                      <p className="text-sm text-stone-500">{format(result.date.toDate(), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-stone-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            ) : (
              <div className="p-12 text-center space-y-4">
                <p className="text-stone-500">No quiz history yet. Ready for your first challenge?</p>
                <Link to="/quiz" className="inline-block bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full font-bold hover:bg-emerald-100 transition-colors">Start First Quiz</Link>
              </div>
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
}
