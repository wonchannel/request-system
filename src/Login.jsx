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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setErrorMsg("아이디 또는 비밀번호가 잘못되었습니다.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("로그인 오류가 발생했습니다.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    console.log("🟦 프로필 정보:", profile);

    if (!profile?.display_name) {
      setShowNamePopup(true);
      return;
    }

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

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);

    if (error) {
      alert("이름 저장 중 오류가 발생했습니다.");
      return;
    }

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

      {/* 🔥 회사 로고 + 회사명 (요청한 부분) */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <img
          src="/icons/logo.png"
          alt="회사 로고"
          style={{
            width: "160px",
            marginBottom: "20px",
            objectFit: "contain",
          }}
        />

        <p style={{ marginTop: "10px", fontSize: "20px", color: "#333" }}>
          이든타운에프앤비(주)
        </p>
      </div>

      {/* 🔐 로그인 폼 */}
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