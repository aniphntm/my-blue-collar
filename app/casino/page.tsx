import type { Metadata } from "next";

import { CasinoMarks, CurrencyConverter, WaitlistForm } from "./casino-client";
import styles from "./casino.module.css";

export const metadata: Metadata = {
  title: "MyBlueCasino — clock out. cash in. repeat.",
  description: "Games, odds, and payouts built for the people who build, fix, and keep the world moving. From the MyBlue family.",
  alternates: { canonical: "https://mybluework.com/casino" },
  openGraph: {
    title: "MyBlueCasino — clock out. cash in. repeat.",
    description: "Games, odds, and payouts built for the people who build, fix, and keep the world moving.",
    type: "website",
    url: "https://mybluework.com/casino",
  },
};

export default function CasinoPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/casino">MyBlueCasino</a>
        <nav className={styles.nav} aria-label="Casino landing navigation">
          <a className={styles.navLink} href="#floor">the floor</a>
          <a className={styles.navLink} href="#house">the house</a>
          <a className={styles.navLink} href="#stakes">stakes</a>
          <a className={styles.headerCta} href="#join">join →</a>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <CasinoMarks />
          <div className={styles.heroHeading}>
            <p className={styles.kicker}>myblue · casino</p>
            <h1>clock out.<br />cash in. <span className={styles.accent}>repeat.</span></h1>
          </div>
          <div className={styles.heroFooter}>
            <p>the house has always been built for somebody else. this one is built for the people who build, fix, and keep the world moving.</p>
            <a href="#floor">explore the floor →</a>
          </div>
        </section>

        <section className={styles.manifesto}>
          <p className={styles.kicker}>the mandate</p>
          <p className={styles.manifestoText}>you already trade your time for someone else’s money. when you’re off the clock, the odds should finally sit on your side of the table.</p>
          <p className={styles.manifestoNote}>small team. real stakes. built close to the floor.</p>
        </section>

        <section className={styles.section} id="floor">
          <p className={styles.sectionLabel}>where you sit</p>
          <div className={styles.body}>
            <h2>three tables. one standard.</h2>
            <div className={styles.rows}>
              <article className={styles.row}>
                <span className={styles.num}>01</span>
                <h3>the floor</h3>
                <p>slots, blackjack, and poker that load on a job-site signal and don’t eat your data. one hand between calls, or a full night after the truck’s parked.</p>
              </article>
              <article className={styles.row}>
                <span className={styles.num}>02</span>
                <h3>the odds</h3>
                <p>every table publishes its real numbers before you sit down. no buried math, no mystery hold. you read the spec sheet the same way you read a plan set.</p>
              </article>
              <article className={styles.row}>
                <span className={styles.num}>03</span>
                <h3>the payout</h3>
                <p>winnings land in the same account your invoices do. no seven-day hold, no “pending review” on money that’s already yours.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section} id="house">
          <p className={styles.sectionLabel}>how we deal</p>
          <div className={styles.body}>
            <h2>the bar is the house.</h2>
            <div className={styles.rows}>
              <article className={styles.row}>
                <span className={styles.num}>01</span>
                <h3>the odds are posted</h3>
                <p>if we won’t print the number on the table, we won’t run the table. transparency isn’t a feature here, it’s the license.</p>
              </article>
              <article className={styles.row}>
                <span className={styles.num}>02</span>
                <h3>the money moves</h3>
                <p>deposits clear fast and withdrawals clear faster. we make our money on the game, not on the float.</p>
              </article>
              <article className={styles.row}>
                <span className={styles.num}>03</span>
                <h3>limits you set</h3>
                <p>deposit caps, session timers, and a cool-off switch that works the first time you press it. set them once, we hold the line.</p>
              </article>
              <article className={styles.row}>
                <span className={styles.num}>04</span>
                <h3>we know the crew</h3>
                <p>we come from the trades and we build close to the customer. if it wouldn’t hold up on a job site, it doesn’t ship.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section} id="stakes">
          <p className={styles.sectionLabel}>stakes</p>
          <div className={styles.body}>
            <h2>free to sit. free to stay.</h2>
            <div className={styles.tiers}>
              <article className={styles.tier}>
                <h3>the seat</h3>
                <p className={styles.price}>free — now</p>
                <p>full floor access, posted odds, and your limits from day one. no minimum, no monthly, no rake on your first hand.</p>
              </article>
              <article className={styles.tier}>
                <h3>high table</h3>
                <p className={styles.price}>coming soon</p>
                <p>bigger limits, private rooms, and priority payout rails for the crews who play regular.</p>
              </article>
              <article className={styles.tier}>
                <h3>the crew</h3>
                <p className={styles.price}>coming soon</p>
                <p>bring the whole shop. shared tables, crew leaderboards, and pots that settle friday like everything else.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section} id="money">
          <p className={styles.sectionLabel}>the input</p>
          <div className={styles.body}>
            <h2>euro, usdc, or dollar.</h2>
            <p className={styles.intro}>put a number in, see it three ways. we settle in whichever one you got paid in — no conversion games between you and your money.</p>
            <CurrencyConverter />
          </div>
        </section>

        <section className={styles.join} id="join">
          <p className={styles.kicker}>get on the list</p>
          <h2>talk to us,<br />but not too much.</h2>
          <p className={styles.sub}>two fields and a trade. that’s the whole application. we’ll open seats by region as licensing clears.</p>
          <WaitlistForm />
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footRow}>
          <a href="/casino">© 2026 MyBlueCasino</a>
          <span className={styles.tag}>built for the people who do the work.</span>
        </div>
        <p className={styles.legal}>
          <b>21+ only.</b> play responsibly. gambling involves risk and you should never wager more than you can afford to lose. availability depends on your jurisdiction and on licensing in your state. this page collects waitlist interest only — no wagering, no deposits, and no real-money play are offered here. if gambling stops being a game, call 1-800-GAMBLER for free, confidential help, 24/7.
        </p>
      </footer>
    </div>
  );
}
