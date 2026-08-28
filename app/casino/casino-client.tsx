"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./casino.module.css";

const RATES = { EUR: 1.08, USDC: 1, USD: 1 } as const;
const SYMBOLS = { EUR: "€", USDC: "", USD: "$" } as const;
const CURRENCIES = ["EUR", "USDC", "USD"] as const;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type Currency = (typeof CURRENCIES)[number];

export function CasinoMarks() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const handlePointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const centerX = event.clientX / window.innerWidth - 0.5;
        const centerY = event.clientY / window.innerHeight - 0.5;

        fieldRef.current
          ?.querySelectorAll<HTMLElement>("[data-depth]")
          .forEach((mark) => {
            const depth = Number(mark.dataset.depth ?? 20);
            mark.style.setProperty("--x", `${(centerX * depth).toFixed(1)}px`);
            mark.style.setProperty("--y", `${(centerY * depth).toFixed(1)}px`);
          });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div className={styles.chipField} ref={fieldRef} aria-hidden="true">
      <span className={`${styles.mark} ${styles.m1}`} data-depth="26">
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="27" cy="27" r="24" />
          <circle cx="27" cy="27" r="13" />
          <path d="M27 3v10M27 41v10M3 27h10M41 27h10" />
        </svg>
      </span>
      <span className={`${styles.mark} ${styles.m2}`} data-depth="-18">21+</span>
      <span className={`${styles.mark} ${styles.m3}`} data-depth="34">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="currentColor">
          <path d="M22 3 38 22 22 41 6 22Z" />
        </svg>
      </span>
      <span className={`${styles.mark} ${styles.m4}`} data-depth="-28">payout · instant</span>
      <span className={`${styles.mark} ${styles.m5}`} data-depth="22">
        <svg width="60" height="38" viewBox="0 0 60 38" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="2" y="2" width="56" height="34" />
          <circle cx="30" cy="19" r="8" />
        </svg>
      </span>
      <span className={`${styles.mark} ${styles.m6}`} data-depth="-24">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
          <path d="M20 36c-1-8-7-11-11-15a8 8 0 0 1 11-11 8 8 0 0 1 11 11c-4 4-10 7-11 15Z" />
        </svg>
      </span>
    </div>
  );
}

export function CurrencyConverter() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState("500");
  const parsedAmount = Number.parseFloat(amount);
  const safeAmount = Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0;
  const usd = safeAmount * RATES[currency];

  const values: Record<Currency, string> = {
    EUR: `€${NUMBER_FORMAT.format(usd / RATES.EUR)}`,
    USDC: `${NUMBER_FORMAT.format(usd / RATES.USDC)} usdc`,
    USD: `$${NUMBER_FORMAT.format(usd)}`,
  };

  return (
    <div className={styles.fxWrap}>
      <div className={styles.fxTabs} role="tablist" aria-label="input currency">
        {CURRENCIES.map((item) => (
          <button
            className={styles.fxTab}
            type="button"
            role="tab"
            aria-selected={currency === item}
            aria-controls="casino-currency-output"
            key={item}
            onClick={() => setCurrency(item)}
          >
            {item === "EUR" ? "€ eur" : item === "USD" ? "$ usd" : "usdc"}
          </button>
        ))}
      </div>

      <div className={styles.fxField}>
        <span className={styles.fxSym} aria-hidden="true">{SYMBOLS[currency]}</span>
        <label htmlFor="casino-fx-amount" className={styles.sr}>amount</label>
        <input
          id="casino-fx-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className={styles.fxOut} id="casino-currency-output" aria-live="polite">
        {CURRENCIES.map((item) => (
          <div className={styles.fxCell} data-active={currency === item} key={item}>
            <p className={styles.lab}>{item === "EUR" ? "euro" : item === "USD" ? "us dollar" : "usdc"}</p>
            <p className={styles.val}>{values[item]}</p>
          </div>
        ))}
      </div>

      <p className={styles.formNote}>indicative only. rates are placeholders until the live feed is wired.</p>
    </div>
  );
}

export function WaitlistForm() {
  const [message, setMessage] = useState("no spam. one note when your state opens.");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const firstName = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();

    if (!firstName || !EMAIL_PATTERN.test(email)) {
      setMessage("need a name and a real email. that’s it.");
      return;
    }

    try {
      const stored = JSON.parse(window.localStorage.getItem("mbc_waitlist") ?? "[]");
      const entries = Array.isArray(stored) ? stored : [];
      entries.push({ name: firstName, email, at: new Date().toISOString() });
      window.localStorage.setItem("mbc_waitlist", JSON.stringify(entries));
    } catch {
      // The confirmation remains useful when storage is unavailable.
    }

    setMessage(`you're on the list, ${firstName.toLowerCase()}. we'll write when your state opens.`);
    setSubmitted(true);
  };

  return (
    <>
      {!submitted ? (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <input type="text" name="name" placeholder="first name" autoComplete="given-name" required />
          <input type="email" name="email" placeholder="email" autoComplete="email" required />
          <button type="submit">join →</button>
        </form>
      ) : null}
      <p className={`${styles.formNote} ${submitted ? styles.success : ""}`} aria-live="polite">{message}</p>
    </>
  );
}
