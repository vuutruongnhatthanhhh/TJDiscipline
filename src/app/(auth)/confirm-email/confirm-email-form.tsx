"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSafeRedirectPath } from "@/lib/utils";

type Status = "verifying" | "success" | "invalid";

export function ConfirmEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const rawRedirect = searchParams.get("redirect");
    const redirectTo = isSafeRedirectPath(rawRedirect) ? rawRedirect : "/";

    async function verify() {
      if (!tokenHash) {
        setStatus("invalid");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "signup" });
      if (error) {
        setStatus("invalid");
        return;
      }
      setStatus("success");
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1500);
    }

    verify();
    // Only needs to run once on mount with the URL's initial query params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center text-text-muted ring-1 ring-border">
        Đang xác nhận email...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center ring-1 ring-border">
        <h2 className="font-display text-lg font-bold text-text">Link không hợp lệ hoặc đã hết hạn</h2>
        <p className="text-sm text-text-muted">Vui lòng đăng ký lại hoặc đăng nhập nếu đã xác nhận trước đó.</p>
        <Link href="/register" className="text-sm font-bold text-primary-soft">
          Quay lại đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-10 text-center ring-1 ring-border">
      <p className="text-3xl">🎉</p>
      <h2 className="font-display text-lg font-bold text-text">Xác nhận thành công!</h2>
      <p className="text-sm text-text-muted">Đang đưa bạn vào trang chủ...</p>
    </div>
  );
}
