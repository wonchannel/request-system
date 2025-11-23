import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function NewRequest() {
  const [type, setType] = useState("일반");
  const [product, setProduct] = useState("");
  const [message, setMessage] = useState("");

  async function saveRequest() {
    // 🔥 현재 로그인한 사용자 정보 가져오기
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) {
      setMessage("로그인이 필요합니다.");
      return;
    }

    const userId = user.id;

    // 🔥 profiles 테이블에서 display_name 가져오기
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    const requesterName =
      profile?.display_name ||
      user.email?.split("@")[0] ||
      "알수없음";

    // 🔥 요청 저장 (qty 제거)
    const { error } = await supabase.from("requests").insert({
      type: type,
      item: product,
      requester: requesterName,
      status: "pending",
    });

    if (error) {
      setMessage("저장 실패: " + error.message);
    } else {
      setMessage("저장 완료!");
      setProduct("");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>요청 등록</h2>

      <div style={{ marginTop: "15px" }}>
        <label>요청 유형</label>
        <br />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ fontSize: "16px", padding: "5px" }}
        >
          <option value="긴급">🔴 긴급</option>
          <option value="일반">🟢 일반</option>
          <option value="소분">🟡 소분</option>
        </select>
      </div>

      <div style={{ marginTop: "15px" }}>
        <label>상품명</label>
        <br />
        <input
          type="text"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          style={{ fontSize: "20px", padding: "10px", width: "350px" }}
        />
      </div>

      <button
        onClick={saveRequest}
        style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
      >
        저장하기
      </button>

      {message && (
        <p style={{ marginTop: "15px", color: "blue" }}>{message}</p>
      )}
    </div>
  );
}