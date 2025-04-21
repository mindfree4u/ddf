import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { convertFromRaw, EditorState } from 'draft-js';
import ddfLogo from '../assets/ddf-logo.png';
import './MainPage.css';

function MainPage() {
  const [boardPosts, setBoardPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    fetchVideos();
  }, []);

  // Draft.js content를 일반 텍스트로 변환하는 함수
  const getPlainText = (content) => {
    try {
      if (typeof content === 'string') {
        const contentJSON = JSON.parse(content);
        const contentState = convertFromRaw(contentJSON);
        return contentState.getPlainText();
      } else if (content && content.blocks) {
        const contentState = convertFromRaw(content);
        return contentState.getPlainText();
      }
      return '';
    } catch (e) {
      console.error('Error parsing content:', e);
      return typeof content === 'string' ? content : '';
    }
  };

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(3));
      const querySnapshot = await getDocs(q);
      
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = '';
        
        if (data.createdAt) {
          try {
            if (typeof data.createdAt.toDate === 'function') {
              formattedDate = data.createdAt.toDate().toLocaleDateString('ko-KR');
            } 
            else if (data.createdAt instanceof Date) {
              formattedDate = data.createdAt.toLocaleDateString('ko-KR');
            }
            else if (typeof data.createdAt === 'string') {
              formattedDate = new Date(data.createdAt).toLocaleDateString('ko-KR');
            }
          } catch (error) {
            console.error('Date formatting error:', error);
            formattedDate = '';
          }
        }

        // content를 일반 텍스트로 변환
        const plainContent = getPlainText(data.content);
        // 내용을 100자로 제한
        const truncatedContent = plainContent.length > 100 
          ? plainContent.substring(0, 100) + '...' 
          : plainContent;

        return {
          id: doc.id,
          title: data.title || '',
          content: truncatedContent,
          author: data.userName || '익명',
          date: formattedDate
        };
      });
      
      setBoardPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const videosRef = collection(db, 'videos');
      const q = query(videosRef, orderBy('createdAt', 'desc'), limit(3));
      const querySnapshot = await getDocs(q);
      
      const videoList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = '';
        
        if (data.createdAt) {
          try {
            if (typeof data.createdAt.toDate === 'function') {
              formattedDate = data.createdAt.toDate().toLocaleDateString('ko-KR');
            } 
            else if (data.createdAt instanceof Date) {
              formattedDate = data.createdAt.toLocaleDateString('ko-KR');
            }
            else if (typeof data.createdAt === 'string') {
              formattedDate = new Date(data.createdAt).toLocaleDateString('ko-KR');
            }
          } catch (error) {
            console.error('Date formatting error:', error);
            formattedDate = '';
          }
        }

        return {
          id: doc.id,
          title: data.title || '',
          videoId: data.videoId || '',
          author: data.userName || '익명',
          date: formattedDate
        };
      });
      
      setVideos(videoList);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/board/post/${postId}`);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video-upload`);
  };

  return (
    <div className="main-page">
      <h1 className="welcome-title">드럼놀이터에 오신 것을 환영합니다</h1>
      <div className="intro-section">
        <div className="logo-container">
          <img src={ddfLogo} alt="DDF Logo" className="ddf-logo" />
          <div className="logo-text">
            <p>드럼 놀이터</p>
            <p>모든 연령 드럼 레슨, 체험</p>
            <p>피아노/작곡, 연습실대여</p>
          </div>
        </div>
        <div className="intro-text">
          <p>
            드럼놀이터는 드럼을 사랑하는 모든 분들을 위한 공간입니다.
            레슨 또는 연습실 예약부터 드럼 정보 공유, 영상 업로드까지 
            드럼과 관련된 모든 것을 한 곳에서 만나보세요.
          </p>
        </div>
      </div>

      <div className="board-section">
        <div className="board-title">
          게시판
          <Link to="/board">더보기 &gt;</Link>
        </div>
        <div className="board-grid">
          {boardPosts.map(post => (
            <div key={post.id} className="board-item" onClick={() => handlePostClick(post.id)}>
              <div className="board-item-content">
                <div className="board-item-title">{post.title}</div>
                <div className="board-item-text">{post.content}</div>
                <div className="board-item-info">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="video-section">
        <div className="video-title">
          놀이터 영상
          <Link to="/video-upload">더보기 &gt;</Link>
        </div>
        <div className="video-grid">
          {videos.map(video => (
            <div key={video.id} className="video-item" onClick={() => handleVideoClick(video.id)}>
              <div className="video-thumbnail">
                <img 
                  src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                  alt={video.title}
                />
              </div>
              <div className="video-item-content">
                <div className="video-item-title">{video.title}</div>
                <div className="video-item-info">
                  <span>{video.author}</span>
                  <span>{video.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MainPage; 