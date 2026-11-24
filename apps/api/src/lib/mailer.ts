import { createTransport } from "nodemailer";

import type { Env } from "../config/env";

export type Mail = { to: string; subject: string; text: string };

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** Any mail service that offers SMTP. */
class SmtpMailer implements Mailer {
  private readonly transport;

  constructor(
    url: string,
    private readonly from: string,
  ) {
    this.transport = createTransport(url);
  }

  async send(mail: Mail) {
    await this.transport.sendMail({ from: this.from, ...mail });
  }
}

/** Development: prints the mail. */
class ConsoleMailer implements Mailer {
  async send(mail: Mail) {
    console.log(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
  }
}

/** Production without SMTP: fails loudly, and never logs reset links. */
class UnconfiguredMailer implements Mailer {
  async send(): Promise<void> {
    throw new Error("No mail service is configured (SMTP_URL).");
  }
}

export function createMailer(env: Env): Mailer {
  if (env.SMTP_URL && env.MAIL_FROM) return new SmtpMailer(env.SMTP_URL, env.MAIL_FROM);
  return env.NODE_ENV === "production" ? new UnconfiguredMailer() : new ConsoleMailer();
}
