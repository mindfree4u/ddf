// client/src/components/ReservationForm.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './ReservationForm.css';

function ReservationForm() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userRole, setUserRole] = useState(null);

  const [reservations, setReservations] = useState({});
  const [reservationDetails, setReservationDetails] = useState({});
  const [reservationIds, setReservationIds] = useState({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showTypeButtons, setShowTypeButtons] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isGuestReservationMap, setIsGuestReservationMap] = useState({});
  const [dailyReservationCount, setDailyReservationCount] = useState({ lesson: 0, practice: 0 });

  const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  const rooms = ['Room A', 'Room B', 'Room C', 'Room E'];

  useEffect(() => {
    checkAdminStatus();
    fetchReservations(selectedDate);
    checkUserRole();
  }, [selectedDate]);

  // 사용자 인증 상태 변경 시 관리자 상태 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await checkAdminStatus();
        await checkUserRole();
      } else {
        setIsAdmin(false);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    if (auth.currentUser) {
      try {
        // 먼저 email로 userId 찾기
        const userQuery = query(collection(db, 'users'), where('email', '==', auth.currentUser.email));
        const querySnapshot = await getDocs(userQuery);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log('Full user data:', userData);
          console.log('User role:', userData.role);
          console.log('User ID:', userData.userId);
          
          // role이 'admin'인 경우 관리자로 설정
          const isUserAdmin = userData.isAdmin === true || userData.role === 'admin' || userData.userId === 'admin';
          console.log('Is admin check result:', isUserAdmin);
          setIsAdmin(isUserAdmin);
        } else {
          console.log('No user document found for email:', auth.currentUser.email);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  const checkUserRole = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
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
      const newIsGuestReservationMap = {};
      let lessonCount = 0;
      let practiceCount = 0;

      // 예약자 userId별로 role을 조회
      const userPromises = querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        if (data.userId === auth.currentUser?.uid) {
          if (data.type === '레슨') lessonCount++;
          if (data.type === '연습') practiceCount++;
        }
        if (data.userId) {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          if (userDoc.exists()) {
            return { userId: data.userId, role: userDoc.data().role };
          }
        }
        return null;
      });
      const userResults = await Promise.all(userPromises);
      const userRoleMap = {};
      userResults.forEach(result => {
        if (result) userRoleMap[result.userId] = result.role;
      });

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const key = `${dateStr}_${data.timeSlot}_${data.room}`;
        newReservations[key] = data.userId;
        newReservationDetails[key] = `${data.type}(${data.userName})`;
        newReservationIds[key] = docSnap.id;
        newIsGuestReservationMap[key] = userRoleMap[data.userId] === 'guest';
      });

      setReservations(newReservations);
      setReservationDetails(newReservationDetails);
      setReservationIds(newReservationIds);
      setIsGuestReservationMap(newIsGuestReservationMap);
      setDailyReservationCount({ lesson: lessonCount, practice: practiceCount });
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  const handleTouchStart = (e, timeSlot, room) => {
    e.preventDefault();
    setTouchStart(e.touches[0].clientX);
    setTouchStartTime(Date.now());
    setIsScrolling(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.touches[0].clientX;
    const distance = Math.abs(touchStart - touchEnd);
    
    // 일정 거리 이상 움직이면 스크롤로 판단
    if (distance > 10) {
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = (e, timeSlot, room) => {
    if (!touchStart || !touchStartTime) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const distance = Math.abs(touchStart - touchEnd);
    const touchDuration = Date.now() - touchStartTime;
    
    // 스크롤이나 확대/축소가 아닌 경우에만 예약 처리
    if (!isScrolling && distance < 10 && touchDuration < 300) {
      handleReservation(timeSlot, room, e);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
    setIsScrolling(false);
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

  useEffect(() => {
    function handleClickOutside(event) {
      // 클릭된 요소가 예약 테이블 셀이거나 타입 버튼인 경우 무시
      if (event.target.closest('.clickable') || event.target.closest('.type-buttons')) {
        return;
      }
      // 그 외의 영역 클릭 시 선택 상태 초기화
      setSelectedTimeSlot(null);
      setSelectedRoom(null);
      setShowTypeButtons(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNaverPlaceRedirect = () => {
    window.open('https://m.place.naver.com/place/1822651205/ticket?entry=pll', '_blank');
  };

  const handleReservation = async (timeSlot, room, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!auth.currentUser) {
      if (window.confirm('비회원의 경우 네이버에서 예약을 해 주시기 바랍니다. 네이버로 이동하시겠습니까?')) {
        handleNaverPlaceRedirect();
      }
      return;
    }

    if (userRole === 'guest') {
      if (window.confirm('비회원의 경우 네이버에서 예약을 해 주시기 바랍니다. 네이버로 이동하시겠습니까?')) {
        handleNaverPlaceRedirect();
      }
      return;
    }

    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
    const reservationKey = `${dateStr}_${timeSlot}_${room}`;
    
    if (reservations[reservationKey]) {
      const isMyReservation = reservations[reservationKey] === auth.currentUser.uid;
      
      if (isAdmin && isMyReservation) {
        // 관리자가 자신의 예약을 취소할 때는 모달 창 사용
        setSelectedReservation({
          timeSlot,
          room,
          reservationId: reservationIds[reservationKey],
          key: reservationKey
        });
        setShowActionModal(true);
      } else if (isAdmin || isMyReservation) {
        // 관리자가 다른 회원의 예약을 취소하거나, 일반 회원이 자신의 예약을 취소할 때
        const confirmMessage = isAdmin 
          ? '해당 예약을 취소하시겠습니까? (관리자 권한으로 취소)'
          : '해당 예약을 취소하시겠습니까?';
          
        if (window.confirm(confirmMessage)) {
          try {
            await cancelReservation(reservationKey, reservationIds[reservationKey]);
            // 예약 취소 후 상태 업데이트
            setSelectedTimeSlot(null);
            setSelectedRoom(null);
            setShowTypeButtons(false);
          } catch (error) {
            console.error('예약 취소 중 오류 발생:', error);
            alert('예약 취소 중 오류가 발생했습니다.');
          }
        }
      } else {
        alert('이미 예약된 시간입니다.');
      }
      return;
    }

    // 다른 셀을 클릭한 경우 이전 선택 초기화
    if (selectedTimeSlot !== timeSlot || selectedRoom !== room) {
      setSelectedTimeSlot(timeSlot);
      setSelectedRoom(room);
      setShowTypeButtons(true);
    } else {
      // 같은 셀을 다시 클릭한 경우
      setSelectedTimeSlot(null);
      setSelectedRoom(null);
      setShowTypeButtons(false);
    }
  };

  const handleTypeSelection = async (type, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedTimeSlot || !selectedRoom) return;

    // 관리자는 예약 횟수 제한 없음
    console.log('isAdmin===================>', isAdmin);
    if (!isAdmin) {
      // 현재 선택된 날짜의 모든 예약을 확인
      const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      let currentLessonCount = 0;
      let currentPracticeCount = 0;

      // 현재 날짜의 모든 예약을 확인하여 카운트
      Object.entries(reservations).forEach(([key, userId]) => {
        if (key.startsWith(dateStr) && userId === auth.currentUser?.uid) {
          const details = reservationDetails[key];
          if (details.startsWith('레슨')) currentLessonCount++;
          if (details.startsWith('연습')) currentPracticeCount++;
        }
      });

      // 예약 제한 확인
      if (type === '레슨' && currentLessonCount >= 1) {
        alert('동일 일자에 "레슨"은 1회까지만 예약 가능합니다.');
        setShowTypeButtons(false);
        setSelectedTimeSlot(null);
        setSelectedRoom(null);
        return;
      }
      if (type === '연습' && currentPracticeCount >= 1) {
        alert('동일 일자에 "연습"은 1회까지만 예약 가능합니다.');
        setShowTypeButtons(false);
        setSelectedTimeSlot(null);
        setSelectedRoom(null);
        return;
      }
    }

    try {
      await makeReservation(type, auth.currentUser.displayName || '익명');
      setShowTypeButtons(false);
      setSelectedTimeSlot(null);
      setSelectedRoom(null);
      // 예약 후 현재 날짜의 예약을 다시 불러옴
      fetchReservations(selectedDate);
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
      const reservationData = {
        userId: auth.currentUser.uid,
        userName: userName,
        date: dateStr,
        timeSlot: selectedTimeSlot,
        room: selectedRoom,
        type: type,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reservations'), reservationData);
      
      setReservations(prev => ({
        ...prev,
        [reservationKey]: auth.currentUser.uid
      }));
      
      setReservationDetails(prev => ({
        ...prev,
        [reservationKey]: `${type}(${userName})`
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
      
      // 취소 후 현재 날짜의 예약을 다시 불러옴
      await fetchReservations(selectedDate);
    } catch (error) {
      console.error('Error canceling reservation:', error);
      throw error;
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
          [reservationKey]: `${type}(${newName})`
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
      const type = details.split('(')[0];
      const isAdminReservation = reservations[reservationKey] === auth.currentUser?.uid && isAdmin;
      const isMyReservation = reservations[reservationKey] === auth.currentUser?.uid;
      const isGuestReservation = isGuestReservationMap[reservationKey];
      return `reserved ${type === '레슨' ? 'lesson' : 'practice'} ${isAdminReservation ? 'admin-reservation' : ''} ${isMyReservation ? 'my-reservation' : ''} ${isGuestReservation ? 'guest-reservation' : ''}`;
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
      if (userRole === 'guest') {
        return (
          <div className="guest-reservation-message">
            <p>비회원의 경우 네이버에서 예약을 해 주시기 바랍니다</p>
            <button 
              className="naver-reservation-button"
              onClick={(e) => {
                e.stopPropagation();
                handleNaverPlaceRedirect();
              }}
            >
              네이버로 예약하기
            </button>
          </div>
        );
      }
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
        return reservationDetails[reservationKey];
      } else {
        // 일반 사용자가 다른 사람의 예약을 볼 때는 "예약완료"로 표시
        return "예약완료";
      }
    }
    
    return auth.currentUser ? (userRole === 'guest' ? '예약하기' : '예약하기') : '예약하기';
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
                    onTouchStart={(e) => handleTouchStart(e, timeSlot, room)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, timeSlot, room)}
                  >
                    {getReservationText(timeSlot, room)}
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
          <li>본인이 예약한 셀을 누르면 취소가 가능합니다.</li>
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