// client/src/components/MainMenu.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './MainMenu.css';

function MainMenu({ isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    // 외부 클릭 이벤트 핸들러
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      // 이벤트 리스너 제거
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleReservationClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      localStorage.setItem('redirectAfterLogin', '/reservation');
      navigate('/login');
    } else {
      navigate('/reservation');
    }
    setIsMenuOpen(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 현재 로그인한 사용자의 이름 가져오기
  const userName = auth.currentUser?.displayName || auth.currentUser?.email || '사용자';

  console.log('MainMenu isAdmin:', isAdmin);
  console.log('MainMenu isAdmin type:', typeof isAdmin);

  return (
    <nav className="navbar">
      <div className="container" ref={menuRef}>
        <Link to="/main" className="navbar-brand" onClick={() => setIsMenuOpen(false)}>
          드럼 놀이터
        </Link>
        
        <button className="navbar-toggler" onClick={toggleMenu}>
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link 
                to="/introduction" 
                className={`nav-link ${location.pathname === '/introduction' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/introduction')}
              >
                프로그램
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/reservation" 
                className={`nav-link ${location.pathname === '/reservation' ? 'active' : ''}`}
                onClick={handleReservationClick}
              >
                놀이터 예약
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/video-upload" 
                className={`nav-link ${location.pathname === '/video-upload' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/video-upload')}
              >
                드럼놀이터 영상
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/board" 
                className={`nav-link ${location.pathname === '/board' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/board')}
              >
                게시판
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/location" 
                className={`nav-link ${location.pathname === '/location' ? 'active' : ''}`}
                onClick={() => handleMenuClick('/location')}
              >
                오시는 길
              </Link>
            </li>
            {isAdmin && (
              <li className="admin-menu">
                <span>관리자 메뉴</span>
                <ul className="admin-dropdown">
                  <li><Link to="/member-info">회원관리</Link></li>
                </ul>
              </li>
            )}
          </ul>
          
          <div className="nav-user">
            {isLoggedIn ? (
              <>
                <div className="user-info">
                  <span className="user-name">{userName}</span>
                  <button onClick={handleLogout} className="logout-button">
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <button onClick={handleLogin} className="btn-login">
                로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MainMenu;