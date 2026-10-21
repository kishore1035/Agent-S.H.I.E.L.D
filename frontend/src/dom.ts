import type { Elements } from './elements';

export function $<K extends keyof Elements>(id: K): Elements[K] {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing workspace element: ${id}`);
  return node as Elements[K];
}
export const esc = (value: unknown): string =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
export const icon = (name: string): string =>
  `<svg aria-hidden="true"><use href="#i-${esc(name)}"/></svg>`;
export const safe = {
  get(key: string, fallback = ''): string {
    try {
      return localStorage.getItem('nexus-design:' + key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: string | number): void {
    try {
      localStorage.setItem('nexus-design:' + key, String(value));
    } catch {
      /* In-memory state still works. */
    }
  },
};
export const pretty = (value: unknown): string =>
  typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? '');
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string): void {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $('toast').hidden = true;
  }, 3500);
}
export function feedback(message: string, error = false): void {
  $('task-feedback').textContent = message;
  $('task-feedback').className = 'feedback' + (error ? ' error' : '');
  $('task-feedback').hidden = !message;
}
export function dialog(title: string, html: string): void {
  $('dialog-title').textContent = title;
  $('dialog-body').innerHTML = html;
  if (!$('detail-dialog').open) $('detail-dialog').showModal();
}
export function download(name: string, data: unknown, type = 'application/json'): void {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
    type,
  });
  const url = URL.createObjectURL(blob),
    anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
export async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard.');
  } catch {
    dialog(
      'Copy text',
      `<textarea class="input" rows="6" aria-label="Text to copy" readonly>${esc(text)}</textarea><p class="hint">Select and copy this text.</p>`,
    );
    $('dialog-body').querySelector('textarea')?.select();
  }
}
export function buttonFrom(event: Event): HTMLButtonElement | null {
  return event.target instanceof Element ? event.target.closest('button') : null;
}
export function inputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLTextAreaElement
    ? event.target.value
    : '';
}
