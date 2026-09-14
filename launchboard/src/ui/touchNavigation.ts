// A release can be followed by a compatibility click after React replaces the
// menu. Consume that click, but never the next deliberate touch or keyboard click.
export function preventClickThrough() {
  const cleanup = () => {
    document.removeEventListener('click', click, true);
    document.removeEventListener('pointerdown', cleanup, true);
    clearTimeout(timer);
  };
  const click = (event: MouseEvent) => {
    if (event.detail > 0) { event.preventDefault(); event.stopImmediatePropagation(); }
    cleanup();
  };
  const timer = setTimeout(cleanup, 500);
  document.addEventListener('click', click, true);
  document.addEventListener('pointerdown', cleanup, true);
}
