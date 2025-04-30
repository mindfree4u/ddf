import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';

const TOSS_CLIENT_KEY = 'test_ck_GjLJoQ1aVZq1pAlkbomJ3w6KYe2R';

function PaymentPage() {
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 결제 옵션 불러오기
  useEffect(() => {
    loadPaymentOptions();
  }, []);

  const loadPaymentOptions = async () => {
    try {
      const q = query(collection(db, 'payment_settings'), orderBy('amount', 'asc'));
      const querySnapshot = await getDocs(q);

      const options = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        value: doc.id
      }));
      // 직접입력 옵션 추가
      options.push({ label: '금액 직접입력', value: 'custom', amount: 0 });
      setPaymentOptions(options);
      
      // 첫 번째 옵션을 기본값으로 설정
      if (options.length > 0) {
        setSelectedOption(options[0].value);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading payment options:', error);
      setLoading(false);
    }
  };

  const getAmount = () => {
    if (selectedOption === 'custom') {
      return Number(customAmount) || 0;
    }
    return paymentOptions.find(opt => opt.value === selectedOption)?.amount || 0;
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // 결제 정보를 Firestore에 저장
      const paymentRef = await addDoc(collection(db, 'payments'), {
        label: paymentResult.label,
        amount: paymentResult.amount,
        paymentMethod: paymentResult.paymentMethod,
        timestamp: new Date(),
        userId: user.uid,
        userName: user.displayName || '사용자',
        orderId: paymentResult.orderId,
        status: 'completed'
      });

      console.log('Payment saved===>', paymentRef.id, paymentResult.paymentMethod, paymentResult.label, paymentResult.amount);

      // PaymentSuccess 페이지로 이동하면서 필요한 정보 전달
      navigate(`/payment/success?orderId=${paymentResult.orderId}&paymentKey=${paymentResult.paymentKey}&amount=${paymentResult.amount}&paymentSettingId=${selectedOption}`, { 
        replace: true
      });
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('결제 정보 저장 중 오류가 발생했습니다.');
    }
  };

  function requestTossPayment(amount) {
    const orderId = 'order_' + Date.now();
    const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
    
    const selectedOptionLabel = paymentOptions.find(opt => opt.value === selectedOption)?.label || '직접입력';
    
    tossPayments.requestPayment('카드', {
      amount,
      orderId,
      orderName: selectedOptionLabel,
      customerName: '테스트회원',
      successUrl: window.location.origin + '/payment/success',
      failUrl: window.location.origin + '/payment-fail',
    })
    .then(function (result) {
      console.log('Payment result:', result);
      // 결제 성공 시 처리
      handlePaymentSuccess({
        ...result,
        orderId: orderId,
        paymentKey: result.paymentKey
      });
    })
    .catch(function (error) {
      if (error.code === 'USER_CANCEL') {
        alert('결제가 취소되었습니다.');
      } else {
        alert('결제에 실패했습니다.\n' + error.message);
      }
    });
  }

  const handlePayment = () => {
    const amount = getAmount();
    if (!window.TossPayments) {
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        requestTossPayment(amount);
      };
      script.onerror = () => {
        alert('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      };
      return;
    }
    requestTossPayment(amount);
  };

  if (loading) {
    return <div>로딩중...</div>;
  }

  return (
    <div className="payment-page-container" style={{ maxWidth: 400, margin: '40px auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2>결제하기(시험중으로서 지금은 결제가 이루어지지 않습니다)</h2>
      <div style={{ marginBottom: 24 }}>
        {paymentOptions.map(opt => (
          <div key={opt.value} style={{ marginBottom: 12 }}>
            <label>
              <input
                type="radio"
                name="paymentOption"
                value={opt.value}
                checked={selectedOption === opt.value}
                onChange={() => setSelectedOption(opt.value)}
              />
              {opt.label}
              {opt.value !== 'custom' && (
                <span style={{ marginLeft: 8, color: '#888' }}>({opt.amount.toLocaleString()}원)</span>
              )}
            </label>
          </div>
        ))}
        {selectedOption === 'custom' && (
          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              min="9000"
              step="1000"
              placeholder="금액을 입력하세요 (원)"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
        )}
      </div>
      <button
        onClick={handlePayment}
        style={{ width: '100%', padding: 12, background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, fontSize: 16, cursor: 'pointer' }}
        disabled={getAmount() < 9000}
      >
        결제하기
      </button>
    </div>
  );
}

export default PaymentPage; 