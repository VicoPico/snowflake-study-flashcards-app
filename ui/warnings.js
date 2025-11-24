import { dom } from "./dom.js";

export function showWarning(msg) {
  const el = dom.dataSourceWarning;
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("d-none");
}

export function clearWarning() {
  const el = dom.dataSourceWarning;
  if (!el) return;
  el.textContent = "";
  el.classList.add("d-none");
}
