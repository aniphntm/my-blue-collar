# Apple Pay Funding — Low-Fidelity Plan

**Date:** 2026-08-15  
**Status:** Product direction; not approval to move production funds

## Decision

Use Apple Pay as the first card-facing funding experience. Do not add Tap to Pay, NFC merchant acceptance, automatic stablecoin conversion, crypto-backed balances, or withdrawable yield in this phase.

Apple Pay is only the customer authorization surface. An approved payment processor remains responsible for card processing, merchant underwriting, settlement, disputes, refunds, and supported-country rules.

## Customer promise

- The customer can choose Apple Pay from the funding screen.
- The amount, input currency, fees, and expected availability are shown before authorization.
- A successful Apple Pay sheet means the payment was authorized, not finally settled.
- New funds appear as **Pending** until a verified server-side provider event makes them available.
- Rewards, if displayed before the later crypto phase, are promotional credits and are not described as deposits, interest, yield, cash, or crypto-backed assets.

## Low-fidelity flow

```text
Pay
  └─ Add money
       ├─ Enter amount
       ├─ Review amount, currency, fee, and timing
       ├─ Continue with Apple Pay
       ├─ Native Apple Pay authorization sheet
       └─ Result
            ├─ Pending — authorized; settlement in progress
            ├─ Available — provider confirms approved availability event
            ├─ Failed — authorization or processing failed
            ├─ Reversed — authorization expired or was reversed
            └─ Refunded / disputed — compensating ledger entry posted
```

## Screens

### 1. Add money

- Amount input in the customer's supported input currency
- Apple Pay shown as the only card-facing option in this phase
- Minimum/maximum and fees stated before continuation
- Continue button disabled until the server validates the amount and account state

### 2. Review

- Funding amount
- Processing fee, if any
- Total Apple Pay charge
- Destination shown as the customer's Bluework balance
- Expected pending/availability timing
- Plain disclosure that card payments can be reversed or disputed

### 3. Apple Pay authorization

- Present the platform-native Apple Pay sheet
- Use the processor's supported Apple Pay integration; the app never receives raw card credentials
- Do not treat client completion as settlement or update the available balance from the device callback

### 4. Status

- **Pending:** “Apple Pay authorized. We’re waiting for the payment to settle.”
- **Available:** “Your funds are available.”
- **Failed:** show the provider-safe reason and a retry action when appropriate
- **Reversed/refunded/disputed:** explain the balance adjustment and link to support

## Minimal technical boundary

The mobile or web client requests a server-created payment session and presents the processor-supported Apple Pay UI. All privileged actions stay server-side.

Proposed boundaries:

| Boundary | Responsibility |
| --- | --- |
| `POST /api/funding/apple-pay/session` | Authenticate the customer, validate limits/currency, create an idempotent provider payment session |
| `GET /api/funding/:fundingId` | Return the customer's canonical funding status |
| `POST /api/webhooks/payments` | Verify provider signatures, deduplicate events, and advance the funding/ledger state |

Persist at minimum:

- integer amount and currency
- customer and funding IDs
- unique client idempotency key
- provider payment reference
- `created`, `requires_action`, `authorized`, `pending`, `available`, `failed`, `reversed`, `refunded`, or `disputed` state
- append-only ledger entries and verified provider-event IDs
- timestamps and a redacted audit trail

Only the server can choose the processor account, destination account, environment, currency policy, fee policy, and ledger result.

## Rewards in this phase

If rewards are included in the first release:

- Calculate them from eligible settled activity only.
- Record them in a separate promotional-credit ledger.
- Keep them non-withdrawable and non-transferable.
- Do not promise a fixed return or claim that reserves back the rewards.
- Reverse associated promotional credits when an eligible payment is refunded, reversed, or successfully disputed.

The later crypto-backed phase may introduce input-currency display, FX execution, stablecoin reserves, and a disclosed variable rewards rate only after the relevant custody, conversion, reserve, and regulatory programs are approved.

## Explicit exclusions

- No Tap to Pay or phone-as-merchant acceptance
- No customer funding their account by tapping a physical card on the phone
- No self-payment, circular funding, or cash-out simulation
- No raw card-number collection
- No client-authoritative balances or settlement state
- No automatic purchase, custody, transfer, or redemption of crypto assets
- No claim that the feature is jurisdiction-neutral

## Launch gates

Sandbox UI can be built immediately with provider test credentials. Real transactions remain disabled until:

- the Apple Pay merchant identity/domain and processor integration are configured
- the processor has activated the business and approved the funding use case
- the destination and flow of funds are contractually approved
- KYC/CIP, sanctions, fraud, card-network, dispute, refund, limits, support, privacy, and record-retention controls are approved
- signed webhooks, idempotency, reconciliation, monitoring, and ledger tests pass
- Apple review requirements and customer disclosures are complete

## Acceptance criteria

- The product presents Apple Pay and never labels it Tap to Pay.
- Canceling or failing the Apple Pay sheet creates no available balance.
- Retrying the same request cannot create a second charge.
- Client callbacks cannot mark money available.
- Verified, deduplicated provider events drive every financial state transition.
- Refunds, reversals, and disputes create compensating entries; history is never rewritten.
- Test and production environments, credentials, webhooks, and ledger namespaces remain isolated.
