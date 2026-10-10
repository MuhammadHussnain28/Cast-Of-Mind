// Escapes user-supplied text before it goes into email HTML (12.3).
// Names are free text: unescaped, `<a href>` in a name becomes a real link.
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default escapeHtml;
