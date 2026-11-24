import type { RegisterDevice } from "@masrufi/contracts/api/devices";

import { ruleBroken } from "../../lib/errors";
import type { Store } from "../../models";
import type { User } from "../../models/user.model";
import type { NotifierService, PushReport } from "./notifier.service";

const TEST_MESSAGE = {
  title: "🔔 الإشعارات تعمل",
  body: "هكذا ستصلك تنبيهات الميزانية والتذكير اليومي والملخص الشهري.",
  url: "/settings",
  tag: "test",
};

/** Why a test message didn't arrive, so the device can repair itself. */
export type TestResult = "sent" | "not-registered" | "expired" | "key-mismatch" | "push-error";

function explain(report: PushReport): TestResult {
  if (report.sent > 0) return "sent";
  if (report.devices === 0) return "not-registered";
  if (report.expired > 0) return "expired";
  const wrongKeys = report.refused.some((status) => [400, 401, 403].includes(status));
  return wrongKeys ? "key-mismatch" : "push-error";
}

export class DeviceService {
  constructor(
    private readonly store: Store,
    private readonly notifier: NotifierService,
  ) {}

  async register(user: User, { endpoint, keys }: RegisterDevice, userAgent: string | null) {
    this.assertEnabled();
    await this.store.devices.register({ userId: user.id, kind: "web", endpoint, ...keys, userAgent });
  }

  async remove(user: User, endpoint: string): Promise<void> {
    await this.store.devices.remove(user.id, endpoint);
  }

  async test(user: User, endpoint: string): Promise<TestResult> {
    this.assertEnabled();
    return explain(await this.notifier.send(user.id, TEST_MESSAGE, endpoint));
  }

  private assertEnabled() {
    if (!this.notifier.enabled) throw ruleBroken("الإشعارات غير مفعّلة على الخادم", "endpoint");
  }
}
