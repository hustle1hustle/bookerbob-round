// NEAR testnet transactions from a browser, for round.html: an ed25519 key made on this page,
// borsh by hand, sha256 from WebCrypto. The same bytes as relayer/near.mjs and the same bid
// commitment as sdk/merchant.mjs (scripts/round-tx.test.mjs holds them equal).
import { getPublicKeyAsync, signAsync } from "./vendor/noble-ed25519.js";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const hex = (u) => [...u].map((b) => b.toString(16).padStart(2, "0")).join("");
export const unhex = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
export function b58encode(u) {
  let n = BigInt("0x" + (hex(u) || "0")), s = "";
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  for (const b of u) { if (b !== 0) break; s = "1" + s; }
  return s;
}
export function b58decode(s) {
  let n = 0n;
  for (const ch of s) { const i = B58.indexOf(ch); if (i < 0) throw new Error("bad base58"); n = n * 58n + BigInt(i); }
  let h = n.toString(16); if (h.length % 2) h = "0" + h;
  const lead = [...s].findIndex((c) => c !== "1");
  const body = n === 0n ? new Uint8Array() : unhex(h);
  const out = new Uint8Array((lead < 0 ? s.length : lead) + body.length); out.set(body, out.length - body.length);
  return out;
}
const enc = new TextEncoder();
const cat = (...parts) => { const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
const u8 = (n) => Uint8Array.of(n);
const le = (n, bytes) => { const b = new Uint8Array(bytes); let v = BigInt(n); for (let i = 0; i < bytes; i++) { b[i] = Number(v & 0xffn); v >>= 8n; } return b; };
const str = (s) => { const b = enc.encode(s); return cat(le(b.length, 4), b); };
export const sha256 = async (u) => new Uint8Array(await crypto.subtle.digest("SHA-256", u));

export const randomHex = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));
export const publicKeyHex = async (seedHex) => hex(await getPublicKeyAsync(unhex(seedHex)));
export const nearPublicKey = (pubHex) => "ed25519:" + b58encode(unhex(pubHex));
/** The key as near-cli stores it: ed25519:<base58 of seed and public key>. */
export const nearSecretKey = (seedHex, pubHex) => "ed25519:" + b58encode(cat(unhex(seedHex), unhex(pubHex)));

/** One FunctionCall action: { method_name, args, gas, deposit }. */
const action = (a) => cat(u8(2), str(a.method_name), (() => { const b = enc.encode(JSON.stringify(a.args)); return cat(le(b.length, 4), b); })(), le(a.gas, 8), le(a.deposit, 16));
export const encodeTransaction = (t) => cat(str(t.signer_id), u8(0), unhex(t.public_key_hex), le(t.nonce, 8), str(t.receiver_id), t.block_hash, le(t.actions.length, 4), ...t.actions.map(action));
export async function signTransaction(t, seedHex) {
  const body = encodeTransaction(t);
  const hash = await sha256(body);
  const sig = await signAsync(hash, unhex(seedHex));
  return { signed: cat(body, u8(0), sig), hash: b58encode(hash) };
}

/** JSON exactly as serde writes a flat Schedule, and the sealed bid over it (sdk/merchant.mjs). */
export const flatSchedule = (price) => {
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0.01 || n > 10000) throw new Error("price: a number from 0.01 to 10000, like 33.5");
  return { base_price: String(Math.round(n * 1e6)), rules: [], cap_bps: 0 };
};
export const bidCommitment = async (account, schedule, saltHex) =>
  hex(await sha256(cat(enc.encode("bookerbob/bid/v0"), u8(0), enc.encode(account), u8(0), enc.encode(JSON.stringify(schedule)), unhex(saltHex))));

const RPCS = ["https://test.rpc.fastnear.com", "https://rpc.testnet.near.org"];
export async function rpc(method, params) {
  let err;
  for (const url of RPCS) {
    try {
      const r = await (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) })).json();
      if (r.result !== undefined && !r.result?.error) return r.result;
      err = new Error(r.result?.error ?? r.error?.cause?.name ?? JSON.stringify(r.error ?? r).slice(0, 160));
      if (r.error?.cause?.name === "UNKNOWN_ACCOUNT" || r.error?.cause?.name === "UNKNOWN_ACCESS_KEY") throw err;
    } catch (e) { err = e; if (/UNKNOWN_/.test(e.message)) break; }
  }
  throw err;
}
export async function view(account, method, args = {}) {
  const r = await rpc("query", { request_type: "call_function", finality: "final", account_id: account, method_name: method, args_base64: btoa(JSON.stringify(args)) });
  return JSON.parse(new TextDecoder().decode(new Uint8Array(r.result)));
}
export const accountExists = (id) => rpc("query", { request_type: "view_account", finality: "final", account_id: id }).then(() => true, (e) => { if (/UNKNOWN_ACCOUNT/.test(e.message)) return false; throw e; });

const TGAS = 10n ** 12n;
export const call = (method_name, args, deposit = 0n, tgas = 100n) => ({ method_name, args, gas: tgas * TGAS, deposit });
/** Sign and send; waits for FINAL. Returns { ok, hash, error }. */
export async function send({ signer_id, seedHex, pubHex, receiver_id, actions }) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const ak = await rpc("query", { request_type: "view_access_key", finality: "final", account_id: signer_id, public_key: nearPublicKey(pubHex) });
    const block = await rpc("block", { finality: "final" });
    const { signed, hash } = await signTransaction({ signer_id, public_key_hex: pubHex, nonce: BigInt(ak.nonce) + 1n + BigInt(attempt), receiver_id, block_hash: b58decode(block.header.hash), actions }, seedHex);
    let r;
    try { r = await rpc("send_tx", { signed_tx_base64: btoa(String.fromCharCode(...signed)), wait_until: "FINAL" }); }
    catch (e) { if (/nonce/i.test(e.message)) continue; return { ok: false, hash, error: e.message }; }
    const all = [r.transaction_outcome, ...r.receipts_outcome];
    const fail = all.map((o) => o.outcome.status.Failure).find(Boolean) ?? r.status.Failure;
    return { ok: !fail, hash: r.transaction?.hash ?? hash, error: fail ? JSON.stringify(fail).slice(0, 300) : null };
  }
  return { ok: false, error: "the nonce kept colliding, try again" };
}
