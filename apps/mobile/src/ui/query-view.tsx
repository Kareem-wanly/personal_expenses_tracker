import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Empty, Failure, Loading } from "./states";

type Props<T> = { query: UseQueryResult<T, Error>; children: (data: T) => ReactNode };

/** Shows the data, or why there isn't any yet. Old data stays visible while refreshing. */
export function QueryView<T>({ query, children }: Props<T>) {
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.fetchStatus === "paused" && query.data === undefined) {
    return <Empty icon="📡" title="لا يوجد اتصال" hint="ستظهر هذه الصفحة عند عودة الاتصال." />;
  }
  if (query.error) return <Failure error={query.error} onRetry={() => void query.refetch()} />;
  return <Loading />;
}
