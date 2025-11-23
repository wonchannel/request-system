import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function RequestBoardFull() {
  const [list, setList] = useState([]);
  const [soundOn, setSoundOn] = useState(localStorage.getItem("soundOn") !== "off");

  // 🔠 글자 크기 상태 (기본값 24px)
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("fontSize") || "24")
  );

  // 🔥 로그인 유저 이름 표시
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

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

  // 🔥 상태 변경
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

  // 🔊 사운드
  const beep = new Audio("/beep.mp3");

  function enableAudio() {
    beep.play().catch(() => {});
    window.removeEventListener("click", enableAudio);
  }
  window.addEventListener("click", enableAudio);

  // 🔥 실시간 업데이트
  useEffect(() => {
    loadRequests();
    const channel = supabase
      .channel("requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        (payload) => {
          if (payload.eventType === "INSERT" && soundOn) {
            beep.currentTime = 0;
            beep.play().catch(() => {});
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

  // 🔥 로그아웃
  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "white",
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      {/* 🔥 상단 영역: 사용자 이름 + 로그아웃 버튼 + 글자 조절 + 사운드 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        {/* 👤 로그인 사용자 */}
        <div style={{ fontSize: fontSize, color: "#333" }}>
          👤 로그인: <strong>{userName}</strong>
        </div>

        <div>
          {/* 🔤 글자 크기 */}
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

          {/* 🔊 사운드 */}
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

          {/* 🚪 로그아웃 */}
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

              <td style={{ fontWeight: "bold", color: row.status === "confirmed" ? "red" : "black" }}>
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