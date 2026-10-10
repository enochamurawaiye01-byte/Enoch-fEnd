(function () {
  'use strict';

  const site = window.MIC_PUBLIC_SITE;
  if (!site) {
    console.error('Public site configuration is missing.');
    return;
  }

  const currentPage = document.body.dataset.page || 'home';
  const headerHost = document.querySelector('[data-site-header]');
  const footerHost = document.querySelector('[data-site-footer]');

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

  const navigation = site.navigation.map(({ label, href }) => {
    const page = href === '/' ? 'home' : href.split('/')[1];
    const current = page === currentPage ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${label}</a>`;
  }).join('');

  headerHost.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="announcement">
      <span class="announcement__marker" aria-hidden="true"></span>
      <p>Mercy T International College has moved into its permanent building.</p>
      <a href="/about/">Our story <span aria-hidden="true">→</span></a>
    </div>
    <header class="public-header" id="site-header">
      <div class="public-header__inner">
        <a class="public-brand" href="/" aria-label="${escapeHtml(site.name)} home">
          <img src="/logo.png" alt="" width="48" height="48">
          <span><strong>Mercy T</strong><small>International College</small></span>
        </a>
        <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Open navigation menu">
          <span></span><span></span><span></span>
        </button>
        <div class="public-menu" id="site-menu">
          <nav class="public-nav" aria-label="Main navigation">${navigation}</nav>
          <div class="public-header__actions">
            <a class="login-link" href="/login.html">Student / Staff Login</a>
            <a class="site-button site-button--small" href="/register.html">Enroll now <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>
    </header>`;

  footerHost.innerHTML = `
    <footer class="public-footer">
      <div class="public-footer__main">
        <div class="public-footer__identity">
          <a class="public-brand public-brand--footer" href="/" aria-label="${escapeHtml(site.name)} home">
            <img src="/logo.png" alt="" width="46" height="46">
            <span><strong>Mercy T</strong><small>International College</small></span>
          </a>
          <p>${escapeHtml(site.motto)}. A learning community shaped by knowledge, responsibility, and care.</p>
        </div>
        <div class="public-footer__column">
          <h2>Explore</h2>
          <a href="/about/">About the school</a>
          <a href="/academics/">Academics</a>
          <a href="/facilities/">Facilities</a>
          <a href="/leadership/">Leadership</a>
        </div>
        <div class="public-footer__column">
          <h2>Admissions &amp; portal</h2>
          <a href="/admissions/">Admissions</a>
          <a href="/register.html">Begin enrollment</a>
          <a href="/login.html">Student / staff login</a>
          <a href="/parent-register.html">Parent registration</a>
        </div>
        <div class="public-footer__column public-footer__contact">
          <h2>Contact</h2>
          <a href="tel:${escapeHtml(site.phoneHref)}">${escapeHtml(site.phoneDisplay)}</a>
          <a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>
          <p>${escapeHtml(site.address)}</p>
        </div>
      </div>
      <div class="public-footer__bottom">
        <span>© <span data-current-year></span> ${escapeHtml(site.name)}</span>
        <a href="/contact/">Contact the school <span aria-hidden="true">→</span></a>
        <span class="public-footer__motto">${escapeHtml(site.motto)}</span>
      </div>
    </footer>`;

  document.querySelectorAll('[data-leader]').forEach((card) => {
    const leader = site[card.dataset.leader];
    const portrait = card.querySelector('.leader-feature__portrait, .leader-profile__portrait');
    if (!leader || !leader.portrait || !portrait) return;

    const image = document.createElement('img');
    image.src = leader.portrait;
    image.alt = `Portrait of ${leader.name}`;
    portrait.replaceChildren(image);
    portrait.setAttribute('role', 'img');
    portrait.setAttribute('aria-label', image.alt);
  });

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = new URL(canonical.getAttribute('href'), window.location.origin).href;
  ['og:url', 'og:image', 'twitter:image'].forEach((property) => {
    const metadata = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    if (metadata) metadata.content = new URL(metadata.content, window.location.origin).href;
  });

  const structuredData = document.createElement('script');
  structuredData.type = 'application/ld+json';
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: site.name,
    url: new URL('/', window.location.origin).href,
    image: new URL('/assets/landing/school-building.jpg', window.location.origin).href,
    email: site.email,
    telephone: site.phoneHref,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
    },
  });
  document.head.appendChild(structuredData);

  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('site-menu');

  const closeMenu = (restoreFocus) => {
    header.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    if (restoreFocus) menuToggle.focus();
  };

  menuToggle.addEventListener('click', () => {
    const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('is-open', opening);
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Close navigation menu' : 'Open navigation menu');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (header.classList.contains('is-open') && !header.contains(event.target)) closeMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) closeMenu(true);
  });

  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    document.body.classList.add('has-reveal-support');
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  }
})();
