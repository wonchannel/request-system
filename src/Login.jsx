import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [showNamePopup, setShowNamePopup] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // 🔥 로그인 처리
  const handleLogin = async () => {
    setErrorMsg("");

    const loginEmail = `${username}@intofood.local`;

    // 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setErrorMsg("아이디 또는 비밀번호가 잘못되었습니다.");
      return;
    }

    // 🔥 로그인 성공 → user 정보 불러오기 (딜레이 없이)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("로그인 오류가 발생했습니다.");
      return;
    }

    // 🔥 프로필 display_name 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    // 🔍 프로필 정보 확인 로그
    console.log("🟦 프로필 정보:", profile);

    // 🔥 display_name 없음 → 팝업 표시
    if (!profile?.display_name) {
      setShowNamePopup(true);
      return; // ❗ 여기서 끝 → App 리로드 금지
    }

    // 🔥 display_name 있음 → 대시보드로 이동
    window.location.href = "/";
  };

  // 🔥 display_name 저장
  const saveDisplayName = async () => {
    if (!displayName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // profiles 테이블 업데이트
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);

    if (error) {
      alert("이름 저장 중 오류가 발생했습니다.");
      return;
    }

    // 🔥 저장 후 바로 대시보드로 이동 (reload 필요 없음)
    window.location.href = "/";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>📦 요청 관리 시스템</h1>
      <p style={{ marginBottom: "40px", color: "#555" }}>
        2층 물품 요청을 실시간으로 관리하는 시스템
      </p>

      <input
        type="text"
        placeholder="아이디"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: "10px", padding: "10px", width: "250px" }}
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginBottom: "20px", padding: "10px", width: "250px" }}
      />

      <button
        onClick={handleLogin}
        style={{
          padding: "10px 20px",
          width: "250px",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        로그인
      </button>

      {errorMsg && (
        <p style={{ color: "red", marginTop: "20px" }}>{errorMsg}</p>
      )}

      {/* 🔥 이름 입력 팝업 */}
      {showNamePopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h3>사용자 이름 등록</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              요청자 이름으로 표시될 이름을 입력해주세요.
            </p>

            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                marginTop: "15px",
                padding: "10px",
                width: "100%",
                fontSize: "16px",
              }}
            />

            <button
              onClick={saveDisplayName}
              style={{
                marginTop: "20px",
                padding: "10px",
                width: "100%",
                backgroundColor: "#333",
                color: "white",
                border: "none",
                cursor: "pointer",
                borderRadius: "6px",
              }}
            >
              저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}