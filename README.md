# bookerbob round: bid blind as a merchant, on your own key

A sealed-bid round on NEAR testnet that anyone can join from a browser. You are a merchant
with one item to sell. You choose your price. Until the bid deadline only a hash of it is on
chain, so nobody can read it, the people who wrote the contract included. After the deadline
everyone reveals, and the lowest revealed price wins the round's buyer.

Testnet only. dUSDC is a test token with no value. Nothing here can take or pay real money,
and nothing asks for a wallet, an email or a login. Built at NEAR HACKATHON.

The page: `https://hustle1hustle.github.io/bookerbob-round/`
The contract: [`bookerbob.testnet`](https://testnet.nearblocks.io/address/bookerbob.testnet)
on NEAR testnet; the round's state is read live from it, so the page shows what the chain says.

## Join: one visit

1. Choose your price (a slider or a number box; nothing is filled in for you) and, if you
   like, one line telling your agent how to bid. Only that line's hash is used: its first 16
   bytes become the first half of your bid's salt, which goes on chain with your reveal, so the
   instruction is fixed with the bid and only you can show what it said. Press "seal my bid".
   The page makes a throwaway NEAR testnet account for you through the public NEAR faucet,
   mints 100 test dUSDC, posts a 10 dUSDC bond (the bond is the approval: nobody lets you in)
   and sends the sealed bid. Each step links to its transaction; the transaction carries a
   hash, not your price.
2. That's it. Your reveal is signed in the page (a NEP-366 delegate action from your own key)
   and locked in time with [drand](https://drand.love) (tlock, the quicknet chain) until the
   bid deadline; the ciphertext goes on chain inside your bid. After the deadline our relayer
   opens it and sends it, paying the gas. It cannot read your price before the deadline, and it
   cannot change your price or salt after (both are signed by your key). The contract checks
   your price against your hash, and your price shows in the table.
3. If you want, come back between the bid deadline and the reveal deadline and press "reveal
   my bid" yourself; it does the same thing.

The key of the throwaway account is made in your browser and stays in that page's storage. It
never reaches us. "show my throwaway testnet key" prints it if you want to keep it. A private
tab forgets it when closed, and then the bid cannot be opened: use a normal tab.

## The series: 4 rounds, up to 4 sealed bids

Four rounds close on Nov 13 at 10:35, 13:35, 16:35 and 19:35 UTC; each has its own buyer line and
gives you its own cost. One bid per account per round; in one visit the page seals a bid in every
open round you price, each with its own reveal time-locked to that round's deadline. On chain the
lowest price takes the round's buyer. The game scores only sales a real seller would make: a bid
below its own cost is a sale at a loss and scores nothing (shown red), and the lowest bid at or
above its bidder's cost scores price minus cost; your series score is the total. (Scoring
tightened on 2026-11-13, after round 2; it applies to every round.) Our five agents bid in every round, each price chosen by a NEAR AI model drawn per round.

## Your cost, and the margin

Every bidder has a cost, shown on the page before you bid: 20.00 to 30.00 dUSDC, set by your
account name and the round: 20 + (the first two bytes of sha256("bookerbob/cost/v1|<round>|<account>"),
big-endian, mod 1001) / 100. Our agents' costs are in the round's `community.json` (`costs`). On chain the
lowest price still takes the buyer; the board scores the lowest bid at or above its bidder's cost,
price minus cost, and marks a bid below its own cost in red. Anyone can recompute every cost and margin from the round
id, the accounts and the revealed prices on chain.

On chain the lowest price takes the buyer. The round's score is the margin of the sale a real
seller would make: the lowest bid at or above its bidder's cost scores price minus cost; a bid
below its own cost scores nothing; everyone else scores 0, and the scoreboard ranks by score.

## What you can win and lose

- Win: your account is the round's lowest revealed price on chain. If you are named anywhere,
  it is as "a community member's account, on its own key, at its own price", and nothing more.
- Lose: nothing. You keep the bond.
- A bid never revealed: anyone may mark it within 24 hours of the reveal deadline, which takes
  5 dUSDC of your 10 dUSDC bond and bars the account for 24 hours. We never mark community bids.

## Who else is in the round

Our own merchant agents may bid in the same round, sealed like yours, and the table marks them
as ours. The founder may bid from this page too, as an account named `founder-...`; the table
marks it as the founder's bid and it is never counted as a community member. They cannot read your price before the deadline and you cannot read theirs.

## What this is not

Not commerce: there is no item, the buyer is a test buyer with synthetic facts, and the token
has no value. One bid per account per round. A revealed bid is pinned for its round, so a
price cannot be changed after the reveal.

## Files

`index.html` (the page), `round-tx.js` (builds, signs and sends the testnet transactions in
your browser, and signs the time-locked reveal), `vendor/noble-ed25519.js` (ed25519 signing, MIT,
Paul Miller), `vendor/tlock.min.js` (drand's tlock-js 0.9.0 with its dependencies, bundled
unmodified with esbuild; MIT and Apache-2.0), and `community.json` (which round is open; empty
until one is).
