import type { Metadata } from "next";
import { ApplicationForm } from "./application-form";
import styles from "./apply.module.css";

export const metadata: Metadata = {
  title: "Build with us — MyBlue Work",
  description: "Join MyBlue Work and build the company trades will run on.",
};

const tracks = [
  {
    number: "01",
    name: "Go to Market",
    detail: "Own measurable outcomes. Build trust, create customer value, and let opportunity follow impact.",
  },
  {
    number: "02",
    name: "Operations",
    detail: "Find recurring problems and continuously improve how the company runs.",
  },
  {
    number: "03",
    name: "Engineering",
    detail: "Build useful technology, scope clearly, and ship reliable systems.",
  },
];

const principles = [
  ["01", "Start with the work", "Learn from the people doing the job, then make the useful thing."],
  ["02", "Own the whole outcome", "Follow problems across functions until the customer feels the difference."],
  ["03", "Make quality obvious", "Clear language, fast software, and thoughtful service are the product."],
  ["04", "Keep the team sharp", "Use direct feedback, independent judgment, low ego, and a high bar."],
];

export default function ApplyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="https://mybluework.com" aria-label="MyBlue Work home">MYBLUE WORK</a>
        <nav className={styles.headerNav} aria-label="MyBlue Work">
          <a href="#what">WHAT</a>
          <a href="#how">HOW</a>
          <a href="#application">APPLY</a>
          <a href="/casino">PLAY</a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="apply-title">
        <p className={styles.kicker}>CAREERS / 2026</p>
        <h1 id="apply-title">BUILD THE COMPANY<br />TRADES WILL RUN ON.</h1>
        <div className={styles.heroFooter}>
          <p>Software and financial tools for the people who build, fix, and keep the world moving.</p>
          <a href="#tracks">EXPLORE THE WORK</a>
        </div>
      </section>

      <section className={styles.manifesto} id="what">
        <p className={styles.sectionLabel}>THE MANDATE</p>
        <p className={styles.manifestoText}>The trades deserve technology as ambitious as the work itself. We’re building practical tools that give every contractor more control and more time.</p>
        <p className={styles.manifestoNote}>Small team. Real stakes. Built close to the customer.</p>
      </section>

      <section className={styles.tracks} id="how" aria-labelledby="tracks-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>WHERE YOU FIT</p>
          <h2 id="tracks-title">THREE TRACKS.<br />ONE STANDARD.</h2>
        </div>
        <div className={styles.trackList}>
          {tracks.map((track) => (
            <article className={styles.track} key={track.number}>
              <span>{track.number}</span><h3>{track.name}</h3><p>{track.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>HOW WE WORK</p>
          <h2 id="principles-title">THE BAR IS<br />THE CULTURE.</h2>
        </div>
        <div className={styles.principleList}>
          {principles.map(([number, title, detail]) => (
            <article className={styles.principle} key={number}>
              <span>{number}</span><h3>{title}</h3><p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.application} id="application" aria-labelledby="application-title">
        <div className={styles.applicationIntro}>
          <p className={styles.sectionLabel}>OPEN APPLICATION</p>
          <h2 id="application-title">SHOW US HOW<br />YOU THINK.</h2>
          <p>Choose one track. Answer 10 short questions. Clear and direct is enough.</p>
        </div>
        <ApplicationForm />
      </section>

      <footer className={styles.footer}>
        <a href="https://mybluework.com">MYBLUE WORK</a>
        <p>BUILT FOR THE PEOPLE WHO DO THE WORK.</p>
        <p>© 2026</p>
      </footer>
    </main>
  );
}
