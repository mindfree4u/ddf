import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './MemberInfo.css';

const MemberInfo = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchMembers();
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="member-info-container">
      <h1>회원 정보</h1>
      <table className="member-table">
        <thead>
          <tr>
            <th>이메일</th>
            <th>이름</th>
            <th>가입일</th>
            <th>관리자 여부</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.email}</td>
              <td>{member.name || '-'}</td>
              <td>{member.createdAt ? new Date(member.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
              <td>{member.isAdmin ? '예' : '아니오'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberInfo; 