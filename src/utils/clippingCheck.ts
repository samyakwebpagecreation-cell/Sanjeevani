export interface ClippingIssue {
  type: 'overflow-y' | 'overflow-x' | 'text-bounds' | 'header-overlap';
  tag: string;
  className: string;
  text: string;
  details: string;
}

declare global {
  interface Window {
    __checkClipping?: () => ClippingIssue[];
  }
}

export function runClippingCheck(): ClippingIssue[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') return [];

  const issues: ClippingIssue[] = [];
  const allElements = Array.from(document.body.querySelectorAll('*'));

  for (const el of allElements) {
    if (!(el instanceof HTMLElement)) continue;
    const tag = el.tagName.toLowerCase();
    if (
      tag === 'script' ||
      tag === 'style' ||
      tag === 'svg' ||
      tag === 'path' ||
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'img'
    ) {
      continue;
    }

    // Skip invisible or screen-reader-only elements
    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity || '1') === 0 ||
      el.classList.contains('sr-only')
    ) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Skip intentional scroll containers or intentional truncation/line-clamp
    const isScrollY = style.overflowY === 'auto' || style.overflowY === 'scroll';
    const isScrollX = style.overflowX === 'auto' || style.overflowX === 'scroll';
    const isEllipsis =
      style.textOverflow === 'ellipsis' ||
      el.classList.contains('truncate') ||
      el.className.includes('line-clamp-');

    const hasDirectText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
    );

    // 1. Check vertical clipping on elements with clipped overflow or fixed height
    if (
      !isScrollY &&
      !isEllipsis &&
      hasDirectText &&
      el.clientHeight > 0 &&
      el.scrollHeight > el.clientHeight + 1 &&
      (style.overflowY === 'hidden' || style.overflowY === 'clip')
    ) {
      issues.push({
        type: 'overflow-y',
        tag,
        className: el.className,
        text: (el.textContent || '').trim().slice(0, 60),
        details: `scrollHeight(${el.scrollHeight}) > clientHeight(${el.clientHeight})`
      });
    }

    // 2. Check horizontal clipping on non-truncating text elements
    if (
      !isScrollX &&
      !isEllipsis &&
      hasDirectText &&
      el.clientWidth > 0 &&
      el.scrollWidth > el.clientWidth + 1 &&
      (style.overflowX === 'hidden' || style.overflowX === 'clip')
    ) {
      issues.push({
        type: 'overflow-x',
        tag,
        className: el.className,
        text: (el.textContent || '').trim().slice(0, 60),
        details: `scrollWidth(${el.scrollWidth}) > clientWidth(${el.clientWidth})`
      });
    }

    // 3. Check direct text node bounding boxes against parent element bounds
    if (!isEllipsis && !isScrollX && !isScrollY && hasDirectText) {
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length > 0) {
          const range = document.createRange();
          range.selectNodeContents(node);
          const textRect = range.getBoundingClientRect();
          if (textRect.width === 0 || textRect.height === 0) continue;

          if (
            textRect.top < rect.top - 2 ||
            textRect.bottom > rect.bottom + 2 ||
            textRect.left < rect.left - 2 ||
            textRect.right > rect.right + 2
          ) {
            issues.push({
              type: 'text-bounds',
              tag,
              className: el.className,
              text: (node.textContent || '').trim().slice(0, 60),
              details: `textRect(${Math.round(textRect.width)}x${Math.round(textRect.height)}) exceeds parent(${Math.round(rect.width)}x${Math.round(rect.height)})`
            });
          }
        }
      }
    }
  }

  // 4. Check top-level interactive children in header for sibling overlap
  const header = document.querySelector('header');
  if (header) {
    const interactive = Array.from(
      header.querySelectorAll('button, a, nav > button')
    ).filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    });

    for (let i = 0; i < interactive.length; i++) {
      for (let j = i + 1; j < interactive.length; j++) {
        const a = interactive[i];
        const b = interactive[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const overlapX = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
        const overlapY = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
        if (overlapX > 1 && overlapY > 1) {
          issues.push({
            type: 'header-overlap',
            tag: 'header',
            className: `${(a as HTMLElement).className} <-> ${(b as HTMLElement).className}`,
            text: `${(a.textContent || '').trim()} overlaps ${(b.textContent || '').trim()}`,
            details: `overlap ${Math.round(overlapX)}x${Math.round(overlapY)}px`
          });
        }
      }
    }
  }

  return issues;
}

export function installClippingCheck(): void {
  if (typeof window === 'undefined') return;
  window.__checkClipping = () => {
    const issues = runClippingCheck();
    if (issues.length > 0) {
      console.table(issues);
    }
    return issues;
  };
}
