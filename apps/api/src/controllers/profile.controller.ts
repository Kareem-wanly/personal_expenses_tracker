import { updateProfile } from "@masrufi/contracts/api/account";

import type { AppContext } from "../lib/context";
import { readBody } from "../lib/request";
import type { ProfileService } from "../services/profile.service";
import { profileView } from "../views/profile.view";

export const profileController = (profile: ProfileService) => ({
  show: (c: AppContext) => c.json({ data: profileView(c.get("user")) }),

  update: async (c: AppContext) => {
    const changes = await readBody(c, updateProfile);
    return c.json({ data: profileView(await profile.update(c.get("user"), changes)) });
  },
});
