const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
admin.initializeApp();

// 환경변수에 이메일 정보 저장 (firebase functions:config:set 로 설정)
const NAVER_EMAIL = defineSecret('NAVER_EMAIL');
const NAVER_PASSWORD = defineSecret('NAVER_PASSWORD');
const adminMail = 'bestuser@naver.com';

const getTransporter = (naverEmail, naverPassword) => nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true,
  auth: {
    user: naverEmail,
    pass: naverPassword,
  },
});

// 예약 생성 시 이메일 발송 (v2 문법)
exports.sendReservationMail = onDocumentCreated(
  {
    document: 'reservations/{reservationId}',
    secrets: ['NAVER_EMAIL', 'NAVER_PASSWORD'],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    if (!data) return;
    const transporter = getTransporter(NAVER_EMAIL.value(), NAVER_PASSWORD.value());
    const mailOptions = {
      from: `"드럼놀이터" <${NAVER_EMAIL.value()}>`,
      to: adminMail,
      subject: '[예약 알림] 새로운 예약이 등록되었습니다',
      text: `예약자: ${data.userName}\n날짜: ${data.date}\n시간: ${data.timeSlot}\n룸: ${data.room}`,
    };
    await transporter.sendMail(mailOptions);
    return null;
  }
);

// 예약 취소 시 이메일 발송 (v2 문법)
exports.sendCancelMail = onDocumentDeleted(
  {
    document: 'reservations/{reservationId}',
    secrets: ['NAVER_EMAIL', 'NAVER_PASSWORD'],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    if (!data) return;
    const transporter = getTransporter(NAVER_EMAIL.value(), NAVER_PASSWORD.value());
    const mailOptions = {
      from: `"드럼놀이터" <${NAVER_EMAIL.value()}>`,
      to: adminMail,
      subject: '[예약 취소 알림] 예약이 취소되었습니다',
      text: `예약자: ${data.userName}\n날짜: ${data.date}\n시간: ${data.timeSlot}\n룸: ${data.room}`,
    };
    await transporter.sendMail(mailOptions);
    return null;
  }
);

// Firestore 데이터베이스 참조
const db = admin.firestore();

// 드럼 연습 기록 저장 함수
exports.savePlayRecord = functions.https.onCall(async (data, context) => {
  try {
    // 사용자 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }

    const userId = context.auth.uid;
    const { bpm, duration, pattern, accuracy, timestamp } = data;

    // 데이터 유효성 검사
    if (!bpm || !duration || !pattern || accuracy === undefined || !timestamp) {
      throw new functions.https.HttpsError('invalid-argument', '필수 데이터가 누락되었습니다.');
    }

    // Firestore에 연습 기록 저장
    const recordRef = db.collection('users').doc(userId).collection('playRecords');
    await recordRef.add({
      bpm,
      duration,
      pattern,
      accuracy,
      timestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: '연습 기록이 저장되었습니다.' };
  } catch (error) {
    console.error('Error saving play record:', error);
    throw new functions.https.HttpsError('internal', '연습 기록 저장 중 오류가 발생했습니다.');
  }
});

// 사용자의 연습 기록 조회 함수
exports.getPlayRecords = functions.https.onCall(async (data, context) => {
  try {
    // 사용자 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }

    const userId = context.auth.uid;
    const { limit = 10, startAfter } = data;

    // Firestore에서 연습 기록 조회
    let query = db.collection('users')
      .doc(userId)
      .collection('playRecords')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    const records = [];

    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { records };
  } catch (error) {
    console.error('Error getting play records:', error);
    throw new functions.https.HttpsError('internal', '연습 기록 조회 중 오류가 발생했습니다.');
  }
});

// 연습 통계 계산 함수
exports.calculateStats = functions.https.onCall(async (data, context) => {
  try {
    // 사용자 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }

    const userId = context.auth.uid;
    const { startDate, endDate } = data;

    // 날짜 범위에 따른 쿼리 설정
    let query = db.collection('users')
      .doc(userId)
      .collection('playRecords')
      .orderBy('timestamp', 'desc');

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();
    
    // 통계 계산
    let totalDuration = 0;
    let totalRecords = 0;
    let avgAccuracy = 0;
    let maxBpm = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalDuration += data.duration;
      totalRecords++;
      avgAccuracy += data.accuracy;
      maxBpm = Math.max(maxBpm, data.bpm);
    });

    return {
      totalDuration,
      totalRecords,
      avgAccuracy: totalRecords > 0 ? avgAccuracy / totalRecords : 0,
      maxBpm
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    throw new functions.https.HttpsError('internal', '통계 계산 중 오류가 발생했습니다.');
  }
});