export type Mail = { to: string; subject: string; text: string };

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** Development: prints the mail. */
export class ConsoleMailer implements Mailer {
  async send(mail: Mail) {
    console.log(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
  }
}

/** Production until a mail service is chosen: fails loudly and never logs reset links. */
export class UnconfiguredMailer implements Mailer {
  async send(): Promise<void> {
    throw new Error("No mail service is configured.");
  }
}
