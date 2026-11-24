import { Field } from "@/ui/field";

type Props = { value: string; onChangeText: (value: string) => void };

export function EmailField(props: Props) {
  return (
    <Field
      {...props}
      label="البريد"
      placeholder="you@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
      autoCorrect={false}
    />
  );
}

type PasswordProps = Props & { label?: string; isNew?: boolean; onSubmitEditing?: () => void };

export function PasswordField({ label = "كلمة المرور", isNew = false, ...props }: PasswordProps) {
  return (
    <Field
      {...props}
      label={label}
      secureTextEntry
      autoCapitalize="none"
      autoComplete={isNew ? "new-password" : "current-password"}
    />
  );
}
