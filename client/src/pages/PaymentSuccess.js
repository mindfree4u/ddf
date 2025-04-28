import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // URL 파라미터에서 결제 정보 가져오기
    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');

    if (orderId && paymentKey && amount) {
      // 실제 서비스에서는 서버에 결제 검증 요청을 해야 합니다.
      const paymentData = {
        reservationId: orderId,
        amount: parseInt(amount),
        reservationDate: new Date().toISOString(),
        startTime: '14:00',  // 예시 데이터
        endTime: '16:00',    // 예시 데이터
        paymentMethod: '카드',
        paymentDate: new Date().toISOString(),
        paymentKey: paymentKey
      };
      setPaymentInfo(paymentData);
    } else if (location.state?.paymentInfo) {
      // 기존 방식 (state를 통한 데이터 전달)
      setPaymentInfo(location.state.paymentInfo);
    }
  }, [searchParams, location.state]);

  if (!paymentInfo) {
    return (
      <div className="payment-success-container">
        <h2>잘못된 접근입니다</h2>
        <button onClick={() => navigate('/main')} className="secondary-button">
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시 ${date.getMinutes()}분`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="payment-success-container">
      <div className="success-icon">✓</div>
      <h2>결제가 완료되었습니다</h2>
      
      <div className="payment-info-card">
        <h3>결제 정보</h3>
        <div className="payment-details">
{/*
          <div className="info-row">
            <span className="label">예약 번호:</span>
            <span className="value">{paymentInfo.reservationId}</span>
          </div>
*/}
          <div className="info-row">
            <span className="label">결제 금액:</span>
            <span className="value">{formatPrice(paymentInfo.amount)}원</span>
          </div>
{/*
          <div className="info-row">
            <span className="label">예약 시간:</span>
            <span className="value">{paymentInfo.startTime} - {paymentInfo.endTime}</span>
          </div>
          
          <div className="info-row">
            <span className="label">결제 방법:</span>
            <span className="value">{paymentInfo.paymentMethod}</span>
          </div>
          <div className="info-row">
            <span className="label">결제 키:</span>
            <span className="value">{paymentInfo.paymentKey}</span>
          </div>
*/}
          <div className="info-row">
            <span className="label">결제 시간:</span>
            <span className="value">{formatDate(paymentInfo.paymentDate)}</span>
          </div>

        </div>
      </div>

      <div className="action-buttons">
{/*
        <button onClick={() => navigate('/my-reservations')} className="primary-button">
          예약 내역 보기
        </button>
*/}
        <button onClick={() => navigate('/main')} className="secondary-button">
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess; 