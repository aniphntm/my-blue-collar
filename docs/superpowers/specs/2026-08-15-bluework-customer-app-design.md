# Bluework Customer App - Lean Design

## Intent

Bluework is a work-money account for blue-collar people. It should feel like a trusted job card and a simple place to see money, not a crypto wallet or a finance dashboard.

The customer should be able to answer three questions in seconds:

1. How much can I use today?
2. What money came in and what did I spend?
3. Can I pay for this job right now?

## Product stance

- Start on the useful number: **Available today**.
- Use familiar, direct language: "Pay supplier", "Money coming in", and "Job money".
- Do not lead with token symbols, wallet addresses, network names, charts, or collateral ratios.
- Crypto is an internal backing mechanism. It becomes visible only when it materially changes a customer's available amount or when the customer asks how their limit works.
- Every surface is testnet-only until the financial program, custody, compliance, and card-issuing rails are in place.

### Testnet asset scope

The first test build supports **ETH only** on Ethereum Sepolia. Do not add USDC, token selection, swaps, or price conversion in this phase. Customers see their test ETH balance only after connecting their own browser wallet; no seed phrases are ever requested.

## Information architecture

Use three primary tabs. Avoid a fourth tab until there is a proven customer need.

| Tab | Customer job | Contents |
| --- | --- | --- |
| **Home** | Know whether work can be paid for today | Available today, immediate actions, incoming money, and a compact explanation of any holds |
| **Activity** | Understand where money went | Plain-language ledger of card payments, payouts, incoming money, and pending items |
| **Card & account** | Control the card and keep the account working | Freeze card, spending limits, linked bank, support, security, and account details |

The tab bar should be fixed at the bottom on mobile. On desktop, it can be a compact left rail, but must preserve the same three destinations.

## Home

### Primary balance

The hero is a single, large amount:

> **Available today**  
> $7,383.08

Supporting copy:

> Ready to use for work and everyday spending.

Do not present the customer with an itemized collateral calculation by default. A small `How this works` link can expand to:

```text
Cash balance              $4,520.00
Protected balance         $3,325.00
Pending card payments      -$186.42
```

Call the crypto component **Protected balance**, never "collateral" on the main customer journey.

### Primary actions

Show no more than three actions, in this order:

1. **Pay supplier**
2. **Move money**
3. **Freeze card**

Each action should be large enough to use with a thumb, have a plain icon, and display a short next step. "Pay supplier" should open a simple dollar payment flow, not a crypto transfer form.

### Status

The Home surface can show one short operational status at a time:

- "$1,250 from Oak Street Remodel arrives tomorrow."
- "Your $186.42 payment at Home Depot is pending."
- "Your available amount changed. See why."

Avoid alerts that require action unless they genuinely block usage.

## Activity

Activity is a simple chronological money list, not a statement or a trading ledger.

```text
Today
Home Depot                 -$186.42     Pending
Oak Street Remodel        +$1,250.00    Arrives tomorrow

Yesterday
Metro Tool Rental           -$74.00     Paid
```

Rules:

- Start with Today, then Yesterday, then earlier dates.
- Give payments human merchant names and incoming funds job or customer names.
- Use a clear plain-English status: Pending, Paid, Coming tomorrow, or Reversed.
- Offer one filter button only: All, Paid, Incoming. Do not show advanced filters in the first release.

## Card & account

The card should be visible but not decorative. The most important control is one-tap **Freeze card** / **Unfreeze card**.

Group the rest into a short list:

- Card limits
- Linked bank account
- Get help
- Security
- Account details

The backing balance can be an optional section called **How your available amount works**. Wallet and network data should only appear behind that drill-in.

## Pay supplier flow

1. Choose a saved supplier or enter a new one.
2. Enter a dollar amount.
3. Select the payment method when more than one is supported.
4. Review a single confirmation screen: recipient, dollar amount, delivery timing, and remaining Available today amount.
5. Confirm.

The confirmation screen must state when a payment is a test action. Never represent a testnet action as a real payment.

## Visual direction

Use MyBluework's current visual language:

- Warm-paper base with charcoal type; one strong Bluework blue for action and selected states.
- The product uses familiar system typography with a sturdy, workmanlike weight. Large numerals should be the visual anchor.
- Cards have restrained borders and 8-12px rounded corners, not glossy gradients or crypto-style glow.
- White space should make the app feel calm, not sparse. Each screen should have one main action.
- Status uses color sparingly: blue for action, green for confirmed, amber for pending, red only for a real block.

## Guardrails

- The customer UI must clearly label the environment as **Testnet** during this phase.
- Do not expose, store, or prompt for wallet seed phrases.
- Plaid or another open-banking provider is used for bank linking and account data; it is not a card issuer.
- Real card usage needs an issuing partner, sponsor-bank arrangements, identity/compliance operations, custody decisions, and transaction risk controls before a production launch.

## First-release scope

Build only:

- Home balance and three actions
- A seeded Activity list with status states
- Freeze/unfreeze card interaction
- An account-linking placeholder for Plaid Sandbox
- A protected-balance explanation

Defer:

- Trading, swaps, yield, wallet management, token selection, and price charts
- Invoicing, expense reports, accounting sync, and multi-user approval workflows
- Production money movement, KYC, and issuance

## Success criteria

A customer who has never used crypto can open Home and confidently say:

> "I can spend this much today, I know what happened to my money, and I can pay for the next job."
