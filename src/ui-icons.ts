const paths = {
  bat: '<path d="m5 19 7-7m-9 7 2 2m6-10 6-7a2.8 2.8 0 0 1 4 4l-7 6z"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v6m8 0v6m-6 0v6"/>',
  boss: '<path d="M5 9 3 3l6 3h6l6-3-2 6v9l-4 3H9l-4-3z"/><path d="m8 11 2 1m6-1-2 1m-5 5h6"/>',
};

export function uiIcon(name: keyof typeof paths) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
