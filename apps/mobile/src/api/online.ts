import { onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { Platform } from "react-native";

/** Phones report their connection; browsers already tell React Query themselves. */
export function watchConnection() {
  if (Platform.OS === "web") return;
  onlineManager.setEventListener((setOnline) => {
    const update = ({ isConnected, isInternetReachable }: Network.NetworkState) =>
      setOnline(isConnected !== false && isInternetReachable !== false);
    void Network.getNetworkStateAsync().then(update);
    const subscription = Network.addNetworkStateListener(update);
    return () => subscription.remove();
  });
}
