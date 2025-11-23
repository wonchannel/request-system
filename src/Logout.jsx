import { useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function Logout() {
  useEffect(() => {
    async function doLogout() {
      await supabase.auth.signOut();
      window.location.href = "/";  // 로그아웃 후 로그인 페이지로 이동
    }
    doLogout();
  }, []);

  return <p>로그아웃 중...</p>;
}
