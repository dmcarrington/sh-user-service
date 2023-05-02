import { generatePrivateKey, getPublicKey } from "nostr-tools";

// Create a new pair of public and private keys for a new user
export async function generateKeys() {
  let sk = await generatePrivateKey(); // `sk` is a hex string
  let pk = await getPublicKey(sk); // `pk` is a hex string
  return { sk, pk };
}
