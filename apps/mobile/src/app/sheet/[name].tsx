import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { type SheetName, sheets } from "@/features/sheets/registry";
import { Sheet } from "@/ui/sheet";

export default function SheetRoute() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const Content = sheets[name as SheetName];
  if (!Content) return <Redirect href="/" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return <Sheet onClosed={leave}>{(close) => <Content close={close} />}</Sheet>;
}
