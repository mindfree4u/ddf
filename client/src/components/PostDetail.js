import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './PostDetail.css';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, 'posts', id);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          // createdAt 필드가 Timestamp인 경우와 문자열인 경우 모두 처리
          const createdAt = postData.createdAt?.toDate 
            ? postData.createdAt.toDate().toLocaleString('ko-KR')
            : postData.createdAt || '날짜 정보 없음';
            
          setPost({
            ...postData,
            id: postDoc.id,
            createdAt
          });
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="post-detail-loading">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="post-detail-error">
        게시글을 찾을 수 없습니다.
        <button onClick={() => navigate('/board')} className="back-button">
          게시판으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <h2>{post.title}</h2>
        <div className="post-detail-info">
          <span>작성자: {post.authorName || '익명'}</span>
          <span>작성일: {post.createdAt}</span>
        </div>
      </div>
      <div className="post-detail-content">
        {post.content}
      </div>
      <div className="post-detail-actions">
        <button onClick={() => navigate('/board')} className="back-button">
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PostDetail; 