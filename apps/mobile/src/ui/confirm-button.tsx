import { useState } from "react";

import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";

type Props = { label: string; title: string; disabled?: boolean; onConfirm: () => void };

/** A destructive button that asks first. */
export function ConfirmButton({ label, title, disabled, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Button label={label} kind="danger" disabled={disabled} onPress={() => setAsking(true)} />
      <ConfirmDialog
        open={asking}
        title={title}
        confirmLabel={label}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          onConfirm();
        }}
      />
    </>
  );
}
