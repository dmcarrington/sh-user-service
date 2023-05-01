import { generatePrivateKey, getPublicKey } from "nostr-tools";

export async function generateKeys() {
  let sk = await generatePrivateKey(); // `sk` is a hex string
  let pk = await getPublicKey(sk); // `pk` is a hex string
  return { sk, pk };
}
