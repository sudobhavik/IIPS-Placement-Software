// frontend/vite.config.ts - Already updated but ensure this is correct
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            const cookie = req.headers["cookie"] || req.headers["Cookie"];
            if (cookie) {
              proxyReq.setHeader("cookie", cookie);
            }
            // Critical: Forward content-type for multipart
            const contentType = req.headers["content-type"];
            if (contentType) {
              proxyReq.setHeader("content-type", contentType);
            }
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const cookies = proxyRes.headers["set-cookie"];
            if (cookies) {
              const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
              cookieArray.forEach((cookie) => res.appendHeader("set-cookie", cookie));
            }
          });
        },
      },
    },
  },
});
