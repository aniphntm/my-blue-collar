/* Progressive enhancement: native anchors, tabs and disclosures remain usable. */
(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 680px)');
  const reduced = () => preference.matches || root.dataset.motion === 'reduced';
  const token = name => getComputedStyle(root).getPropertyValue(`--motion-${name}`).trim();
  const duration = name => parseFloat(token(name)) || 0;
  const running = new Map();
  const settlements = new Set();
  function animate(element, frames, name = 'ui', delay = 0, finish = () => {}) {
    running.get(element)?.cancel();
    if (reduced() || !element.animate) { finish(); return; }
    const animation = element.animate(frames, { duration: duration(name), delay, easing: token('ease-out'), fill: 'both' });
    running.set(element, animation);
    animation.onfinish = () => {
      if (running.get(element) !== animation) return;
      running.delete(element);
      finish();
      animation.cancel();
    };
  }
  function settle() {
    running.forEach(animation => animation.cancel());
    running.clear();
    settlements.forEach(finish => finish());
  }
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('main-nav');
  const menu = document.getElementById('menu-toggle');
  function measureHeader() { root.style.setProperty('--header-offset', `${header.getBoundingClientRect().height}px`); }
  function setMenu(open, restore = false) {
    nav.hidden = small.matches && !open;
    menu.setAttribute('aria-expanded', String(open && small.matches));
    menu.textContent = open && small.matches ? 'Close −' : 'Menu +';
    measureHeader();
    if (open && small.matches) animate(nav, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }]);
    else { running.get(nav)?.cancel(); running.delete(nav); }
    if (restore) menu.focus();
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target) && menu.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  small.addEventListener('change', () => {
    const focusWasInNav = nav.contains(document.activeElement);
    setMenu(false);
    if (small.matches && focusWasInNav) menu.focus();
  });
  new ResizeObserver(measureHeader).observe(header);
  root.dataset.motionReady = '';
  setMenu(false);

  function navigate(hash, updateHistory = true) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)) || 'main'; } catch { return false; }
    const target = document.getElementById(id);
    if (!target) return false;
    setMenu(false);
    if (target.matches('details')) {
      target.dispatchEvent(new Event('motion:open'));
      target.open = true;
    }
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'start' });
    if (updateHistory && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (navigate(link.getAttribute('href'))) event.preventDefault();
  });
  window.addEventListener('popstate', () => navigate(location.hash || '#main', false));
  if (location.hash) requestAnimationFrame(() => navigate(location.hash, false));
  let queued = false;
  function updateNavigation() {
    queued = false;
    header.dataset.scrolled = String(scrollY > 8);
    const line = header.getBoundingClientRect().bottom + 80;
    let active = '';
    // The nested token section precedes ethos visually; do not use nav order.
    const sections = [...nav.querySelectorAll('a')].map(link => ({ link, target: document.querySelector(link.hash) }));
    sections.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
    for (const { link, target } of sections) {
      const rect = target.getBoundingClientRect();
      if (rect.top <= line && rect.bottom > header.getBoundingClientRect().bottom) active = link.hash;
    }
    sections.forEach(({ link }) => active === link.hash ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
  }
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateNavigation); } }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();

  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector('summary');
    const body = document.createElement('div');
    body.className = 'motion-details-body';
    [...details.children].filter(child => child !== summary).forEach(child => body.append(child));
    details.append(body);
    let desired = details.open;
    const finish = () => { details.open = desired; details.style.height = ''; details.style.overflow = ''; body.inert = !desired; };
    settlements.add(finish);
    details.addEventListener('motion:open', () => {
      running.get(details)?.cancel();
      running.delete(details);
      desired = true;
      finish();
    });
    summary.addEventListener('click', event => {
      event.preventDefault();
      if (!running.has(details)) desired = details.open;
      const start = details.getBoundingClientRect().height;
      running.get(details)?.cancel();
      desired = !desired;
      details.open = true;
      details.style.height = '';
      body.inert = !desired;
      const end = desired ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).borderTopWidth) + parseFloat(getComputedStyle(details).borderBottomWidth) + parseFloat(getComputedStyle(details).paddingTop) + parseFloat(getComputedStyle(details).paddingBottom);
      details.style.overflow = 'clip';
      animate(details, [{ height: `${start}px` }, { height: `${end}px` }], 'ui', 0, finish);
    });
    details.addEventListener('toggle', () => { if (!running.has(details)) { desired = details.open; body.inert = !desired; } });
  });
  document.querySelectorAll('[data-network]').forEach(tab => {
    tab.addEventListener('click', () => animate(document.getElementById('token-network-panel'), [{ opacity: .7, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 'fast'));
    tab.addEventListener('keydown', event => {
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) animate(document.getElementById('token-network-panel'), [{ opacity: .7 }, { opacity: 1 }], 'fast');
    });
  });
  document.querySelectorAll('[role="status"]').forEach(status => new MutationObserver(() => {
    if (status.textContent) animate(status, [{ opacity: .6, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 'fast');
  }).observe(status, { childList: true, characterData: true, subtree: true }));

  const hero = [...document.querySelectorAll('.hero-grid > div > .eyebrow, .hero-grid h1, .hero-copy, .hero-grid > div > .primary, .hero-grid > div > .hero-token-link, .token-showcase')];
  function entrance() {
    hero.forEach((element, index) => animate(element, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 'enter', Math.min(index, 3) * duration('stagger')));
  }
  entrance();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target, [{ opacity: .5, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 'enter');
      observer.unobserve(entry.target);
    }), { threshold: .12 });
    document.querySelectorAll('.belief h2, .section-intro, .building-head, .closing > div:first-child').forEach(element => observer.observe(element));
  }
  preference.addEventListener('change', () => { if (reduced()) settle(); });
  document.getElementById('replay-motion')?.addEventListener('click', entrance);
  const reduceButton = document.getElementById('reduce-motion');
  function syncReduce() {
    if (!reduceButton) return;
    reduceButton.setAttribute('aria-pressed', String(reduced()));
    reduceButton.textContent = preference.matches ? 'Reduced motion · system' : reduced() ? 'Reduced motion · on' : 'Reduced motion · off';
    reduceButton.disabled = preference.matches;
  }
  reduceButton?.addEventListener('click', () => { root.dataset.motion = root.dataset.motion === 'reduced' ? 'full' : 'reduced'; if (reduced()) settle(); syncReduce(); });
  preference.addEventListener('change', syncReduce);
  syncReduce();
})();
