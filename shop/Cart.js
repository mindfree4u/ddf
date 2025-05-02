import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          setError('로그인이 필요한 서비스입니다.');
          setLoading(false);
          return;
        }
        
        const cartRef = doc(db, 'carts', user.uid);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists() && cartSnap.data().items) {
          setCartItems(cartSnap.data().items);
        } else {
          setCartItems([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('장바구니를 불러오는 중 오류가 발생했습니다:', err);
        setError('장바구니 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setLoading(false);
      }
    };
    
    fetchCart();
  }, [auth]);
  
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const updatedItems = cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      
      const cartRef = doc(db, 'carts', user.uid);
      await updateDoc(cartRef, {
        items: updatedItems
      });
      
      setCartItems(updatedItems);
    } catch (error) {
      console.error('수량 업데이트 중 오류 발생:', error);
      alert('수량 업데이트 중 오류가 발생했습니다.');
    }
  };
  
  const removeFromCart = async (productId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const updatedItems = cartItems.filter(item => item.productId !== productId);
      
      const cartRef = doc(db, 'carts', user.uid);
      await updateDoc(cartRef, {
        items: updatedItems
      });
      
      setCartItems(updatedItems);
      alert('상품이 장바구니에서 삭제되었습니다.');
    } catch (error) {
      console.error('상품 삭제 중 오류 발생:', error);
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };
  
  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  const continueShopping = () => {
    navigate('/shop');
  };
  
  const goToCheckout = () => {
    if (cartItems.length === 0) {
      alert('장바구니에 상품이 없습니다.');
      return;
    }
    navigate('/checkout');
  };
  
  if (loading) {
    return <div className="loading">장바구니 정보를 불러오는 중...</div>;
  }
  
  if (error) {
    return (
      <div className="cart-error-container">
        <div className="error-message">{error}</div>
        <button className="continue-shopping-button" onClick={() => navigate('/login')}>
          로그인 페이지로 이동
        </button>
      </div>
    );
  }
  
  return (
    <div className="cart-container">
      <h1 className="cart-title">장바구니</h1>
      
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>장바구니가 비어있습니다.</p>
          <button className="continue-shopping-button" onClick={continueShopping}>
            쇼핑 계속하기
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items-container">
            <div className="cart-header">
              <div className="cart-header-product">상품정보</div>
              <div className="cart-header-quantity">수량</div>
              <div className="cart-header-price">가격</div>
              <div className="cart-header-total">합계</div>
              <div className="cart-header-action">삭제</div>
            </div>
            
            {cartItems.map(item => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-product">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="cart-item-image"
                    onError={(e) => {
                      e.target.src = '/images/default-product.jpg';
                    }}
                  />
                  <div className="cart-item-info">
                    <h3 className="cart-item-name">{item.name}</h3>
                  </div>
                </div>
                
                <div className="cart-item-quantity">
                  <div className="quantity-control">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                      min="1"
                    />
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>
                
                <div className="cart-item-price">
                  {item.price.toLocaleString()}원
                </div>
                
                <div className="cart-item-total">
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
                
                <div className="cart-item-remove">
                  <button onClick={() => removeFromCart(item.productId)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>총 상품 수:</span>
              <span>{calculateTotalItems()}개</span>
            </div>
            <div className="cart-summary-row">
              <span>총 상품 금액:</span>
              <span>{calculateTotalPrice().toLocaleString()}원</span>
            </div>
            <div className="cart-summary-row">
              <span>배송비:</span>
              <span>무료</span>
            </div>
            <div className="cart-summary-total">
              <span>결제 예상 금액:</span>
              <span>{calculateTotalPrice().toLocaleString()}원</span>
            </div>
          </div>
          
          <div className="cart-buttons">
            <button className="continue-shopping-button" onClick={continueShopping}>
              쇼핑 계속하기
            </button>
            <button className="checkout-button" onClick={goToCheckout}>
              결제하기
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;