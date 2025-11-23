import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function RequestBoard() {
  const [list, setList] = useState([]);
  const [soundOn, setSoundOn] = useState(
    localStorage.getItem("soundOn") !== "off"
  );

  // 🔥 로그인 사용자 이름
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  // 🔊 오디오 객체 (한 번만 생성)
  const beepRef = useRef(null);

  useEffect(() => {
    // 오디오 객체 한 번만 생성
    beepRef.current = new Audio("/beep.mp3");
  }, []);

  // 🔊 브라우저 오디오 사용 허용 (초기 1회 클릭)
  useEffect(() => {
    function enableAudio() {
      beepRef.current?.play().catch(() => {});
      window.removeEventListener("click", enableAudio);
    }

    window.addEventListener("click", enableAudio);
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  // 🔐 로그인 사용자 정보 로드
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const userId = user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      const name =
        profile?.display_name ||
        user.email?.split("@")[0] ||
        "사용자";

      setUserName(name);
    }

    loadUser();
  }, []);

  // 🔥 정렬: 긴급 > 일반 > 소분
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
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("requests").delete().eq("id", id);
  }

  // 🔥 실시간 감시 + INSERT 시 사운드
  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("requests-realtime-fixed") // 충돌 방지용 이름
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        (payload) => {
          // ⛔ INSERT(새 요청)일 때만 비프음
          if (payload.eventType === "INSERT" && soundOn) {
            const beep = beepRef.current;
            if (beep) {
              beep.currentTime = 0;
              beep.play().catch(() => {});
            }
          }

          loadRequests();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [soundOn]);

  // 🔊 사운드 토글
  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    localStorage.setItem("soundOn", newState ? "on" : "off");
  };

  // 🔐 로그아웃
  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <div style={{ padding: "30px" }}>

      {/* 로그인 사용자 & 로그아웃 */}
      <div
        style={{
          fontSize: "20px",
          marginBottom: "10px",
          color: "#444",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>👤 로그인: <strong>{userName}</strong></div>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            fontSize: "16px",
            background: "#d9534f",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>

      {/* 제목 + 사운드 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "34px" }}>📋 요청 현황판</h2>

        <button
          onClick={toggleSound}
          style={{
            padding: "12px 20px",
            fontSize: "20px",
            borderRadius: "10px",
            background: soundOn ? "#4caf50" : "#888",
            color: "#fff",
            border: "none",
          }}
        >
          🔊 사운드 {soundOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* 테이블 */}
      <table
        border="1"
        cellPadding="15"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginTop: "20px",
          fontSize: "22px",
          textAlign: "center",
        }}
      >
        <thead>
          <tr style={{ height: "60px" }}>
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
            <tr key={row.id} style={{ height: "70px" }}>
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
                      padding: "12px 18px",
                      fontSize: "20px",
                    }}
                  >
                    확인
                  </button>
                ) : (
                  <button
                    onClick={() => setPending(row.id)}
                    style={{
                      marginRight: "10px",
                      padding: "12px 18px",
                      fontSize: "20px",
                    }}
                  >
                    수정
                  </button>
                )}

                <button
                  onClick={() => deleteRequest(row.id)}
                  style={{
                    padding: "12px 18px",
                    fontSize: "20px",
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