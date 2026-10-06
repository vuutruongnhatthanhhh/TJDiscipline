import { Suspense } from "react";
import { ConfirmEmailForm } from "./confirm-email-form";

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailForm />
    </Suspense>
  );
}
