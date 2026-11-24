import { Redirect } from "expo-router";

/** The tab only opens /entry; this is for a typed address. */
export default function Add() {
  return <Redirect href="/entry" />;
}
