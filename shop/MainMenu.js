
리액트로 드럼놀이터라는 예약프로그램을 짰어.
이제 "쇼핑몰" 이라는 메뉴를 만들어서 드럼용품을 판매하는 쇼핑몰을 만들려고 해.
firebase database를 사용하고 있고 javascript 기반이야.
App.js App.css Mainmenu.js, Mainmenu.css를 사용하고 있어.
이들ㅇ 추가할 코드와 쇼핑몰 페이지를 만들어줘

드럼 용품 쇼핑몰 추가 개발을 도와드리겠습니다. 기존의 드럼놀이터 예약 프로그램에 쇼핑몰 기능을 추가하기 위해 필요한 코드를 만들어 드리겠습니다.

먼저 쇼핑몰 페이지와 관련 컴포넌트를 제작하고, App.js와 MainMenu.js를 업데이트하겠습니다. Firebase를 데이터베이스로 사용하는 방식을 유지하면서 진행하겠습니다.

다음과 같은 파일들을 생성하고 수정하겠습니다:

새 파일:
Shop.js, Shop.css: 쇼핑몰 메인 페이지
ProductList.js: 상품 목록 컴포넌트
ProductItem.js: 개별 상품 컴포넌트
ProductDetail.js: 상품 상세 페이지
Cart.js, Cart.css: 장바구니 기능
수정 파일:
App.js: 라우팅 추가
MainMenu.js: 쇼핑몰 메뉴 추가

Shop.js
코드 

Shop.css
코드 

ProductList.js
코드 

ProductDetail.js
코드 

ProductDetail.css
코드 

Cart.js
코드 




계속

죄송합니다. Cart.js 파일 작성을 계속하겠습니다.


Cart.js
코드 ∙ 버전 2 



Cart.js는 이미 만들어졌어, 아직 작성 안된 코드를 만들어줘

이해했습니다. Cart.js 파일을 완성하고 나머지 필요한 파일들을 만들어 드리겠습니다.


Cart.js
코드 

Cart.js
코드 

Cart.js
코드 

Cart.css
코드 

App.js 업데이트
코드 

MainMenu.js 업데이트
코드 

Firebase에 추가할 상품 데이터 예시
코드 



import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './MainMenu.css';

function MainMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();
  
  // 메뉴 토글
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  return (
    <nav className="main-menu">
      <div className="menu-container">
        <div className="menu-header">
          <Link to="/" className="logo">드럼놀이터</Link>
          <button className="menu-toggle" onClick={toggleMenu}>
            <span className="menu-icon"></span>
          </button>
        </div>
        
        <ul className={`menu-items ${showMenu ? 'active' : ''}`}>
          <li>
            <Link to="/" onClick={toggleMenu}>홈</Link>
          </li>
          <li>
            <Link to="/reservation" onClick={toggleMenu}>연습실 예약</Link>
          </li>
          <li>
            <Link to="/shop" onClick={toggleMenu}>쇼핑몰</Link>
          </li>
          <li>
            <Link to="/about" onClick={toggleMenu}>소개</Link>
          </li>
          {/* 기존 메뉴 항목 유지 */}
          
          {auth.currentUser ? (
            <>
              <li>
                <Link to="/mypage" onClick={toggleMenu}>마이페이지</Link>
              </li>
              <li>
                <Link to="/cart" onClick={toggleMenu}>장바구니</Link>
              </li>
              <li>
                <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" onClick={toggleMenu}>로그인</Link>
              </li>
              <li>
                <Link to="/register" onClick={toggleMenu}>회원가입</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default MainMenu;
