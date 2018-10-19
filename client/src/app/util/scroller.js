import scrollTabs from 'scroll-tabs';

export function addScroller(node, options, onScroll) {
  const scroller = scrollTabs(node, options);

  scroller.on('scroll', onScroll);

  scroller.update = scroller.update.bind(scroller);

  window.addEventListener('resize', scroller.update);

  return scroller;
}

export function removeScroller(scroller) {
  window.removeEventListener('resize', scroller.update);
}