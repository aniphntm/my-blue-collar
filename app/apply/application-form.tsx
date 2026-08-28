"use client";

import { FormEvent, useState } from "react";
import {
  APPLICATION_QUESTION_SET_VERSION,
  APPLICATION_TRACK_ENTRIES,
  APPLICATION_TRACKS,
  type ApplicationTrack,
} from "@/lib/application-questions";
import styles from "./apply.module.css";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ApplicationForm() {
  const [startedAt] = useState(() => new Date().toISOString());
  const [track, setTrack] = useState<ApplicationTrack | "">("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("submitting");
    setMessage("");

    try {
      const form = new FormData(formElement);
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          location: form.get("location"),
          track,
          questionSetVersion: APPLICATION_QUESTION_SET_VERSION,
          answers,
          linkedInUrl: form.get("linkedInUrl"),
          portfolioUrl: form.get("portfolioUrl"),
          companyWebsite: form.get("companyWebsite"),
          faxNumber: form.get("faxNumber"),
          consentToContact: form.get("consentToContact") === "on",
          startedAt,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setMessage(result.error ?? "We could not submit your application. Please try again.");
        return;
      }

      formElement.reset();
      setTrack("");
      setAnswers({});
      setState("success");
      setMessage("Application received. We’ll be in touch if there’s a fit.");
    } catch {
      setState("error");
      setMessage("We could not reach the application service. Check your connection and try again.");
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="companyWebsite">Company website</label>
        <input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
        <label htmlFor="faxNumber">Fax number</label>
        <input id="faxNumber" name="faxNumber" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className={styles.fieldset}>
        <legend>About you</legend>
        <div className={styles.twoColumns}>
          <Field label="Full name" name="fullName" required autoComplete="name" />
          <Field label="Email" name="email" type="email" required autoComplete="email" spellCheck={false} />
          <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
          <Field label="Location" name="location" autoComplete="address-level2" />
          <Field label="LinkedIn URL" name="linkedInUrl" type="url" inputMode="url" />
          <Field label="Portfolio or work URL" name="portfolioUrl" type="url" inputMode="url" />
        </div>
        <label className={styles.field} htmlFor="track">
          Track
          <select
            id="track"
            name="track"
            value={track}
            onChange={(event) => {
              setTrack(event.target.value as ApplicationTrack);
              setAnswers({});
              setState("idle");
              setMessage("");
            }}
            required
          >
            <option value="" disabled>Choose a track</option>
            {APPLICATION_TRACK_ENTRIES.map(([value, option]) => (
              <option key={value} value={value}>{option.label}</option>
            ))}
          </select>
        </label>
      </fieldset>

      {track ? (
        <fieldset className={styles.fieldset}>
          <legend>{APPLICATION_TRACKS[track].label} questions <span>10 required</span></legend>
          <div className={styles.promptGrid}>
            {APPLICATION_TRACKS[track].questions.map((question, index) => {
              const value = answers[question.id] ?? "";
              const id = `answer-${question.id}`;
              return (
                <label className={styles.prompt} htmlFor={id} key={question.id}>
                  <span className={styles.promptTop}>
                    <span>{String(index + 1).padStart(2, "0")} / {question.prompt}</span>
                    <span className={styles.count}>{value.length}/240</span>
                  </span>
                  <textarea
                    id={id}
                    name={id}
                    rows={3}
                    value={value}
                    onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    aria-describedby={`${id}-count`}
                    required
                    minLength={2}
                    maxLength={240}
                  />
                  <span className={styles.srOnly} id={`${id}-count`} aria-live="polite">{value.length} of 240 characters used.</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <p className={styles.trackPrompt}>Choose a track to see its 10 questions.</p>
      )}

      <label className={styles.consent}>
        <input type="checkbox" name="consentToContact" required />
        <span>I consent to MyBlue Work storing my application and contacting me about relevant roles.</span>
      </label>

      <div className={styles.submitRow}>
        <button type="submit" disabled={state === "submitting" || state === "success"}>
          {state === "submitting" ? "SENDING…" : state === "success" ? "SENT" : "SEND APPLICATION"}
        </button>
        <p className={`${styles.status} ${state === "error" ? styles.statusError : ""}`} role="status" aria-live="polite">{message}</p>
      </div>
    </form>
  );
}

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className={styles.field} htmlFor={name}>
      {label}
      <input id={name} name={name} {...props} />
    </label>
  );
}
