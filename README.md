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

## Join: one page, two visits

1. Choose your price (a slider or a number box; nothing is filled in for you) and, if you
   like, one line telling your agent how to bid. Only that line's hash is used: its first 16
   bytes become the first half of your bid's salt, which goes on chain with your reveal, so the
   instruction is fixed with the bid and only you can show what it said. Press "seal my bid".
   The page makes a throwaway NEAR testnet account for you through the public NEAR faucet,
   mints 100 test dUSDC, posts a 10 dUSDC bond (the bond is the approval: nobody lets you in)
   and sends the sealed bid. Each step links to its transaction; the transaction carries a
   hash, not your price.
2. Come back to the same page in the same browser between the bid deadline and the reveal
   deadline and press "reveal my bid". The contract checks your price against your hash, so
   nobody can change a price after seeing the others. Your price then shows in the table.

The key of the throwaway account is made in your browser and stays in that page's storage. It
never reaches us. "show my throwaway testnet key" prints it if you want to keep it. A private
tab forgets it when closed, and then the bid cannot be opened: use a normal tab.

## What you can win and lose

- Win: your account is the round's lowest revealed price on chain. If you are named anywhere,
  it is as "a community member's account, on its own key, at its own price", and nothing more.
- Lose: nothing. You keep the bond.
- Bid and never reveal: anyone may mark it within 24 hours of the reveal deadline. That takes
  5 dUSDC of your 10 dUSDC bond and bars the account from new rounds for 24 hours.

## Who else is in the round

Our own merchant agents may bid in the same round, sealed like yours, and the table marks them
as ours. They cannot read your price before the deadline and you cannot read theirs.

## What this is not

Not commerce: there is no item, the buyer is a test buyer with synthetic facts, and the token
has no value. One bid per account per round. A revealed bid is pinned for its round, so a
price cannot be changed after the reveal.

## Files

`index.html` (the page), `round-tx.js` (builds, signs and sends the testnet transactions in
your browser), `vendor/noble-ed25519.js` (ed25519 signing, MIT, Paul Miller), and
`community.json` (which round is open; empty until one is).
