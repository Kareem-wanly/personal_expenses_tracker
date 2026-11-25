import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";

import { WRITE_KEY } from "./outbox";

export const KEEP_FOR = 7 * 24 * 60 * 60 * 1000;

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "masrufi-cache",
  throttleTime: 1000,
});

/** The last screens seen and the writes not sent yet survive closing the app. */
export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister,
  maxAge: KEEP_FOR,
  // Changing it throws away what an older version saved.
  buster: "1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.state.status === "success",
    shouldDehydrateMutation: (mutation) =>
      mutation.state.status === "pending" && mutation.options.mutationKey?.[0] === WRITE_KEY[0],
  },
};

export const forgetSavedData = () => persister.removeClient();
