import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-6xl">🙈</p>
      <p className="font-display text-5xl font-bold text-primary-soft">404</p>
      <h1 className="font-display text-xl font-bold text-text">Không tìm thấy trang này</h1>
      <p className="max-w-xs text-sm text-text-muted">
        Trang bạn tìm không tồn tại, hoặc đường dẫn đã bị gõ sai mất rồi.
      </p>
      <Link
        href="/"
        className="mt-3 rounded-full bg-linear-to-br from-primary to-primary-dark px-6 py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30"
      >
        ☀️ Về trang chủ
      </Link>
    </div>
  );
}
