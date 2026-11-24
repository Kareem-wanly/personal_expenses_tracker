import type { UpdateProfile } from "@masrufi/contracts/api/account";

import type { Store } from "../models";
import type { User } from "../models/user.model";

export class ProfileService {
  constructor(private readonly store: Store) {}

  async update(user: User, changes: UpdateProfile): Promise<User> {
    if (Object.keys(changes).length === 0) return user;
    return this.store.users.update(user.id, changes);
  }
}
