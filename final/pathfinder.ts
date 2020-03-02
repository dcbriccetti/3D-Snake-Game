type Vector = number[];

class MoveNode {
  constructor(public parent: MoveNode, public directionTo: Vector, public position: Vector) {}
}

class PathFinder {
  constructor(private readonly maxCoord: number, private readonly cellWidth: number) {}

  // Implements breadth-first search as presented at https://en.wikipedia.org/wiki/Breadth-first_search
  findShortest(startPos: Vector, endPos: Vector, obstacles: Vector[]): Vector[] {
    const s = obj => obj.toString();
    const q: MoveNode[] = [];
    const discovered: Set<string> = new Set();
    const start = new MoveNode(null, null, startPos);
    discovered.add(s(start.position));
    q.push(start);

    while (q.length) {
      const node = q.shift();
      if (s(node.position) === s(endPos))
        return this.pathTo(node);

      [-1, 1].forEach(dir => {
        for (let axisIndex = 0; axisIndex < 3; ++axisIndex) {
          const candidateDir = [0, 0, 0];
          candidateDir[axisIndex] = dir;
          const candidatePos = Array.from(node.position);
          candidatePos[axisIndex] += dir * this.cellWidth;
          const inBounds = !candidatePos.some(p => Math.abs(p) > this.maxCoord);
          const cellFree = !obstacles.some(o => s(candidatePos) === s(o));
          if (inBounds && cellFree) {
            if (!discovered.has(s(candidatePos))) {
              discovered.add(s(candidatePos));
              q.push(new MoveNode(node, candidateDir, candidatePos));
            }
          }
        }
      })
    }
  }

  pathTo(node: MoveNode): Vector[] {
    const path: Vector[] = [];
    while (node) {
      const dt = node.directionTo;
      if (dt)
        path.unshift(dt);
      node = node.parent;
    }
    return path;
  }
}

if (false) {
  const DIM_LEN = 5;
  const CELL_WIDTH = 20;
  const MAX_COORD = (DIM_LEN - 1) / 2;
  let obstacles: Vector[] = [
    [CELL_WIDTH, 0, 0],
    [1, -CELL_WIDTH, 0],
  ];
  const pf = new PathFinder(MAX_COORD * CELL_WIDTH, CELL_WIDTH);
  const path: Vector[] = pf.findShortest([0, 0, 0], [MAX_COORD * CELL_WIDTH, 0, 0], obstacles);
  console.log(path);
}
