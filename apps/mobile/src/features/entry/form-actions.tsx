import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Collapse } from "@/motion/collapse";
import { spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { Text } from "@/ui/text";

type Props = {
  isNew: boolean;
  canSave: boolean;
  onSave: () => void;
  saving: boolean;
  onDelete: () => void;
  error?: string;
};

export function FormActions({ isNew, canSave, onSave, saving, onDelete, error }: Props) {
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={styles.actions}>
      <Collapse open={!!error}>
        <Text color="negative" accessibilityRole="alert">{error}</Text>
      </Collapse>
      <Button label={isNew ? "إضافة" : "حفظ التعديلات"} onPress={onSave} busy={saving} disabled={!canSave} />
      {isNew ? null : <Button label="حذف" kind="danger" disabled={saving} onPress={() => setConfirming(true)} />}
      <ConfirmDialog
        open={confirming}
        title="حذف هذه العملية؟"
        confirmLabel="حذف"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onDelete();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ actions: { gap: spacing.xs } });
