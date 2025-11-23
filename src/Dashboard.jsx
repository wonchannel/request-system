import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  // 로그인 사용자 정보 가져오기
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) return;

      // 1) auth.users 의 id 사용
      const userId = user.id;

      // 2) profiles 테이블에서 display_name 가져오기
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

  // 🔥 로그아웃
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/"; // 로그인 페이지로 이동
  }

  return (
    <div style={{ padding: "20px" }}>

      {/* 🔥 상단: 로그인 정보 + 로그아웃 버튼 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "18px", color: "#333" }}>
          👤 로그인: <strong>{userName}</strong>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: "#555",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>

      <h1>실시간 요청 시스템</h1>

      <div style={{ marginTop: "20px" }}>
        <button
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            fontSize: "16px",
          }}
          onClick={() => navigate("/board")}
        >
          요청 목록 보기
        </button>

        <button
          style={{
            padding: "10px 20px",
            fontSize: "16px",
          }}
          onClick={() => navigate("/new")}
        >
          요청 등록하기
        </button>
      </div>
    </div>
  );
}
