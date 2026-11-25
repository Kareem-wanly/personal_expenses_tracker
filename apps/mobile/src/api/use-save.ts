import { useMutation } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useState } from "react";

import { haptics } from "@/motion/haptics";
import { showToast } from "@/ui/toast-store";

import { ApiError } from "./api-error";
import { queryClient } from "./query-client";
import { SAVED_ON_PHONE } from "./use-action";
import { write } from "./write";
import { isQueued } from "./write-policy";

type Options = { path: string; id: string | undefined; onDone: () => void };

const NO_FIELDS: Record<string, string[]> = {};

/** Saves a form (new or existing), then refreshes what is on screen. Works offline too. */
export function useSave({ path, id, onDone }: Options) {
  // Kept for the whole form: sending again after a lost answer never duplicates.
  const [newId] = useState(randomUUID);

  const save = useMutation({
    mutationFn: (body: object) =>
      id ? write.put(`${path}/${id}`, body) : write.post(path, { ...body, id: newId }),
    onSuccess: async (result) => {
      haptics.success();
      showToast(isQueued(result) ? SAVED_ON_PHONE : id ? "تم حفظ التعديلات" : "تمت الإضافة");
      onDone();
      await queryClient.invalidateQueries();
    },
    onError: haptics.error,
  });

  return {
    save: save.mutate,
    saving: save.isPending,
    error: save.error?.message,
    fields: save.error instanceof ApiError ? save.error.fields : NO_FIELDS,
  };
}
