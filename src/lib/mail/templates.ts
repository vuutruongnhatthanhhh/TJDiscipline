import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import { getTransporter, MAIL_FROM } from "@/lib/mailer";

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

async function renderTemplate(name: string, context: Record<string, unknown>) {
  let template = templateCache.get(name);
  if (!template) {
    const filePath = path.join(process.cwd(), "emails", `${name}.hbs`);
    const source = await fs.readFile(filePath, "utf-8");
    template = Handlebars.compile(source);
    templateCache.set(name, template);
  }
  return template(context);
}

export async function sendConfirmEmail(to: string, name: string, confirmUrl: string) {
  const subject = "Xác nhận tài khoản TJDiscipline";
  const html = await renderTemplate("confirm-email", {
    subject,
    preheader: "Xác nhận email để bắt đầu nuôi thú cưng và cây cảnh của bạn.",
    name,
    confirmUrl,
    year: new Date().getFullYear(),
  });

  await getTransporter().sendMail({ from: MAIL_FROM, to, subject, html });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const subject = "Đặt lại mật khẩu tài khoản TJDiscipline";
  const html = await renderTemplate("reset-password", {
    subject,
    preheader: "Yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
    name,
    resetUrl,
    year: new Date().getFullYear(),
  });

  await getTransporter().sendMail({ from: MAIL_FROM, to, subject, html });
}
