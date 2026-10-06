"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { isSafeRedirectPath } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirectTo = isSafeRedirectPath(rawRedirect) ? rawRedirect : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      const message = error.message.toLowerCase();
      if (message.includes("confirm")) {
        setError("Vui lòng xác nhận email trước khi đăng nhập, kiểm tra hộp thư của bạn.");
      } else {
        setError("Email hoặc mật khẩu không đúng.");
      }
      return;
    }

    router.push(redirectTo || "/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      {error && (
        <div className="rounded-xl bg-sad/15 px-3 py-2 text-sm text-sad-soft">{error}</div>
      )}

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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-bold text-text">
              Mật khẩu
            </label>
            <Link href="/forgot-password" className="text-xs font-bold text-primary-soft">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          className={clsx(
            "w-full rounded-2xl py-3 font-display font-bold shadow-lg transition-all active:scale-[0.98]",
            "bg-linear-to-br from-primary to-primary-dark text-[#2a1a14] shadow-primary/30 disabled:opacity-60"
          )}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Chưa có tài khoản?{" "}
        <Link
          href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
          className="font-bold text-primary-soft"
        >
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
