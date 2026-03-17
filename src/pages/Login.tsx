import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogIn, ShieldCheck, BrainCircuit, UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Create user doc
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          name,
          email,
          role: 'user'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/user-not-found') message = 'No user found with this email.';
      if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
      if (err.code === 'auth/email-already-in-use') message = 'Email already in use.';
      if (err.code === 'auth/operation-not-allowed') message = 'Email/Password login is not enabled in Firebase Console.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-md mx-auto mt-12"
    >
      <div className="bg-white p-10 rounded-[40px] border border-stone-200 shadow-xl space-y-8">
        <div className="text-center space-y-6">
          <div className="bg-emerald-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-100">
            <BrainCircuit size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-emerald-950">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-stone-500">
              {isRegistering ? 'Join QuizMaster Pro to start your journey.' : 'Sign in to access your quizzes and track your progress.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-2">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-12 pr-6 font-medium focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-12 pr-6 font-medium focus:border-emerald-500 focus:bg-white transition-all outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-12 pr-6 font-medium focus:border-emerald-500 focus:bg-white transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 px-6 rounded-3xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
            <span>{loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}</span>
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-emerald-600 font-bold hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

        <div className="pt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-400 text-xs uppercase tracking-widest font-bold">
          <ShieldCheck size={14} />
          Secure Authentication
        </div>
      </div>
    </motion.div>
  );
}
