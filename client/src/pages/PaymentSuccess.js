import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db, sendPaymentNotification } from '../firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const emailSentRef = useRef(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        // URL 파라미터에서 결제 정보 가져오기
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey');
        const amount = searchParams.get('amount');

        if (!orderId || !paymentKey || !amount) {
          throw new Error('결제 정보를 찾을 수 없습니다. 결제 페이지에서 다시 시도해주세요.');
        }

        // 결제 정보를 Firestore에 저장
        const paymentRef = await addDoc(collection(db, 'payments'), {
          amount: parseInt(amount),
          orderId: orderId,
          paymentKey: paymentKey,
          timestamp: new Date(),
          userId: user.uid,
          userName: user.displayName || '사용자',
          status: 'completed'
        });

        console.log('Payment saved with ID:', paymentRef.id);

        // 저장된 결제 정보를 상태에 설정
        setPaymentInfo({
          amount: parseInt(amount),
          timestamp: new Date()
        });

        // 이메일 전송이 아직 되지 않았다면 전송
        if (!emailSentRef.current) {
          try {
            await sendPaymentNotification({
              userName: user.displayName || '사용자',
              amount: parseInt(amount),
              timestamp: new Date().toLocaleString()
            });
            emailSentRef.current = true;
          } catch (emailError) {
            console.error('Failed to send payment notification email:', emailError);
            // 이메일 전송 실패는 사용자에게 보여주지 않음
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching payment info:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [navigate, location.search]);

  if (loading) return <div className="loading">결제 정보를 불러오는 중...</div>;
  if (error) return (
    <div className="error-container">
      <div className="error">{error}</div>
      <button onClick={() => navigate('/main')} className="home-button">
        홈으로 돌아가기
      </button>
    </div>
  );

  return (
    <div className="payment-success-container">
      <h1>결제가 완료되었습니다!</h1>
      <div className="payment-info">
        <h2>결제 정보</h2>
        <p>결제 금액: {paymentInfo.amount.toLocaleString()}원</p>
        <p>결제 일시: {paymentInfo.timestamp.toLocaleString()}</p>
      </div>
      <button onClick={() => navigate('/main')} className="home-button">
        홈으로 돌아가기
      </button>
    </div>
  );
};

export default PaymentSuccess; 