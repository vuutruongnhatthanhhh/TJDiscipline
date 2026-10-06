"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center ring-1 ring-border">
        <p className="text-3xl">📬</p>
        <h2 className="font-display text-lg font-bold text-text">Đã gửi email</h2>
        <p className="text-sm text-text-muted">
          Nếu <span className="font-bold text-text">{email}</span> tồn tại trong hệ thống, bạn sẽ nhận được link
          đặt lại mật khẩu trong ít phút.
        </p>
        <Link href="/login" className="text-sm font-bold text-primary-soft">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-bold text-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@email.com"
            required
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
        </button>
      </form>
      <Link href="/login" className="text-center text-sm text-text-muted">
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
