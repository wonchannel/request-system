import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function RequestBoardFull() {
  const [list, setList] = useState([]);
  const [soundOn, setSoundOn] = useState(localStorage.getItem("soundOn") !== "off");

  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("fontSize") || "24")
  );

  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  // 🔊 오디오 객체는 1회만 생성
  const beepRef = useRef(null);

  useEffect(() => {
    // 오디오 1회 생성
    beepRef.current = new Audio("/beep.mp3");
  }, []);

  // 🔊 브라우저 오디오 허용 (최초 클릭 1회만)
  useEffect(() => {
    function enableAudio() {
      beepRef.current?.play().catch(() => {});
      window.removeEventListener("click", enableAudio);
    }

    window.addEventListener("click", enableAudio);
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  // 🔐 로그인 유저 불러오기
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (user) {
        const name =
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "사용자";

        setUserName(name);
      }
    }
    loadUser();
  }, []);

  // 🔥 전체화면 자동 진입
  useEffect(() => {
    async function enterFull() {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen().catch(() => {});
      }
    }
    enterFull();
  }, []);

  // 🔠 글자 크기 조절
  function increaseFont() {
    const newSize = Math.min(fontSize + 2, 48);
    setFontSize(newSize);
    localStorage.setItem("fontSize", newSize);
  }

  function decreaseFont() {
    const newSize = Math.max(fontSize - 2, 16);
    setFontSize(newSize);
    localStorage.setItem("fontSize", newSize);
  }

  // 🔥 정렬
  function sortRequests(data) {
    const priority = { "긴급": 1, "일반": 2, "소분": 3 };

    return data.sort((a, b) => {
      const pA = priority[a.type] || 99;
      const pB = priority[b.type] || 99;

      if (pA !== pB) return pA - pB;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  async function loadRequests() {
    const { data } = await supabase.from("requests").select("*");
    if (data) setList(sortRequests(data));
  }

  async function setConfirmed(id) {
    await supabase.from("requests").update({ status: "confirmed" }).eq("id", id);
  }

  async function setPending(id) {
    await supabase.from("requests").update({ status: "pending" }).eq("id", id);
  }

  async function deleteRequest(id) {
    const ok = window.confirm("정말 삭제하시겠습니까?");
    if (!ok) return;
    await supabase.from("requests").delete().eq("id", id);
  }

  // 🔥 실시간 업데이트 (정확한 사운드 재생 포함)
  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        (payload) => {

          // ⛔ INSERT 될 때만 beep (버튼 클릭 시 울리는 문제 해결)
          if (payload.eventType === "INSERT" && soundOn) {
            const sound = beepRef.current;
            if (sound) {
              sound.currentTime = 0;
              sound.play().catch(() => {});
            }
          }

          loadRequests();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [soundOn]);

  // 🔊 사운드 토글
  function toggleSound() {
    const newState = !soundOn;
    setSoundOn(newState);
    localStorage.setItem("soundOn", newState ? "on" : "off");
  }

  function handleLogout() {
    navigate("/logout");
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "white",
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      {/* 상단 메뉴 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div style={{ fontSize: fontSize, color: "#333" }}>
          👤 로그인: <strong>{userName}</strong>
        </div>

        <div>
          <button
            onClick={decreaseFont}
            style={{
              padding: "14px 18px",
              fontSize: "24px",
              marginRight: "10px",
            }}
          >
            ➖ 글자축소
          </button>

          <button
            onClick={increaseFont}
            style={{
              padding: "14px 18px",
              fontSize: "24px",
              marginRight: "20px",
            }}
          >
            ➕ 글자확대
          </button>

          <button
            onClick={toggleSound}
            style={{
              padding: "14px 22px",
              fontSize: "24px",
              background: soundOn ? "#4caf50" : "#888",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              marginRight: "20px",
            }}
          >
            🔊 사운드 {soundOn ? "ON" : "OFF"}
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: "14px 22px",
              fontSize: "24px",
              backgroundColor: "#d9534f",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <table
        border="1"
        cellPadding="18"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: fontSize,
          textAlign: "center",
        }}
      >
        <thead>
          <tr style={{ height: "70px" }}>
            <th>유형</th>
            <th>상품명</th>
            <th>수량</th>
            <th>요청자</th>
            <th>시간</th>
            <th>상태</th>
            <th>작업</th>
          </tr>
        </thead>

        <tbody>
          {list.map((row) => (
            <tr key={row.id} style={{ height: "80px" }}>
              <td style={{ fontWeight: "bold" }}>
                {row.type === "긴급"
                  ? "🔴 긴급"
                  : row.type === "일반"
                  ? "🟢 일반"
                  : "🟡 소분"}
              </td>

              <td>{row.item}</td>
              <td>{row.qty}</td>
              <td>{row.requester}</td>

              <td>{new Date(row.created_at).toLocaleString()}</td>

              <td
                style={{
                  fontWeight: "bold",
                  color: row.status === "confirmed" ? "red" : "black",
                }}
              >
                {row.status === "confirmed" ? "확인" : "대기"}
              </td>

              <td>
                {row.status === "pending" ? (
                  <button
                    onClick={() => setConfirmed(row.id)}
                    style={{
                      marginRight: "10px",
                      padding: "14px 22px",
                      fontSize: fontSize,
                    }}
                  >
                    확인
                  </button>
                ) : (
                  <button
                    onClick={() => setPending(row.id)}
                    style={{
                      marginRight: "10px",
                      padding: "14px 22px",
                      fontSize: fontSize,
                    }}
                  >
                    수정
                  </button>
                )}

                <button
                  onClick={() => deleteRequest(row.id)}
                  style={{
                    padding: "14px 22px",
                    fontSize: fontSize,
                  }}
                >
                  완료
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}