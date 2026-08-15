"use client";

import { memo, useCallback, useState } from "react";
import { faqs, type Faq as FaqData } from "@/lib/content";

type FaqItemProps = {
  faq: FaqData;
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
};

const FaqItem = memo(function FaqItem({
  faq,
  index,
  isOpen,
  onToggle,
}: FaqItemProps) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => onToggle(index)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-medium tracking-[-0.02em]"
      >
        {faq.q}
        <span className="font-mono text-sm text-faint">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? (
        <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-ink-3">
          {faq.a}
        </p>
      ) : null}
    </div>
  );
});

export function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = useCallback((index: number) => {
    setOpenIndex((current) => (current === index ? -1 : index));
  }, []);

  return (
    <section id="faq" className="border-b border-border-soft">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <span className="eyebrow text-faint">Questions, answered</span>
        <div className="mt-10 border-t border-border">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
