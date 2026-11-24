import { useMutation } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useState } from "react";

import { ApiError, api } from "@/api/client";
import { queryClient } from "@/api/query-client";

type Options = { path: string; id: string | undefined; onDone: () => void };

const refreshEverything = () => queryClient.invalidateQueries();

/** Saves (new or existing) and deletes an entry, then refreshes what is on screen. */
export function useSave({ path, id, onDone }: Options) {
  // Kept for the whole form: sending again after a lost answer never duplicates.
  const [newId] = useState(randomUUID);
  const onSuccess = async () => {
    onDone();
    await refreshEverything();
  };

  const save = useMutation({
    mutationFn: (body: object) =>
      id ? api.put(`${path}/${id}`, body) : api.post(path, { ...body, id: newId }),
    onSuccess,
  });
  const remove = useMutation({ mutationFn: () => api.delete(`${path}/${id}`), onSuccess });

  const error = save.error ?? remove.error;
  return {
    save: save.mutate,
    remove: () => remove.mutate(),
    saving: save.isPending,
    removing: remove.isPending,
    error: error?.message,
    fields: error instanceof ApiError ? error.fields : {},
  };
}
