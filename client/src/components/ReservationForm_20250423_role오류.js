// client/src/components/ReservationForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './ReservationForm.css';

function ReservationForm() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [reservations, setReservations] = useState({});
  const [reservationDetails, setReservationDetails] = useState({});
  const [reservationIds, setReservationIds] = useState({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showTypeButtons, setShowTypeButtons] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  const rooms = ['Room A', 'Room B', 'Room C', 'Room E'];

  useEffect(() => {
    checkAdminStatus();
    fetchReservations(selectedDate);
  }, [selectedDate]);

  // 사용자 인증 상태 변경 시 관리자 상태 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdminStatus();
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        console.log("auth.currentUser.uid =======>>>> ", auth.currentUser.uid);
        console.log('userDoc.data()===========================:', userDoc.data());
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // 관리자 확인 로직 수정 - 실제 데이터베이스 구조에 맞게 조정
          setIsAdmin(userData.isAdmin === true || userData.role === 'admin' || userData.userId === 'admin');
        }
        else
        {
          console.log('userDoc Not Exists error==========================');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  const fetchReservations = async (date) => {
    try {
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      const reservationsRef = collection(db, 'reservations');
      const q = query(reservationsRef, where('date', '==', dateStr));
      const querySnapshot = await getDocs(q);
      
      const newReservations = {};
      const newReservationDetails = {};
      const newReservationIds = {};
      const userRoles = {};
      
      // 모든 예약의 사용자 ID를 수집
      const userIds = new Set();
      querySnapshot.forEach(doc => {
        const data = doc.data();
        userIds.add(data.userId);
      });

      // 사용자 역할 정보 가져오기
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userRoles[userId] = userData.role || 'guest';
        }
      }
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const key = `${dateStr}_${data.timeSlot}_${data.room}`;
        newReservations[key] = data.userId;
        newReservationDetails[key] = {
          text: `${data.type}(${data.userName})`,
          role: userRoles[data.userId] || 'guest'
        };
        newReservationIds[key] = doc.id;
      });
      
      setReservations(newReservations);
      setReservationDetails(newReservationDetails);
      setReservationIds(newReservationIds);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      const newDate = new Date(selectedDate);
      if (isLeftSwipe) {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      setSelectedDate(newDate);
      fetchReservations(newDate);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleTouchOutside = (e) => {
    if (showTypeButtons) {
      setShowTypeButtons(false);
    }
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [showTypeButtons]);

  const handleReservation = async (timeSlot, room, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!auth.currentUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const reservationKey = `${dateStr}_${timeSlot}_${room}`;
    
    if (reservations[reservationKey]) {
      // 관리자이거나 자신의 예약인 경우
      console.log('reservations[reservationKey]:=====================>', reservations[reservationKey]);
      if (isAdmin || reservations[reservationKey] === auth.currentUser.uid) {
        setSelectedReservation({
          timeSlot,
          room,
          reservationId: reservationIds[reservationKey],
          key: reservationKey
        });
        setShowActionModal(true);
      } else {
        alert('이미 예약된 시간입니다.');
      }
      return;
    }

    // 이미 선택된 셀이 있다면 초기화
    if (selectedTimeSlot || selectedRoom) {
      setSelectedTimeSlot(null);
      setSelectedRoom(null);
      setShowTypeButtons(false);
    }

    setSelectedTimeSlot(timeSlot);
    setSelectedRoom(room);
    setShowTypeButtons(true);
  };

  const handleTypeSelection = async (type, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedTimeSlot || !selectedRoom) return;

    try {
      await makeReservation(type, auth.currentUser.displayName || '익명');
      setShowTypeButtons(false);
      setSelectedTimeSlot(null);
      setSelectedRoom(null);
    } catch (error) {
      console.error('예약 처리 중 오류 발생:', error);
      alert('예약 처리 중 오류가 발생했습니다.');
    }
  };

  const makeReservation = async (type, userName) => {
    if (!selectedTimeSlot || !selectedRoom) return;

    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const reservationKey = `${dateStr}_${selectedTimeSlot}_${selectedRoom}`;

    try {
      // 사용자 역할 정보 가져오기
      let userRole = 'guest';
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userRole = userData.role || 'guest';
        }
      }

      const reservationData = {
        userId: auth.currentUser.uid,
        userName: userName,
        date: dateStr,
        timeSlot: selectedTimeSlot,
        room: selectedRoom,
        type: type,
        createdAt: Timestamp.now()
      };

      console.log('reservationData:', reservationData);
      console.log('userId:', reservationData);
      const docRef = await addDoc(collection(db, 'reservations'), reservationData);
      
      setReservations(prev => ({
        ...prev,
        [reservationKey]: auth.currentUser.uid
      }));
      
      setReservationDetails(prev => ({
        ...prev,
        [reservationKey]: {
          text: `${type}(${userName})`,
          role: userRole
        }
      }));

      setReservationIds(prev => ({
        ...prev,
        [reservationKey]: docRef.id
      }));

      setSelectedTimeSlot(null);
      setSelectedRoom(null);
      setShowTypeButtons(false);
      alert('예약이 완료되었습니다.');
    } catch (error) {
      console.error('Error making reservation:', error);
      alert('예약 중 오류가 발생했습니다.');
    }
  };

  const cancelReservation = async (reservationKey, reservationId) => {
    try {
      await deleteDoc(doc(db, 'reservations', reservationId));
      
      const newReservations = { ...reservations };
      const newReservationDetails = { ...reservationDetails };
      const newReservationIds = { ...reservationIds };
      
      delete newReservations[reservationKey];
      delete newReservationDetails[reservationKey];
      delete newReservationIds[reservationKey];
      
      setReservations(newReservations);
      setReservationDetails(newReservationDetails);
      setReservationIds(newReservationIds);
      
      alert('예약이 취소되었습니다.');
    } catch (error) {
      console.error('Error canceling reservation:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const updateReservationName = async (reservationKey, reservationId, newName) => {
    try {
      const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      const reservation = await getDoc(doc(db, 'reservations', reservationId));
      
      if (reservation.exists()) {
        const data = reservation.data();
        const type = data.type;
        
        await updateDoc(doc(db, 'reservations', reservationId), {
          userName: newName
        });
        
        setReservationDetails(prev => ({
          ...prev,
          [reservationKey]: {
            text: `${type}(${newName})`,
            role: 'guest'
          }
        }));
        
        alert('예약자 이름이 변경되었습니다.');
      }
    } catch (error) {
      console.error('Error updating reservation name:', error);
      alert('예약자 이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleActionModalClose = () => {
    setShowActionModal(false);
    setSelectedReservation(null);
  };

  const handleCancelReservation = async () => {
    if (selectedReservation) {
      await cancelReservation(selectedReservation.key, selectedReservation.reservationId);
      handleActionModalClose();
    }
  };

  const handleChangeName = () => {
    if (selectedReservation) {
      console.log('이름 변경 시작:', selectedReservation);
      setShowNameInput(true);
      setShowActionModal(false);
    }
  };

  const handleNameInputSubmit = async (e) => {
    e.preventDefault();
    console.log('이름 변경 제출 시작');
    console.log('현재 selectedReservation:', selectedReservation);
    
    if (!newUserName.trim()) {
      alert('예약자 이름을 입력해주세요.');
      return;
    }
    
    if (selectedReservation) {
      console.log('선택된 예약:', selectedReservation);
      try {
        await updateReservationName(selectedReservation.key, selectedReservation.reservationId, newUserName);
        console.log('이름 업데이트 완료');
        
        // 상태 초기화
        setNewUserName('');
        setShowNameInput(false);
        setSelectedReservation(null);
        
        console.log('모달 상태 초기화 완료');
      } catch (error) {
        console.error('이름 업데이트 중 오류 발생:', error);
        alert('이름 변경 중 오류가 발생했습니다.');
      }
    } else {
      console.log('선택된 예약이 없음');
    }
  };

  const handleNameInputCancel = () => {
    console.log('이름 입력 취소');
    setNewUserName('');
    setShowNameInput(false);
    setSelectedReservation(null);
  };

  const formatDateForDisplay = (date) => {
    // 시간대를 고려한 날짜 계산
    const localDate = new Date(date.getTime());
    // const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[localDate.getDay()];
    return `${year}.${month}.${day} (${dayOfWeek})`;
  };

  const getReservationClass = (timeSlot, room) => {
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const reservationKey = `${dateStr}_${timeSlot}_${room}`;
    if (reservations[reservationKey]) {
      const details = reservationDetails[reservationKey];
      const type = details.text.split('(')[0];
      const isAdminReservation = reservations[reservationKey] === auth.currentUser?.uid && isAdmin;
      const isMyReservation = reservations[reservationKey] === auth.currentUser?.uid;
      const isGuestReservation = isAdmin && details?.role === 'guest';

      let classes = ['reserved'];
      
      if (type === '레슨') {
        classes.push('lesson');
      } else {
        classes.push('practice');
      }
      
      if (isAdminReservation) {
        classes.push('admin-reservation');
      }
      
      if (isMyReservation) {
        classes.push('my-reservation');
      }
      
      if (isGuestReservation) {
        classes.push('guest-reservation');
      }
      
      return classes.join(' ');
    }
    return 'available';
  };

  const handleMouseLeave = () => {
    setSelectedTimeSlot(null);
    setSelectedRoom(null);
    setShowTypeButtons(false);
  };

  const getReservationText = (timeSlot, room) => {
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const reservationKey = `${dateStr}_${timeSlot}_${room}`;
    
    if (selectedTimeSlot === timeSlot && selectedRoom === room && showTypeButtons) {
      return (
        <div 
          className="type-buttons" 
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <button 
            className="type-button lesson"
            onClick={(e) => handleTypeSelection('레슨', e)}
            onTouchEnd={(e) => handleTypeSelection('레슨', e)}
          >
            레슨
          </button>
          <button 
            className="type-button practice"
            onClick={(e) => handleTypeSelection('연습', e)}
            onTouchEnd={(e) => handleTypeSelection('연습', e)}
          >
            연습
          </button>
        </div>
      );
    }
    
    if (reservations[reservationKey]) {
      // 관리자이거나 자신의 예약인 경우 상세 정보 표시
      if (isAdmin || reservations[reservationKey] === auth.currentUser?.uid) {
        return reservationDetails[reservationKey].text;
      } else {
        // 일반 사용자가 다른 사람의 예약을 볼 때는 "예약완료"로 표시
        return "예약완료";
      }
    }
    
    return '예약하기';
  };

  const handleDateNavigation = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    fetchReservations(newDate);
  };

  return (
    <div className="reservation-container">
      <h2>놀이터 예약</h2>
      
      <div className="date-selector"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="date-display">
          <button 
            className="date-nav-button prev" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDateNavigation('prev');
            }}
          >
            &lt;
          </button>
          <span className="date-label">예약일자:</span>
          <span className="date-value">{formatDateForDisplay(selectedDate)}</span>
          <button 
            className="date-nav-button next" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDateNavigation('next');
            }}
          >
            &gt;
          </button>
        </div>
        <input
          type="date"
          value={new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]}
          onChange={handleDateChange}
          min={new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]}
          className="date-input"
        />
      </div>
      
      <div className="reservation-table">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              {rooms.map(room => (
                <th key={room}>{room}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td>{timeSlot}</td>
                {rooms.map(room => (
                  <td 
                    key={`${timeSlot}-${room}`}
                    className={`${getReservationClass(timeSlot, room)} clickable`}
                    onClick={(e) => handleReservation(timeSlot, room, e)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReservation(timeSlot, room, e);
                    }}
                  >
                    {selectedTimeSlot === timeSlot && selectedRoom === room && showTypeButtons ? (
                      <div 
                        className="type-buttons"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <button 
                          className="type-button lesson"
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTypeSelection('레슨', e);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTypeSelection('레슨', e);
                          }}
                        >
                          레슨
                        </button>
                        <button 
                          className="type-button practice"
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTypeSelection('연습', e);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTypeSelection('연습', e);
                          }}
                        >
                          연습
                        </button>
                      </div>
                    ) : (
                      getReservationText(timeSlot, room)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="reservation-guide">
        <ul>
          <li>원하는 시간/장소에 "예약하기" 를 누른 후 "레슨" 또는 "연습" 을 선택하면 예약이 이루어집니다.</li>
          <li>Room A는 레슨 전용입니다.(나머지 Room은 레슨과 연습 예약이 가능합니다)</li>
          <li>예약된 내용을 누르면 취소가 가능합니다.</li>
          {isAdmin && <li>관리자는 자신이 예약한 항목을 클릭하여 예약자명을 수정할 수 있습니다.</li>}
        </ul>
      </div>

      {/* 작업 선택 모달 */}
      {showActionModal && (
        <div className="action-modal-overlay">
          <div className="action-modal">
            <h3>어떤 작업을 수행하시겠습니까?</h3>
            <div className="action-buttons">
              <button 
                className="action-button cancel"
                onClick={handleCancelReservation}
              >
                예약취소
              </button>
              <button 
                className="action-button change-name"
                onClick={handleChangeName}
              >
                이름변경
              </button>
              <button 
                className="action-button close"
                onClick={handleActionModalClose}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 입력 모달 */}
      {showNameInput && (
        <div className="name-input-overlay">
          <div className="name-input-container">
            <h3>예약자명을 입력하세요</h3>
            <form onSubmit={handleNameInputSubmit}>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="예약자 이름"
                autoFocus
                className="name-input"
              />
              <div className="name-input-buttons">
                <button type="submit" className="name-input-submit">확인</button>
                <button 
                  type="button" 
                  className="name-input-cancel"
                  onClick={handleNameInputCancel}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationForm;