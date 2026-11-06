// Types for window.MyBlue (documentation, not type-checked).
import type { ReactNode } from 'react';

export type EyebrowTone = 'faint' | 'mut' | 'accent' | 'panel' | 'panel-soft';
export interface EyebrowProps {
  /** Text colour tier. Use 'mut' on c-bg-alt, where 'faint' misses AA in light. Default 'faint'. */
  tone?: EyebrowTone;
  /** 'rule' is the lighter 'RULE ->' footer line (weight 400, .04em). */
  variant?: 'eyebrow' | 'rule';
  as?: string;
  className?: string;
  children: ReactNode;
}

export interface ButtonProps {
  /** 'primary' accent fill; 'secondary' outlined (nav Join); 'text' quiet link CTA. Default 'primary'. */
  variant?: 'primary' | 'secondary' | 'text';
  /** Accent colour for the 'text' variant (the highlighted tier). */
  tone?: 'accent' | null;
  /** Full-width, 12px vertical padding (form submit). */
  block?: boolean;
  /** Appends an aria-hidden right arrow. */
  arrow?: boolean;
  /** Renders an <a> when set, otherwise a <button>. */
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: (e: unknown) => void;
  className?: string;
  children: ReactNode;
}

export interface FieldProps {
  /** Visible label. Required: the source's placeholder-only fields are not reproduced. */
  label: string;
  name: string;
  id?: string;
  type?: string;
  /** Renders a <select> when set; the first option is a disabled placeholder. */
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  hint?: string;
  /** Error text, announced with role="alert" and linked by aria-describedby. */
  error?: string;
  onChange?: (e: unknown) => void;
  className?: string;
}

export interface CheckboxProps {
  name?: string;
  defaultChecked?: boolean;
  required?: boolean;
  onChange?: (e: unknown) => void;
  className?: string;
  children: ReactNode;
}

export interface SectionHeadProps {
  /** Eyebrow, e.g. "01 - The platform". */
  index?: string;
  /** Eyebrow tone; use 'mut' on c-bg-alt. */
  eyebrowTone?: EyebrowTone;
  /** Short lede in c-text-3. */
  lede?: string;
  className?: string;
  /** The h2 headline, usually two short lines. */
  children: ReactNode;
}

export interface RuleGridProps { className?: string; children: ReactNode; }

export interface RuleCardProps {
  eyebrow?: string;
  title: string;
  /** Uppercase footer line, e.g. "RULE -> one job, one thread". */
  rule?: string;
  className?: string;
  /** Body paragraph. */
  children: ReactNode;
}

export interface PricingTierProps {
  name: string;
  badge: string;
  desc: string;
  features: string[];
  cta: string;
  href?: string;
  /** Accent badge and CTA. One tier per grid. */
  highlighted?: boolean;
  className?: string;
}

export interface FaqItemProps {
  question: string;
  id?: string;
  defaultOpen?: boolean;
  /** Controlled mode: pass open and onToggle together. */
  open?: boolean;
  onToggle?: (next: boolean) => void;
  className?: string;
  /** Answer text. */
  children: ReactNode;
}

export interface JobThreadListProps { className?: string; children: ReactNode; }

export interface JobThreadRowProps {
  /** 1-based, rendered as "JOB 01". */
  index: number;
  trade: string;
  title: string;
  /** Status in words. The tone colour never carries it alone. */
  status: string;
  crew: string;
  activity: string;
  tools?: string[];
  /** Decorative marker colour. Default 'blue'. */
  tone?: 'blue' | 'amber' | 'emerald' | 'violet' | 'rose';
  className?: string;
}

export interface DarkPanelProps {
  /** Left eyebrow, e.g. "Job / Flow". */
  title: string;
  /** Right eyebrow, e.g. "Illustrative". */
  tag?: string;
  steps: { n: string; title: string; note: string }[];
  className?: string;
}

export interface NavProps {
  /** Product name text. Default "MyBlueTrade". */
  brand?: string;
  /** Mono label after the divider, e.g. "Trades". */
  suffix?: string;
  /** Optional wordmark image instead of text. Light backgrounds only. */
  logoSrc?: string;
  homeHref?: string;
  links?: { href: string; label: string }[];
  cta?: { href: string; label: string };
  /** Adds a skip link as the first focusable element, e.g. "#main". */
  skipTo?: string;
  label?: string;
  className?: string;
}

declare global {
  interface Window {
    MyBlue: {
      Nav: (p: NavProps) => ReactNode;
      Button: (p: ButtonProps) => ReactNode;
      Eyebrow: (p: EyebrowProps) => ReactNode;
      SectionHead: (p: SectionHeadProps) => ReactNode;
      RuleGrid: (p: RuleGridProps) => ReactNode;
      RuleCard: (p: RuleCardProps) => ReactNode;
      PricingTier: (p: PricingTierProps) => ReactNode;
      Field: (p: FieldProps) => ReactNode;
      Checkbox: (p: CheckboxProps) => ReactNode;
      FaqItem: (p: FaqItemProps) => ReactNode;
      JobThreadList: (p: JobThreadListProps) => ReactNode;
      JobThreadRow: (p: JobThreadRowProps) => ReactNode;
      DarkPanel: (p: DarkPanelProps) => ReactNode;
    };
  }
}
