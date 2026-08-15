"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const fieldClasses =
  "w-full rounded-card border border-border bg-surface px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";
const selectClasses = `${fieldClasses} text-ink-2`;

const UNIQUE_VIOLATION = "23505";

type Status = "idle" | "submitting" | "success" | "duplicate" | "error";

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const formData = new FormData(event.currentTarget);
    const { error } = await supabase.from("leads").insert({
      name: formData.get("name"),
      business: formData.get("business"),
      email: formData.get("email"),
      phone: formData.get("phone") || null,
      trade: formData.get("trade"),
      employees: formData.get("employees"),
      location: formData.get("location"),
      jobs_per_month: formData.get("jobsPerMonth"),
      current_software: formData.get("currentSoftware") || null,
      subcontractor_interest: formData.get("subcontractorInterest") === "on",
    });

    if (!error) {
      setStatus("success");
    } else if (error.code === UNIQUE_VIOLATION) {
      setStatus("duplicate");
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-7 shadow-[0_18px_50px_-24px_#14130e40]">
      {status === "success" || status === "duplicate" ? (
        <div className="py-16">
          <span className="eyebrow text-accent">
            {status === "duplicate" ? "Already on the list" : "You're on the list"}
          </span>
          <p className="mt-5 text-2xl leading-snug font-medium tracking-[-0.02em] text-balance">
            {status === "duplicate"
              ? "We already have you."
              : "That's it. We have you."}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
            We&apos;ll write when a beta spot opens near you.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Your name"
              required
              className={fieldClasses}
            />
            <input
              name="business"
              placeholder="Business name"
              required
              className={fieldClasses}
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className={fieldClasses}
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone (optional)"
            className={fieldClasses}
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <select name="trade" defaultValue="" required className={selectClasses}>
              <option value="" disabled>
                Primary trade
              </option>
              <option>Electrical</option>
              <option>HVAC</option>
              <option>Plumbing</option>
              <option>Roofing</option>
              <option>Flooring</option>
              <option>Landscaping</option>
              <option>Painting</option>
              <option>Remodeling</option>
              <option>Other</option>
            </select>
            <select
              name="employees"
              defaultValue=""
              required
              className={selectClasses}
            >
              <option value="" disabled>
                Employees
              </option>
              <option>Just me</option>
              <option>2–5</option>
              <option>6–15</option>
              <option>16–30</option>
              <option>30+</option>
            </select>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              name="location"
              placeholder="City / ZIP"
              required
              className={fieldClasses}
            />
            <select
              name="jobsPerMonth"
              defaultValue=""
              required
              className={selectClasses}
            >
              <option value="" disabled>
                Jobs per month
              </option>
              <option>1–10</option>
              <option>11–30</option>
              <option>31–75</option>
              <option>75+</option>
            </select>
          </div>
          <input
            name="currentSoftware"
            placeholder="Current software (if any)"
            className={fieldClasses}
          />

          <label className="mt-2 flex items-center gap-2.5 text-[13px] text-mut">
            <input
              type="checkbox"
              name="subcontractorInterest"
              className="h-4 w-4 accent-[var(--c-accent)]"
            />
            Interested in taking overflow work as a local sub
          </label>

          {status === "error" ? (
            <p className="text-[13px] text-red-600 dark:text-red-400">
              Something went wrong. Please try again.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-3 rounded-card bg-accent py-3 text-[15px] font-medium text-on-accent transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Join the waitlist →"}
          </button>
        </form>
      )}
    </div>
  );
}
