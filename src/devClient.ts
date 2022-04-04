declare global {
  const PORT: number;
}

export const ws = new WebSocket(`ws://localhost:${PORT}`);

ws.onmessage = () => {
  const obj = document.querySelector('object')!;

  obj.data = `/img.svg?hash=${Date.now()}`;
};
