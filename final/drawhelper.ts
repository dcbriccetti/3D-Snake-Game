function makeAt(p) {
  const at = (point: Number[], fn: () => void) => {
    p.push();
    p.translate(...point);
    fn();
    p.pop();
  };
  return at;
}
