import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PAYMENT_OPTIONS = [
  { label: '1개월 레슨비', value: 'lesson', amount: 160000 },
  { label: '연습실 이용료', value: 'practice', amount: 10000 },
  { label: '금액 직접입력', value: 'custom', amount: 0 },
];

const TOSS_CLIENT_KEY = 'test_ck_GjLJoQ1aVZq1pAlkbomJ3w6KYe2R';

function PaymentPage() {
  const [selectedOption, setSelectedOption] = useState('lesson');
  const [customAmount, setCustomAmount] = useState('');
  const navigate = useNavigate();

  const getAmount = () => {
    if (selectedOption === 'custom') {
      return Number(customAmount) || 0;
    }
    return PAYMENT_OPTIONS.find(opt => opt.value === selectedOption)?.amount || 0;
  };

  function requestTossPayment(amount) {
    const orderId = 'order_' + Date.now();
    const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
    
    tossPayments.requestPayment('카드', {
      amount,
      orderId,
      orderName: PAYMENT_OPTIONS.find(opt => opt.value === selectedOption)?.label || '직접입력',
      customerName: '테스트회원',
      successUrl: window.location.origin + '/payment/success',
      failUrl: window.location.origin + '/payment-fail',
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
      // 스크립트가 없으면 동적으로 추가
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

  const handlePaymentSuccess = (paymentResult) => {
    // 결제 정보 생성
    const paymentInfo = {
      reservationId: paymentResult.reservationId,
      amount: paymentResult.amount,
      reservationDate: paymentResult.reservationDate,
      startTime: paymentResult.startTime,
      endTime: paymentResult.endTime,
      paymentMethod: paymentResult.paymentMethod,
      paymentDate: new Date().toISOString()
    };

    // PaymentSuccess 페이지로 이동하면서 결제 정보 전달
    navigate('/payment/success', { 
      state: { paymentInfo },
      replace: true 
    });
  };

  return (
    <div className="payment-page-container" style={{ maxWidth: 400, margin: '40px auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2>결제하기(시험중으로서 지금은 결제가 이루어지지 않습니다)</h2>
      <div style={{ marginBottom: 24 }}>
        {PAYMENT_OPTIONS.map(opt => (
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
      {/* 토스페이먼츠 결제 위젯은 결제 버튼 클릭 시 팝업으로 동작합니다. */}
    </div>
  );
}

export default PaymentPage; 