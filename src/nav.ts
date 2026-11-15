import './editorial.css';

// Adaptive navigation controller following modern-web-guidance `navbar` & `accordion`:
// - Measures inline width via ResizeObserver on header + menu (no hardcoded breakpoint).
// - Keeps popover="auto" only when collapsed; removes attribute when wide inline.
// - Never mutates `.popover` IDL property (uses setAttribute / removeAttribute).

export function initEditorialNav(): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  const inner = header?.querySelector<HTMLElement>('.header-inner');
  const menu = header?.querySelector<HTMLElement>('#site-menu');
  const menuButton = header?.querySelector<HTMLButtonElement>('.menu-button');

  if (header && inner && menu && menuButton) {
    const hasNativePopover = Object.hasOwn(HTMLElement.prototype, 'popover');
    let lastCollapsedWidth = 0;

    const syncAriaExpanded = () => {
      const isOpen = hasNativePopover ? menu.matches(':popover-open') : !menu.hidden;
      menuButton.setAttribute('aria-expanded', String(isOpen));
    };

    const syncLayout = () => {
      const headerWidth = header.getBoundingClientRect().width;
      const wasWide = header.classList.contains('is-wide');
      if (!wasWide && headerWidth <= lastCollapsedWidth) {
        return;
      }

      const wasOpen = hasNativePopover && menu.matches(':popover-open');
      header.classList.add('is-measuring');
      header.classList.add('is-wide');
      menu.removeAttribute('popover');
      menu.hidden = false;

      const fitsInline = inner.scrollWidth <= inner.clientWidth + 1;

      if (fitsInline) {
        lastCollapsedWidth = 0;
        menu.hidden = false;
        menuButton.setAttribute('aria-expanded', 'false');
      } else {
        lastCollapsedWidth = headerWidth;
        header.classList.remove('is-wide');
        menu.setAttribute('popover', 'auto');
        if (!hasNativePopover) {
          menu.hidden = true;
        }
        if (wasOpen && hasNativePopover) {
          try {
            (menu as HTMLElement & { showPopover(): void }).showPopover();
          } catch {
            // Ignore if element is detached or already open
          }
        }
        syncAriaExpanded();
      }

      requestAnimationFrame(() => {
        header.classList.remove('is-measuring');
      });
    };

    if (hasNativePopover) {
      menu.addEventListener('toggle', syncAriaExpanded);
    } else {
      menuButton.addEventListener('click', () => {
        menu.hidden = !menu.hidden;
        syncAriaExpanded();
      });
    }

    const observer = new ResizeObserver(() => {
      syncLayout();
    });
    observer.observe(header);
    observer.observe(menu);

    syncLayout();
  }

  // Fallback for exclusive <details name="..."> if any future accordion uses `name`
  if (!Object.hasOwn(HTMLDetailsElement.prototype, 'name')) {
    document.addEventListener(
      'toggle',
      (event) => {
        const details = event.target;
        if (!(details instanceof HTMLDetailsElement) || !details.open || !details.hasAttribute('name')) return;
        const name = CSS.escape(details.getAttribute('name') || '');
        for (const other of document.querySelectorAll<HTMLDetailsElement>(`details[name="${name}"]`)) {
          if (other !== details) other.open = false;
        }
      },
      { capture: true },
    );
  }
}

initEditorialNav();
