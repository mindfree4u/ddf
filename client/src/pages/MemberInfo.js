import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './MemberInfo.css';

const MemberInfo = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('회원 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleAdminToggle = async (memberId, currentAdminStatus) => {
    if (updating) return;
    
    try {
      setUpdating(true);
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        isAdmin: !currentAdminStatus
      });
      
      // 업데이트 후 회원 목록 새로고침
      await fetchMembers();
      
    } catch (err) {
      console.error('Error updating admin status:', err);
      alert('관리자 권한 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="member-info-container">
      <h1>회원 정보</h1>
      <table className="member-table">
        <thead>
          <tr>
            <th>아이디</th>
            <th>이메일</th>
            <th>이름</th>
            <th>가입일</th>
            <th>관리자 여부</th>
            <th>권한 수정</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.userId}</td>
              <td>{member.email}</td>
              <td>{member.name || '-'}</td>
              <td>{member.createdAt ? new Date(member.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
              <td>{member.isAdmin ? '예' : '아니오'}</td>
              <td>
                <button 
                  className={`admin-toggle-button ${member.isAdmin ? 'admin' : 'not-admin'}`}
                  onClick={() => handleAdminToggle(member.id, member.isAdmin)}
                  disabled={updating}
                >
                  {member.isAdmin ? '관리자 해제' : '관리자 지정'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberInfo; 