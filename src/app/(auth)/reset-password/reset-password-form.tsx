"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "verifying" | "ready" | "invalid" | "success";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function verify() {
      const supabase = createClient();

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        setStatus(error ? "invalid" : "ready");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      setStatus(session ? "ready" : "invalid");
    }

    verify();
    // Only needs to run once on mount with the URL's initial query params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError("Không thể đặt lại mật khẩu, vui lòng thử lại");
      return;
    }

    await supabase.auth.signOut();
    setStatus("success");
    setTimeout(() => router.push("/login"), 1800);
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center text-text-muted ring-1 ring-border">
        Đang xác thực link đặt lại mật khẩu...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center ring-1 ring-border">
        <h2 className="font-display text-lg font-bold text-text">Link không hợp lệ hoặc đã hết hạn</h2>
        <p className="text-sm text-text-muted">Vui lòng yêu cầu gửi lại link đặt lại mật khẩu mới.</p>
        <Link href="/forgot-password" className="text-sm font-bold text-primary-soft">
          Gửi lại link
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center ring-1 ring-border">
        <h2 className="font-display text-lg font-bold text-text">Đặt lại mật khẩu thành công</h2>
        <p className="text-sm text-text-muted">Đang chuyển đến trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
      {error && <div className="rounded-xl bg-sad/15 px-3 py-2 text-sm text-sad-soft">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-bold text-text">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              minLength={6}
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-bold text-text">
            Xác nhận mật khẩu mới
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
            className="rounded-xl bg-background px-4 py-3 text-base text-text ring-1 ring-border placeholder:text-text-faint"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-linear-to-br from-primary to-primary-dark py-3 font-display font-bold text-[#2a1a14] shadow-lg shadow-primary/30 disabled:opacity-60"
        >
          {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </div>
  );
}
