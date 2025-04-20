import React from 'react';
import './Introduction.css';

function Introduction() {
  return (
    <div className="introduction-container">
      <div className="program-header">
        <h2>드럼놀이터 프로그램</h2>
      </div>

      <div className="program-sections">
        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/child-drum.jpg" alt="어린이 드럼놀이" />
          </div>
          <h3>어린이 드럼놀이</h3>
          <p>드럼을 통해 음악의 즐거움을 느끼고,<br />창의력과 자신감을 키울 수 있는<br />특별한 시간!</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/teen-drum.jpg" alt="청소년 드럼놀이" />
          </div>
          <h3>청소년 드럼놀이</h3>
          <p>리듬을 통해 나를 발견하고<br />리듬으로 나를 표현하자!</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/adult-drum.jpg" alt="성인 취미반" />
          </div>
          <h3>성인 취미반</h3>
          <p>실력제한없게 누구나 드럼연주<br />연주녹음, 장작활동, 드럼믹싱동</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/diet-drum.jpg" alt="다이어트 드럼" />
          </div>
          <h3>다이어트 드럼</h3>
          <p>리듬으로 몸도 마음도 건강하게!<br />신나는 드럼연주로 다이어트를 즐겁게!</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/pick-drum.jpg" alt="꼭 집어 드럼" />
          </div>
          <h3>꼭 집어 드럼</h3>
          <p>내가 원하는 곡으로 시작하는<br />드럼 연행에 참여하세요!</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/piano.jpg" alt="피아노&작곡" />
          </div>
          <h3>피아노&작곡</h3>
          <p>기초부터 심화까지<br />전문 강사의 1:1 맞춤 지도</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/ensemble.jpg" alt="DDF-O-O" />
          </div>
          <h3>DDF-O-O</h3>
          <p>합주, 녹음<br />개인 녹음, 미디</p>
        </section>

        <section className="program-section">
          <div className="program-image">
            <img src="/images/program/recording.jpg" alt="개인 녹음, 미디" />
          </div>
          <h3>개인 녹음, 미디</h3>
          <p>전문 시설에서<br />나만의 음악 만들기</p>
        </section>
      </div>
    </div>
  );
}

export default Introduction; 