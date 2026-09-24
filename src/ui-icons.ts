const paths = {
  chat: '<path d="M4 4h16v12H9l-5 4z"/><path d="M8 8h8M8 12h5"/>',
  speed: '<path d="M3 16a9 9 0 0 1 18 0M5 20h14M12 16l5-7M5 12l2 1m3-7 1 2m7 5 2-1"/><circle cx="12" cy="16" r="1"/>',
  tap: '<path d="M9 12V5a2 2 0 0 1 4 0v7l2-3 5 3-2 8H9l-5-6 2-2 3 3"/>',
  auto: '<path d="M4 9a8 8 0 0 1 14-3l2 3M20 4v5h-5M20 15A8 8 0 0 1 6 18l-2-3M4 20v-5h5"/><path d="m10 9 5 3-5 3z"/>',
  dust: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  bat: '<path d="m5 19 7-7m-9 7 2 2m6-10 6-7a2.8 2.8 0 0 1 4 4l-7 6z"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v6m8 0v6m-6 0v6"/>',
  boss: '<path d="M5 9 3 3l6 3h6l6-3-2 6v9l-4 3H9l-4-3z"/><path d="m8 11 2 1m6-1-2 1m-5 5h6"/>',
};

export function uiIcon(name: keyof typeof paths) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
