import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 📌 public 폴더를 그대로 배포하도록 지정
  publicDir: "public",

  build: {
    outDir: "dist",
  },

  server: {
    host: true,
    open: false,
  }
});