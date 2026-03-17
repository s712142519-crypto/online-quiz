import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';
import { LogOut, User as UserIcon, Shield, Trophy, LayoutDashboard, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Create user doc if it doesn't exist
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: 'user'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        // Handle firestore permission error if it occurs
        if (error instanceof Error && error.message.includes('permission-denied')) {
          console.error("Firestore permission denied. Check security rules.");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-emerald-600 p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                  <BrainCircuit size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight text-emerald-900">QuizMaster Pro</span>
              </Link>

              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="text-stone-600 hover:text-emerald-600 flex items-center gap-1 text-sm font-medium">
                        <Shield size={18} />
                        <span className="hidden sm:inline">Admin</span>
                      </Link>
                    )}
                    <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-stone-900">{user.name}</p>
                        <p className="text-xs text-stone-500 capitalize">{user.role}</p>
                      </div>
                      <button 
                        onClick={() => signOut(auth)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Sign Out"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/quiz" element={user ? <QuizPage user={user} /> : <Navigate to="/login" />} />
              <Route path="/result/:resultId" element={user ? <ResultPage user={user} /> : <Navigate to="/login" />} />
              <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>

        <footer className="bg-white border-t border-stone-200 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-stone-500 text-sm">© 2026 QuizMaster Pro. Built for excellence.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
