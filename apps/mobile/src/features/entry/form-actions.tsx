import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme/theme";
import { Button } from "@/ui/button";
import { Text } from "@/ui/text";

type Props = {
  isNew: boolean;
  canSave: boolean;
  onSave: () => void;
  saving: boolean;
  onDelete: () => void;
  removing: boolean;
  error?: string;
};

/** Save, and delete with a second tap to confirm. */
export function FormActions({ isNew, canSave, onSave, saving, onDelete, removing, error }: Props) {
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={styles.actions}>
      {error ? <Text color="negative" accessibilityRole="alert">{error}</Text> : null}
      <Button label={isNew ? "إضافة" : "حفظ"} onPress={onSave} busy={saving} disabled={!canSave || removing} />
      {isNew ? null : (
        <Button
          label={confirming ? "اضغط مرة أخرى لتأكيد الحذف" : "حذف"}
          kind="danger"
          busy={removing}
          disabled={saving}
          onPress={confirming ? onDelete : () => setConfirming(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ actions: { gap: spacing.sm } });
