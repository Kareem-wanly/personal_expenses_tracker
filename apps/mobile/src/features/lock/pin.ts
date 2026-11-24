import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto";

const ROUNDS = 200;

/** Slowed down on purpose, though the phone's secure storage is the real protection. */
async function derive(pin: string, salt: string): Promise<string> {
  let hash = `${salt}:${pin}`;
  for (let round = 0; round < ROUNDS; round++) {
    hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${hash}`);
  }
  return hash;
}

export async function hashPin(pin: string) {
  const salt = randomUUID();
  return { salt, hash: await derive(pin, salt) };
}

export const verifyPin = async (pin: string, { salt, hash }: { salt: string; hash: string }) =>
  (await derive(pin, salt)) === hash;
