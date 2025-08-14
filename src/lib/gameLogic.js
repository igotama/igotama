// 碁盤のルールと状態を管理するクラス
export class GoGame {
  constructor(size = 19) {
    this.size = size;
    this.board = this.createEmptyBoard();
    this.history = []; // コウ判定のための盤面履歴
    this.captures = { 1: 0, 2: 0 }; // {黒のハマグリ, 白のハマグリ}
  }

  // 空の碁盤を生成する
  createEmptyBoard() {
    return Array(this.size).fill(null).map(() => Array(this.size).fill(0));
  }

  // UIから呼ばれるメインの関数
  placeStone(x, y, player) {
    if (this.board[y][x] !== 0) {
      return { success: false, message: 'すでに石があります' };
    }

    // 1. 石を仮に置いてみる
    const tempBoard = this.board.map(row => [...row]);
    tempBoard[y][x] = player;
    
    let capturedStones = [];
    const opponent = player === 1 ? 2 : 1;

    // 2. 相手の石が取れるかチェック
    for (const [nx, ny] of this.getNeighbors(x, y)) {
      if (tempBoard[ny][nx] === opponent) {
        const group = this.findGroup(nx, ny, tempBoard);
        if (group.liberties === 0) {
          capturedStones = capturedStones.concat(group.stones);
        }
      }
    }

    // 3. 取れる石があれば盤面から取り除く
    if (capturedStones.length > 0) {
      for (const [sx, sy] of capturedStones) {
        tempBoard[sy][sx] = 0;
      }
    }
    
    // 4. 自殺手かどうかチェック
    const myGroup = this.findGroup(x, y, tempBoard);
    if (myGroup.liberties === 0) {
      return { success: false, message: 'その手は自殺手です' };
    }
    
    // 5. コウかどうかチェック
    const boardString = JSON.stringify(tempBoard);
    if (this.history.includes(boardString)) {
      return { success: false, message: 'コウのため、その手は打てません' };
    }

    // 6. 全てのチェックをパスしたら、正式な盤面として採用
    this.board = tempBoard;
    this.captures[player] += capturedStones.length;
    this.history.push(boardString);

    return { success: true };
  }

  // (x, y)の石が所属する「連」と、その呼吸点（自由な交点）を見つける
  findGroup(startX, startY, board) {
    const player = board[startY][startX];
    if (player === 0) return { stones: [], liberties: 0 };

    const q = [[startX, startY]]; // 探索キュー
    const groupStones = new Set([`${startX},${startY}`]); // 連に属する石の座標
    const groupLiberties = new Set(); // 連の呼吸点の座標
    
    let head = 0;
    while(head < q.length) {
      const [x, y] = q[head++];

      for (const [nx, ny] of this.getNeighbors(x, y)) {
        const neighbor = board[ny][nx];
        const coordStr = `${nx},${ny}`;

        if (neighbor === 0 && !groupLiberties.has(coordStr)) {
          groupLiberties.add(coordStr);
        } else if (neighbor === player && !groupStones.has(coordStr)) {
          groupStones.add(coordStr);
          q.push([nx, ny]);
        }
      }
    }
    
    return {
      stones: Array.from(groupStones).map(s => s.split(',').map(Number)),
      liberties: groupLiberties.size
    };
  }

  // (x,y)に隣接する有効な座標のリストを返す
  getNeighbors(x, y) {
    const neighbors = [];
    if (x > 0) neighbors.push([x - 1, y]);
    if (x < this.size - 1) neighbors.push([x + 1, y]);
    if (y > 0) neighbors.push([x, y - 1]);
    if (y < this.size - 1) neighbors.push([x, y + 1]);
    return neighbors;
  }
  // 簡易的なスコア計算ロジック
  calculateScore(komi = 6.5) {
    const territory = { 1: 0, 2: 0 };
    const checked = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.board[y][x] === 0 && !checked[y][x]) {
          const q = [[x, y]];
          checked[y][x] = true;
          const region = [];
          const borders = new Set();
          
          let head = 0;
          while(head < q.length) {
            const [cx, cy] = q[head++];
            region.push([cx, cy]);
            
            for (const [nx, ny] of this.getNeighbors(cx, cy)) {
              if (!checked[ny][nx]) {
                const owner = this.board[ny][nx];
                if (owner === 0) {
                  checked[ny][nx] = true;
                  q.push([nx, ny]);
                } else {
                  borders.add(owner);
                }
              }
            }
          }

          if (borders.size === 1) {
            const owner = borders.values().next().value;
            territory[owner] += region.length;
          }
        }
      }
    }
    
    const blackScore = territory[1] + this.captures[2];
    const whiteScore = territory[2] + this.captures[1] + komi;

    return {
      black: blackScore,
      white: whiteScore,
      winner: blackScore > whiteScore ? '黒番' : '白番',
      difference: Math.abs(blackScore - whiteScore)
    };
  }
}