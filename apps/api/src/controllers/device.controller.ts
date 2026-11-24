import { deviceEndpoint, registerDevice } from "@masrufi/contracts/api/devices";

import type { AppContext } from "../lib/context";
import { readBody } from "../lib/request";
import type { DeviceService } from "../services/notifications/device.service";

export const deviceController = (devices: DeviceService) => ({
  register: async (c: AppContext) => {
    const input = await readBody(c, registerDevice);
    const userAgent = c.req.header("user-agent")?.slice(0, 300) ?? null;
    await devices.register(c.get("user"), input, userAgent);
    return c.body(null, 204);
  },

  remove: async (c: AppContext) => {
    const { endpoint } = await readBody(c, deviceEndpoint);
    await devices.remove(c.get("user"), endpoint);
    return c.body(null, 204);
  },

  test: async (c: AppContext) => {
    const { endpoint } = await readBody(c, deviceEndpoint);
    return c.json({ data: { result: await devices.test(c.get("user"), endpoint) } });
  },
});
