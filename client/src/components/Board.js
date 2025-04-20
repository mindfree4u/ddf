import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Board.css';

function Board() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchPosts();
  }, []);

  const checkAdminStatus = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // userId가 'admin'인 경우에만 관리자로 설정
          setIsAdmin(userData.userId === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const postList = [];
      querySnapshot.forEach((doc) => {
        postList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPosts(postList);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    // userId가 'admin'인지 다시 한번 확인
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (!userDoc.exists() || userDoc.data().userId !== 'admin') {
      setError('관리자만 게시글을 작성할 수 있습니다.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 사용자 정보 가져오기
      const userData = userDoc.data();
      
      const postData = {
        title,
        content,
        authorId: auth.currentUser.uid,
        authorName: userData.userName || userData.userId || '관리자',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'posts'), postData);
      
      setTitle('');
      setContent('');
      
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    // userId가 'admin'인지 다시 한번 확인
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (!userDoc.exists() || userDoc.data().userId !== 'admin') {
      setError('관리자만 게시글을 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', postId));
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Firestore Timestamp 객체인 경우
    if (date.toDate && typeof date.toDate === 'function') {
      const d = date.toDate();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    // 일반 Date 객체인 경우
    if (date instanceof Date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // ISO 문자열인 경우
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    
    // 기타 경우
    return '날짜 정보 없음';
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="board-container">
      <h2>자유 게시판</h2>
      
      {isAdmin && (
        <div className="post-form-container">
          <h3>새 게시글 작성</h3>
          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
              <label htmlFor="title">제목</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">내용</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="게시글 내용을 입력하세요"
                className="form-control"
                rows="5"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? '작성 중...' : '게시글 작성'}
            </button>
          </form>
        </div>
      )}
      
      <div className="posts-list">
        <h3>게시글 목록</h3>
        {posts.length === 0 ? (
          <p className="no-posts">작성된 게시글이 없습니다.</p>
        ) : (
          <div className="posts-table">
            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  {isAdmin && <th>관리</th>}
                </tr>
              </thead>
              <tbody>
                {posts.map((post, index) => (
                  <tr key={post.id}>
                    <td>{posts.length - index}</td>
                    <td>
                      <span 
                        className="post-title"
                        onClick={() => navigate(`/board/post/${post.id}`)}
                      >
                        {post.title}
                      </span>
                    </td>
                    <td>{post.authorName}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    {isAdmin && (
                      <td>
                        <button 
                          className="delete-button"
                          onClick={() => handleDelete(post.id)}
                        >
                          삭제
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Board; 