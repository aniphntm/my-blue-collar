/* @ds-bundle: {"format":4,"namespace":"MyBlue","components":[{"name":"Nav"},{"name":"Button"},{"name":"Eyebrow"},{"name":"SectionHead"},{"name":"RuleCard"},{"name":"PricingTier"},{"name":"Field"},{"name":"Checkbox"},{"name":"FaqItem"},{"name":"JobThreadRow"},{"name":"DarkPanel"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  function Eyebrow(p) {
    return h(p.as || 'span', {
      className: cx('mb-eyebrow', p.variant === 'rule' && 'mb-eyebrow--rule', 'mb-eyebrow--' + (p.tone || 'faint'), p.className)
    }, p.children);
  }

  function Button(p) {
    var variant = p.variant || 'primary';
    var props = {
      className: cx('mb-btn', 'mb-btn--' + variant, p.block && 'mb-btn--block', p.tone === 'accent' && 'mb-btn--accent', p.className),
      onClick: p.onClick
    };
    var arrow = p.arrow ? h('span', { className: 'mb-btn__arrow', 'aria-hidden': 'true' }, '→') : null;
    if (p.href) {
      props.href = p.href;
      return h('a', props, p.children, arrow);
    }
    props.type = p.type || 'button';
    props.disabled = p.disabled;
    return h('button', props, p.children, arrow);
  }

  function Field(p) {
    var id = p.id || p.name;
    var hintId = p.hint ? id + '-hint' : null;
    var errId = p.error ? id + '-err' : null;
    var common = {
      id: id,
      name: p.name,
      className: 'mb-field__control',
      required: p.required,
      disabled: p.disabled,
      autoComplete: p.autoComplete,
      onChange: p.onChange,
      'aria-invalid': p.error ? 'true' : undefined,
      'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined
    };
    var control;
    if (p.options) {
      control = h('select', Object.assign({}, common, { defaultValue: p.defaultValue === undefined ? '' : p.defaultValue }),
        h('option', { value: '', disabled: true }, p.placeholder || 'Choose one'),
        p.options.map(function (o) { return h('option', { key: o }, o); }));
    } else {
      control = h('input', Object.assign({}, common, { type: p.type || 'text', placeholder: p.placeholder, defaultValue: p.defaultValue }));
    }
    return h('div', { className: cx('mb-field', p.error && 'mb-field--error', p.className) },
      h('label', { className: 'mb-field__label', htmlFor: id }, p.label, p.required ? h('span', { className: 'mb-field__req' }, ' (required)') : null),
      control,
      p.hint ? h('span', { id: hintId, className: 'mb-field__hint' }, p.hint) : null,
      p.error ? h('span', { id: errId, className: 'mb-field__error', role: 'alert' }, p.error) : null);
  }

  function Checkbox(p) {
    return h('label', { className: cx('mb-check', p.className) },
      h('input', { type: 'checkbox', name: p.name, defaultChecked: p.defaultChecked, required: p.required, onChange: p.onChange }),
      h('span', null, p.children));
  }

  function SectionHead(p) {
    return h('div', { className: cx('mb-sechead', p.className) },
      p.index ? h(Eyebrow, { tone: p.eyebrowTone || 'faint' }, p.index) : null,
      h('h2', { className: 'mb-sechead__h' }, p.children),
      p.lede ? h('p', { className: 'mb-sechead__lede' }, p.lede) : null);
  }

  function RuleGrid(p) {
    return h('div', { className: cx('mb-grid', p.className) }, p.children);
  }

  function RuleCard(p) {
    return h('div', { className: cx('mb-card', p.className) },
      p.eyebrow ? h(Eyebrow, null, p.eyebrow) : null,
      h('h3', { className: 'mb-card__title' }, p.title),
      h('p', { className: 'mb-card__body' }, p.children),
      p.rule ? h(Eyebrow, { variant: 'rule', className: 'mb-card__rule' }, p.rule) : null);
  }

  function PricingTier(p) {
    return h('div', { className: cx('mb-card', p.className) },
      h('div', { className: 'mb-tier__head' },
        h('h3', { className: 'mb-card__title mb-tier__name' }, p.name),
        h(Eyebrow, { tone: p.highlighted ? 'accent' : 'faint' }, p.badge)),
      h('p', { className: 'mb-card__body' }, p.desc),
      h('ul', { className: 'mb-tier__list' }, (p.features || []).map(function (f) {
        return h('li', { key: f }, h('span', { className: 'mb-tier__arrow', 'aria-hidden': 'true' }, '→'), f);
      })),
      h('div', { className: 'mb-tier__cta' },
        h(Button, { variant: 'text', tone: p.highlighted ? 'accent' : null, href: p.href || '#join', arrow: true }, p.cta)));
  }

  function FaqItem(p) {
    var state = React.useState(!!p.defaultOpen);
    var open = p.open !== undefined ? p.open : state[0];
    var panelId = p.id || 'faq-' + String(p.question).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return h('div', { className: cx('mb-faq', p.className) },
      h('button', {
        type: 'button', className: 'mb-faq__q', 'aria-expanded': String(open), 'aria-controls': panelId,
        onClick: function () { if (p.onToggle) p.onToggle(!open); else state[1](!open); }
      }, p.question, h('span', { className: 'mb-faq__sign', 'aria-hidden': 'true' }, open ? '−' : '+')),
      h('p', { id: panelId, className: 'mb-faq__a', hidden: !open }, p.children));
  }

  function JobThreadList(p) {
    return h('ol', { className: cx('mb-thread-list', p.className) }, p.children);
  }

  function JobThreadRow(p) {
    var n = String(p.index || 1);
    if (n.length < 2) n = '0' + n;
    return h('li', { className: cx('mb-thread', 'mb-thread--' + (p.tone || 'blue'), p.className) },
      h('span', { className: 'mb-thread__dot', 'aria-hidden': 'true' }),
      h('div', { className: 'mb-thread__main' },
        h('div', { className: 'mb-thread__top' },
          h('div', null,
            h('p', { className: 'mb-thread__meta' }, 'JOB ' + n + ' · ' + p.trade),
            h('h3', { className: 'mb-thread__title' }, p.title)),
          h('span', { className: 'mb-thread__status' }, p.status)),
        h('div', { className: 'mb-thread__row' },
          h('p', null, h('span', { className: 'mb-thread__k' }, 'Crew'), ' · ', p.crew),
          h('p', { className: 'mb-thread__act' }, p.activity)),
        h('div', { className: 'mb-thread__tools' }, (p.tools || []).map(function (t) {
          return h('span', { key: t, className: 'mb-pill' }, t);
        }))));
  }

  function DarkPanel(p) {
    return h('div', { className: cx('mb-panel', p.className) },
      h('div', { className: 'mb-panel__head' },
        h(Eyebrow, { tone: 'panel-soft' }, p.title),
        p.tag ? h(Eyebrow, { tone: 'panel' }, p.tag) : null),
      h('ol', { className: 'mb-panel__steps' }, (p.steps || []).map(function (s) {
        return h('li', { key: s.n, className: 'mb-panel__step' },
          h('span', { className: 'mb-panel__n' }, s.n),
          h('span', null, h('span', { className: 'mb-panel__t' }, s.title), h('span', { className: 'mb-panel__note' }, s.note)));
      })));
  }

  function Nav(p) {
    return h('nav', { className: cx('mb-nav', p.className), 'aria-label': p.label || 'Primary' },
      p.skipTo ? h('a', { className: 'mb-skip', href: p.skipTo }, 'Skip to content') : null,
      h('div', { className: 'mb-nav__in' },
        h('a', { className: 'mb-nav__brand', href: p.homeHref || '#top' },
          p.logoSrc ? h('img', { src: p.logoSrc, alt: p.brand || 'MyBlue', height: 24 }) : h('span', null, p.brand || 'MyBlueTrade'),
          p.suffix ? h('span', { className: 'mb-nav__bar', 'aria-hidden': 'true' }, '|') : null,
          p.suffix ? h(Eyebrow, { tone: 'mut' }, p.suffix) : null),
        h('div', { className: 'mb-nav__links' }, (p.links || []).map(function (l) {
          return h('a', { key: l.href, className: 'mb-nav__link', href: l.href }, l.label);
        })),
        p.cta ? h('div', { className: 'mb-nav__cta' }, h(Button, { variant: 'secondary', href: p.cta.href, arrow: true }, p.cta.label)) : null));
  }

  window.MyBlue = {
    Nav: Nav, Button: Button, Eyebrow: Eyebrow, SectionHead: SectionHead, RuleGrid: RuleGrid, RuleCard: RuleCard,
    PricingTier: PricingTier, Field: Field, Checkbox: Checkbox, FaqItem: FaqItem, JobThreadList: JobThreadList,
    JobThreadRow: JobThreadRow, DarkPanel: DarkPanel
  };
})();
