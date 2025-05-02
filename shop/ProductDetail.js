import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          setProduct({
            id: productSnap.id,
            ...productSnap.data()
          });
        } else {
          setError('상품을 찾을 수 없습니다.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('상품 정보를 불러오는 중 오류가 발생했습니다:', err);
        setError('상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const addToCart = async () => {
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
        quantity: quantity
      };
      
      if (cartSnap.exists()) {
        // 장바구니가 이미 존재하면 상품 추가 또는 수량 업데이트
        const cartData = cartSnap.data();
        const existingItemIndex = cartData.items ? 
          cartData.items.findIndex(item => item.productId === product.id) : -1;
        
        if (existingItemIndex !== -1) {
          // 이미 장바구니에 있는 상품이면 수량만 증가
          const updatedItems = [...cartData.items];
          updatedItems[existingItemIndex].quantity += quantity;
          
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
      
      const goToCart = window.confirm('상품이 장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?');
      if (goToCart) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('장바구니 추가 중 오류 발생:', error);
      alert('장바구니 추가 중 오류가 발생했습니다.');
    }
  };
  
  const buyNow = () => {
    if (!auth.currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    
    // 장바구니에 추가 후 바로 결제 페이지로 이동
    addToCart().then(() => {
      navigate('/checkout');
    });
  };

  if (loading) {
    return <div className="loading">상품 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!product) {
    return <div className="error-message">상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-wrapper">
        <div className="product-detail-image">
          <img 
            src={product.image} 
            alt={product.name} 
            onError={(e) => {
              e.target.src = '/images/default-product.jpg'; // 기본 이미지 대체
            }}
          />
        </div>
        
        <div className="product-detail-info">
          <h1 className="product-detail-name">{product.name}</h1>
          
          <div className="product-detail-price-container">
            {product.discount > 0 ? (
              <>
                <p className="product-detail-original-price">{product.originalPrice.toLocaleString()}원</p>
                <p className="product-detail-price">{product.price.toLocaleString()}원</p>
                <span className="product-detail-discount">{product.discount}% 할인</span>
              </>
            ) : (
              <p className="product-detail-price">{product.price.toLocaleString()}원</p>
            )}
          </div>
          
          <div className="product-detail-delivery">
            <p>배송비: {product.deliveryFee > 0 ? `${product.deliveryFee.toLocaleString()}원` : '무료배송'}</p>
            <p>출고 예정일: 주문 후 1-3일 이내</p>
          </div>
          
          <div className="product-detail-quantity">
            <span>수량</span>
            <div className="quantity-control">
              <button onClick={decreaseQuantity}>-</button>
              <input 
                type="number" 
                value={quantity} 
                onChange={handleQuantityChange}
                min="1"
              />
              <button onClick={increaseQuantity}>+</button>
            </div>
          </div>
          
          <div className="product-detail-total-price">
            <span>총 상품 금액</span>
            <span className="total-price-value">{(product.price * quantity).toLocaleString()}원</span>
          </div>
          
          <div className="product-detail-buttons">
            <button className="add-to-cart-btn" onClick={addToCart}>장바구니</button>
            <button className="buy-now-btn" onClick={buyNow}>바로 구매</button>
          </div>
        </div>
      </div>
      
      <div className="product-detail-description">
        <h2>상품 정보</h2>
        <div className="description-content">
          <p>{product.description}</p>
          {product.detailImages && product.detailImages.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`${product.name} 상세 이미지 ${index + 1}`} 
              className="detail-image"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;