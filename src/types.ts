export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface Result {
  id: string;
  user_id: string;
  user_name: string;
  score: number;
  total_questions: number;
  date: any; // Firestore Timestamp
}
