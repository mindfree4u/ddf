// client/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
import Layout from './components/Layout';
import MainMenu from './components/MainMenu';
import MemberInfo from './pages/MemberInfo';
import './App.css';

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const auth = getAuth();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // userId가 'admin'이거나 isAdmin이 true인 경우 관리자로 처리
            setIsAdmin(userData.userId === 'admin' || userData.isAdmin === true);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return isAuthenticated ? (
    <div className="app-layout">
      <MainMenu isAdmin={isAdmin} />
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  ) : (
    <Navigate to="/login" />
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        console.log('User data:', userData);
        
        // userId가 'admin'이거나 isAdmin이 true인 경우 관리자로 처리
        const isUserAdmin = userData?.userId === 'admin' || userData?.isAdmin === true;
        console.log('isAdmin value:', isUserAdmin);
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Layout isAdmin={isAdmin}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/reservation" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/reservation" />} />
          <Route path="/reservation" element={user ? <ReservationForm /> : <Navigate to="/login" />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/video-upload" element={<VideoUpload />} />
          <Route path="/board" element={<Board />} />
          <Route path="/board/post/:id" element={<PostDetail />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/location" element={<Location />} />
          <Route path="/member-info" element={isAdmin ? <MemberInfo /> : <Navigate to="/reservation" />} />
          <Route path="/" element={<Navigate to="/reservation" />} />
        </Routes>
        <Footer />
      </Layout>
    </Router>
  );
}

export default App;