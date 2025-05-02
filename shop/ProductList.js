import React from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';

const ProductList = ({ products }) => {
  const auth = getAuth();

  const addToCart = async (product) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        alert('로그인이 필요한 서비스입니다.');
        return;
      }
      
      const cartRef = doc(db, 'carts', user.uid);
      const cartSnap = await getDoc(cartRef);
      
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      };
      
      if (cartSnap.exists()) {
        // 장바구니가 이미 존재하면 상품 추가
        const cartData = cartSnap.data();
        const existingItemIndex = cartData.items ? 
          cartData.items.findIndex(item => item.productId === product.id) : -1;
        
        if (existingItemIndex !== -1) {
          // 이미 장바구니에 있는 상품이면 수량만 증가
          const updatedItems = [...cartData.items];
          updatedItems[existingItemIndex].quantity += 1;
          
          await updateDoc(cartRef, {
            items: updatedItems
          });
        } else {
          // 새 상품이면 추가
          await updateDoc(cartRef, {
            items: arrayUnion(cartItem)
          });
        }
      } else {
        // 장바구니가 없으면 새로 생성
        await setDoc(cartRef, {
          userId: user.uid,
          items: [cartItem],
          createdAt: new Date()
        });
      }
      
      alert('상품이 장바구니에 추가되었습니다.');
    } catch (error) {
      console.error('장바구니 추가 중 오류 발생:', error);
      alert('장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="product-list">
      {products.length === 0 ? (
        <div className="no-products">
          해당 카테고리에 상품이 없습니다.
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-item">
              <Link to={`/product/${product.id}`} className="product-link">
                <div className="product-image-container">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="product-image"
                    onError={(e) => {
                      e.target.src = '/images/default-product.jpg'; // 기본 이미지 대체
                    }}
                  />
                  {product.discount > 0 && (
                    <span className="discount-badge">{product.discount}% OFF</span>
                  )}
                </div>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price-container">
                  {product.discount > 0 ? (
                    <>
                      <p className="original-price">{product.originalPrice.toLocaleString()}원</p>
                      <p className="product-price">{product.price.toLocaleString()}원</p>
                    </>
                  ) : (
                    <p className="product-price">{product.price.toLocaleString()}원</p>
                  )}
                </div>
              </Link>
              <button 
                className="add-to-cart-button"
                onClick={() => addToCart(product)}
              >
                장바구니 담기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;