/**
 * Returns an “at” function which uses the provided p5 object.
 * @param p5 the p5 instance on which to invoke p5 methods
 */
function makeAt(p5) {
  /**
   * Translates by the specified x, y, z distances, then calls the provided function. Wraps in a push/pop.
   * @param point The x, y, z distances by which to translate
   * @param fn The function to call after translating
   */
  function at(point: Number[], fn: () => void) {
    p5.push();
    p5.translate(...point);
    fn();
    p5.pop();
  }

  return at;
}
