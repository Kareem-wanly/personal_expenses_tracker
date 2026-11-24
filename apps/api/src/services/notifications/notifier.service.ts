import type { PushPayload } from "@masrufi/core/notifications";

import type { PushSender } from "../../lib/push-sender";
import type { Store } from "../../models";
import type { Device } from "../../models/device.model";

export type PushReport = { devices: number; sent: number; expired: number; refused: number[] };

/** Sends to every device of a user and forgets the ones that are gone. */
export class NotifierService {
  constructor(
    private readonly store: Store,
    private readonly sender: PushSender | null,
  ) {}

  get enabled(): boolean {
    return this.sender !== null;
  }

  async send(userId: string, payload: PushPayload, endpoint?: string): Promise<PushReport> {
    const all = this.sender ? await this.store.devices.list(userId) : [];
    const devices = endpoint ? all.filter((device) => device.endpoint === endpoint) : all;
    const report: PushReport = { devices: devices.length, sent: 0, expired: 0, refused: [] };
    const expired: Device[] = [];

    await Promise.all(
      devices.map(async (device) => {
        const delivery = await this.sender!.send(device, payload);
        if (delivery.result === "sent") report.sent++;
        else if (delivery.result === "expired") expired.push(device);
        else report.refused.push(delivery.status);
      }),
    );
    report.expired = expired.length;
    await this.store.devices.removeExpired(userId, expired.map((device) => device.id));
    return report;
  }
}
