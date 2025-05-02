import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './MainMenu'; 
import Shop from './Shop';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
// 기존 임포트는 유지하면서 추가

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <MainMenu />
        <Routes>
          {/* 기존 라우트들은 모두 유지합니다 */}
          
          {/* 쇼핑몰 관련 라우트 추가 */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          {/* 구현 시 추가하면 좋을 라우트 */}
          {/* <Route path="/checkout" element={<Checkout />} /> */}
          {/* <Route path="/order-complete" element={<OrderComplete />} /> */}
          {/* <Route path="/my-orders" element={<MyOrders />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;