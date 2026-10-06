"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isSafeRedirectPath } from "@/lib/utils";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirectTo = isSafeRedirectPath(rawRedirect) ? rawRedirect : null;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        redirect: redirectTo,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Đăng ký thất bại, vui lòng thử lại");
      return;
    }

    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center ring-1 ring-border">
        <p className="text-3xl">📬</p>
        <h2 className="font-display text-lg font-bold text-text">Đã gửi email xác nhận</h2>
        <p className="text-sm text-text-muted">
          Chúng tôi đã gửi link xác nhận đến <span className="font-bold text-text">{sentTo}</span>. Mở email và
          nhấn vào link để bắt đầu nuôi thú cưng, cây cảnh của bạn.
        </p>
        <Link href="/login" className="text-sm font-bold text-primary-soft">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      {error && <div className="rounded-xl bg-sad/15 px-3 py-2 text-sm text-sad-soft">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-bold text-text">
            Họ và tên
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
          />
        </div>
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-bold text-text">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              className="w-full rounded-xl bg-background px-4 py-3 pr-12 text-base text-text ring-1 ring-border placeholder:text-text-faint"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-faint"
              tabIndex={-1}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Đã có tài khoản?{" "}
        <Link
          href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
          className="font-bold text-primary-soft"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
