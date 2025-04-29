// client/src/components/Login.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { getDocs, query, collection, where } from 'firebase/firestore';
import './Login.css';

function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First, find the user's email using their userId
      const q = query(collection(db, 'users'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('존재하지 않는 아이디입니다.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      console.log('Found user document:', userDoc.id);
      console.log('Full user data from Firestore:', userDoc.data());
      
      const userData = userDoc.data();
      const email = userData.email;
      const name = userData.name;
      const role = userData.role;
      const isAdmin = userData.isAdmin;

      console.log('=== User Data from Firestore ===');
      console.log('Document ID:', userDoc.id);
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Role:', role);
      console.log('Is Admin:', isAdmin);
      console.log('User ID:', userId);
      console.log('==============================');

      // Now sign in with email and password
      console.log('Attempting to sign in with:', email, password);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth User:', userCredential.user);

      // 로그인 성공 후 저장된 리다이렉트 경로 확인
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {

        console.log('Redirecting to saved path====>:', redirectPath);
        navigate(redirectPath);
        localStorage.removeItem('redirectAfterLogin'); // 사용 후 삭제
      } else {
        console.log('No saved path found, going to main');
        navigate('/main');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>드럼놀이터 예약 시스템</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="userId">아이디</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit">로그인</button>
        <Link to="/signup" className="signup-link">회원가입</Link>
      </form>
    </div>
  );
}

export default Login;