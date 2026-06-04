/** Remove Ant Dropdown portals and orphan full-screen divs (Ant wave) that block mobile UI. */
export const cleanupMobileBlockers = () => {
  document.querySelectorAll('.ant-dropdown').forEach((element) => {
    element.remove();
  });

  Array.from(document.body.children).forEach((child) => {
    if (child.id === 'root' || !(child instanceof HTMLElement)) {
      return;
    }

    const style = child.getAttribute('style') ?? '';
    const isFullScreenOverlay =
      /position:\s*absolute/i.test(style) &&
      /top:\s*0(px)?/i.test(style) &&
      (/width:\s*100%/.test(style) || /height:\s*100%/.test(style) || /inset:\s*0/.test(style));

    if (isFullScreenOverlay && !child.classList.length) {
      child.remove();
    }
  });

  document.body.classList.remove('ant-scrolling-effect');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.body.style.pointerEvents = '';
};

export const scheduleCleanupMobileBlockers = () => {
  [0, 80, 250, 500].forEach((delay) => {
    window.setTimeout(cleanupMobileBlockers, delay);
  });
};
