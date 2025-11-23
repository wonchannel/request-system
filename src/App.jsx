import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Login from "./Login";
import Dashboard from "./Dashboard";
import NewRequest from "./NewRequest";
import RequestBoard from "./RequestBoard";
import RequestBoardFull from "./RequestBoardFull";
import Logout from "./Logout";

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);  // 🔥 role 저장
  const [loading, setLoading] = useState(true);

  // 🔥 로그인 & role 불러오기
  useEffect(() => {
    async function loadSessionAndRole() {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      setSession(currentSession);

      if (currentSession?.user) {
        // 🔥 profiles 테이블에서 role 가져오기
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentSession.user.id)
          .single();

        setRole(profile?.role || "normal");
      }

      setLoading(false);
    }

    loadSessionAndRole();

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setRole(null);
      }
    });
  }, []);

  // 아직 role 정보 불러오는 중이면 화면 깜빡임 방지
  if (loading) {
    return <div style={{ padding: "20px" }}>로딩중...</div>;
  }

  // 아직 로그인 안됐으면 Login
  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* 🔥 role별 자동 분기 */}
        <Route
          path="/"
          element={
            role === "floor1" || role === "floor2"
              ? <Navigate to="/full" />
              : <Dashboard />
          }
        />

        {/* 🔥 1층/2층은 로그인하면 무조건 Full 화면 */}
        <Route
          path="/full"
          element={<RequestBoardFull />}
        />

        {/* 일반 기능 */}
        <Route path="/new" element={<NewRequest />} />
        <Route path="/board" element={<RequestBoard />} />

        {/* 로그아웃 */}
        <Route path="/logout" element={<Logout />} />

        {/* 기타 → / */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;