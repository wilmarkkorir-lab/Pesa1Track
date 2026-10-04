const bus = new EventTarget();
export const emit = (event, detail) => bus.dispatchEvent(new CustomEvent(event, { detail }));
export const on = (event, cb) => { bus.addEventListener(event, cb); return () => bus.removeEventListener(event, cb); };
