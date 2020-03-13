function makeAt(p) {
  return (point: Number[], fn: () => void) => {
    p.push();
    p.translate(...point);
    fn();
    p.pop();
  };
}
