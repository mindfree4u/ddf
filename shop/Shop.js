import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import ProductList from './ProductList';
import './Shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'sticks', name: '드럼스틱' },
    { id: 'heads', name: '드럼 헤드' },
    { id: 'cymbals', name: '심벌즈' },
    { id: 'accessories', name: '액세서리' },
    { id: 'books', name: '교재/DVD' }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, 'products');
        const productSnapshot = await getDocs(productsCollection);
        const productList = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productList);
        setLoading(false);
      } catch (err) {
        console.error('상품을 불러오는 중 오류가 발생했습니다:', err);
        setError('상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const viewCart = () => {
    navigate('/cart');
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>드럼놀이터 쇼핑몰</h1>
        <p>드럼 연주에 필요한 모든 장비를 만나보세요</p>
        <button className="cart-button" onClick={viewCart}>
          장바구니 보기
        </button>
      </div>

      <div className="category-tabs">
        {categories.map(category => (
          <button 
            key={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategorySelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">상품을 불러오는 중...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <ProductList products={filteredProducts} />
      )}
    </div>
  );
};

export default Shop;