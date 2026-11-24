import { createSerwistRoute } from "@serwist/turbopack";

// Revision for the offline fallback: changes on every deploy (Vercel/Netlify
// expose the commit SHA), falls back to a random value locally.
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.COMMIT_REF ??
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    // iOS fetches only the launch image for its own screen; don't make every
    // install download all of them (~1 MB).
    globIgnores: ["public/splash/**"],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
