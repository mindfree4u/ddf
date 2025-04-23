// client/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import Login from './components/Login';
import Signup from './components/Signup';
import MainPage from './components/MainPage';
import Introduction from './components/Introduction';
import ReservationForm from './components/ReservationForm';
import VideoUpload from './components/VideoUpload';
import Board from './components/Board';
import PostDetail from './components/PostDetail';
import MyPage from './components/MyPage';
import Footer from './components/Footer';
import Location from './components/Location';
import MainMenu from './components/MainMenu';
import MemberInfo from './pages/MemberInfo';
import Profile from './pages/Profile';
import MyReservations from './pages/MyReservations';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed.');
      console.log('User UID:', user?.uid);
      setUser(user);
      
      if (user) {
        try {
          // 먼저 email로 userId 찾기
          const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(userQuery);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('Full user data:', userData);
            console.log('User role:', userData.role);
            console.log('User ID:', userData.userId);
            
            // role이 'admin'인 경우 관리자로 설정
            const isUserAdmin = userData.isAdmin === true || userData.role === 'admin' || userData.userId === 'admin';
            console.log('Is admin check result:', isUserAdmin);
            setIsAdmin(isUserAdmin);
            
            // 디버깅을 위한 타입 체크
            console.log('Role type:', typeof userData.role);
            console.log('Role value exact:', `'${userData.role}'`);
          } else {
            console.log('No user document found for email:', user.email);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        console.log('No user logged in');
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <MainMenu isAdmin={isAdmin} />
        <div className="content-wrapper">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
            <Route path="/reservation" element={user ? <ReservationForm isAdmin={isAdmin} /> : <Navigate to="/login" />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/introduction" element={<Introduction />} />
            <Route path="/video-upload" element={<VideoUpload />} />
            <Route path="/board" element={<Board />} />
            <Route path="/board/post/:id" element={<PostDetail />} />
            <Route path="/my-page" element={<MyPage />} />
            <Route path="/location" element={<Location />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/my-reservations" element={user ? <MyReservations /> : <Navigate to="/login" />} />
            <Route path="/member-info" element={user && isAdmin ? <MemberInfo /> : <Navigate to="/" />} />
            <Route path="/" element={<Navigate to="/main" />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;