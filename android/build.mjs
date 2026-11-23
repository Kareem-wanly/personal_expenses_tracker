// Builds the Android app (a Trusted Web Activity around the live site) and
// copies the signed APK to public/download/masrufi.apk.
//
//   node android/build.mjs            # regenerate the project + build
//
// Needs (outside the repo, see android/README.md):
//   %USERPROFILE%/.masrufi-android/{jdk-17*, sdk, bubblewrap, signing}
// The signing key never enters the repo. Losing it means the APK can't be
// updated in place (users would have to uninstall first), so back it up.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const TOOLS = process.env.MASRUFI_ANDROID_HOME ?? join(homedir(), ".masrufi-android");
const JDK = join(TOOLS, readdirSync(TOOLS).find((d) => d.startsWith("jdk-17")));
const SDK = join(TOOLS, "sdk");
const BUILD_TOOLS = join(SDK, "build-tools", readdirSync(join(SDK, "build-tools")).sort().at(-1));
const KEYSTORE = join(TOOLS, "signing", "masrufi.keystore");
const PASSWORD_FILE = join(TOOLS, "signing", "keystore-password.txt");
const PROJECT = join(TOOLS, "project"); // generated Gradle project (throwaway)
const OUT = join(ROOT, "public", "download", "masrufi.apk");

const { TwaGenerator, TwaManifest, ConsoleLog } = createRequire(join(TOOLS, "bubblewrap", "package.json"))(
  "@bubblewrap/core",
);

const config = JSON.parse(readFileSync(join(HERE, "twa-manifest.json"), "utf8"));
config.signingKey = { path: KEYSTORE, alias: "masrufi" };
const manifest = new TwaManifest(config);
const errors = manifest.validate();
if (errors) throw new Error(errors);

console.log("› Generating the Android project…");
mkdirSync(PROJECT, { recursive: true });
await new TwaGenerator().createTwaProject(PROJECT, manifest, new ConsoleLog("twa"));
writeFileSync(join(PROJECT, "local.properties"), `sdk.dir=${SDK.replaceAll("\\", "\\\\")}\n`);

// Keep enableSiteSettingsShortcut on: when false, Bubblewrap drops
// ManageDataLauncherActivity from the manifest but LauncherActivity still
// toggles it → "Component class … does not exist" crash on every launch.
if (!manifest.enableSiteSettingsShortcut) throw new Error("enableSiteSettingsShortcut must stay true (crashes on launch)");

const env = { ...process.env, JAVA_HOME: JDK, ANDROID_HOME: SDK, ANDROID_SDK_ROOT: SDK };
const run = (file, args, cwd = PROJECT) => execFileSync(file, args, { cwd, env, stdio: "inherit", shell: true });

console.log("› Building with Gradle…");
run(`"${join(PROJECT, process.platform === "win32" ? "gradlew.bat" : "gradlew")}"`, ["assembleRelease"]);

const unsigned = join(PROJECT, "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk");
const aligned = join(PROJECT, "app-release-aligned.apk");
const exe = (name) => join(BUILD_TOOLS, process.platform === "win32" ? `${name}${name === "apksigner" ? ".bat" : ".exe"}` : name);

console.log("› Aligning and signing…");
run(exe("zipalign"), ["-v", "-f", "-p", "4", `"${unsigned}"`, `"${aligned}"`]);
mkdirSync(dirname(OUT), { recursive: true });
run(exe("apksigner"), [
  "sign",
  "--ks", `"${KEYSTORE}"`,
  "--ks-key-alias", "masrufi",
  "--v4-signing-enabled", "false", // no .idsig file next to the download
  "--ks-pass", `file:"${PASSWORD_FILE}"`,
  "--out", `"${OUT}"`,
  `"${aligned}"`,
]);
run(exe("apksigner"), ["verify", "--print-certs", `"${OUT}"`]);
if (!existsSync(OUT)) throw new Error("APK was not produced");
console.log(`✓ ${OUT}`);
