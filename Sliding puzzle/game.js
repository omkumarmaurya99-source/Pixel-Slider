/* ==========================================================
   game.js  —  PIXEL SLIDER 9000
   ========================================================== */

let gridSize   = 3;       
let board      = [];      
let moves      = 0;       
let startTime  = null;    
let timerInterval = null; 
let gameActive = false;   

let hiScore     = parseInt(localStorage.getItem('ps9k_hi')    || '0');
let gamesPlayed = parseInt(localStorage.getItem('ps9k_games') || '0');
let bestTime    = parseInt(localStorage.getItem('ps9k_time')  || '0');

/* AUDIO CONTROLS */
let isMuted = false;

function toggleSound() {
  const bgMusic = document.getElementById('bgMusic');
  const soundBtn = document.getElementById('soundBtn');

  isMuted = !isMuted; 

  if (isMuted) {
    bgMusic.pause();
    soundBtn.textContent = '🔈'; 
    soundBtn.classList.add('muted');
  } else {
    bgMusic.play().catch(e => console.log("Audio play blocked by browser"));
    soundBtn.textContent = '🔊'; 
    soundBtn.classList.remove('muted');
  }
}

function initLanding() {
  document.getElementById('hiScore').textContent     = String(hiScore).padStart(6, '0');
  document.getElementById('gamesPlayed').textContent = String(gamesPlayed).padStart(3, '0');

  if (bestTime > 0) {
    document.getElementById('bestTime').textContent = formatTime(bestTime);
  }
  createPixelRain();  
  createPixelLogo();  
}

function createPixelRain() {
  const container = document.getElementById('pixelRain');
  container.innerHTML = '';  
  const colors = ['#00ff41','#00ffff','#ff00ff','#ffff00','#ff0040','#ff8800'];

  for (let i = 0; i < 40; i++) {
    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    pixel.style.left = Math.random() * 100 + '%';
    pixel.style.top = Math.random() * -100 + 'px';
    pixel.style.background = colors[Math.floor(Math.random() * colors.length)];
    pixel.style.animationDuration = (2 + Math.random() * 5) + 's';
    pixel.style.animationDelay = (Math.random() * 5) + 's';
    pixel.style.opacity = 0.3 + Math.random() * 0.5;
    container.appendChild(pixel);
  }
}

function createPixelLogo() {
  const logo = document.getElementById('pixelLogo');
  logo.innerHTML = '';
  const pattern = [
    [0,1,1,1,1,1,1,0],
    [1,2,2,3,3,2,2,1],
    [1,2,0,3,2,0,2,1],
    [1,3,3,3,3,3,3,1],
    [1,2,3,0,0,3,2,1],
    [1,2,0,3,3,0,2,1],
    [1,2,2,3,3,2,2,1],
    [0,1,1,1,1,1,1,0],
  ];
  const colorMap = ['#000', '#00ffff', '#ff00ff', '#ffff00'];

  pattern.forEach(row => {
    row.forEach(value => {
      const cell = document.createElement('div');
      cell.className = 'pl-cell';
      cell.style.background = colorMap[value];
      if (value > 0) cell.style.boxShadow = `0 0 4px ${colorMap[value]}`;
      logo.appendChild(cell);
    });
  });

  setInterval(() => {
    logo.querySelectorAll('.pl-cell').forEach((cell, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      const value = pattern[row][col];
      if (value > 0 && Math.random() < 0.05) {   
        const originalColor = colorMap[value];
        cell.style.background = '#ffffff';         
        setTimeout(() => { cell.style.background = originalColor; }, 100);
      }
    });
  }, 200);
}

function selectDiff(size, clickedButton) {
  gridSize = size;  
  document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('selected'));
  clickedButton.classList.add('selected');
}

function startGame() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('game').classList.add('active');
  document.getElementById('win-screen').classList.remove('active');

  // MUSIC STARTS HERE
  if (!isMuted) {
    let bgm = document.getElementById('bgMusic');
    bgm.play().catch(e => console.log("Waiting for interaction to play audio"));
  }

  const diffNames = { 3: 'EASY', 4: 'MEDIUM', 5: 'HARD' };
  const badge = document.getElementById('diffBadge');
  badge.textContent = diffNames[gridSize];
  badge.className = 'diff-badge ' + (gridSize === 3 ? 'easy' : gridSize === 4 ? 'medium' : 'hard');

  setupBoard();    
  shuffleBoard();  
}

function setupBoard() {
  const boardEl = document.getElementById('board');
  const maxTileSize = { 3: 120, 4: 100, 5: 80 };
  const tileSize = Math.min(
    Math.floor((window.innerWidth - 80) / gridSize),
    maxTileSize[gridSize]
  );

  boardEl.style.gridTemplateColumns = `repeat(${gridSize}, ${tileSize}px)`;
  boardEl.style.gridTemplateRows    = `repeat(${gridSize}, ${tileSize}px)`;

  board = [];
  const totalTiles = gridSize * gridSize;
  for (let i = 0; i < totalTiles - 1; i++) {
    board.push(i + 1);   
  }
  board.push(0);          

  moves = 0;
  document.getElementById('moveCount').textContent = '0';
  renderBoard();
  updateProgress();
}

function shuffleBoard() {
  let emptyIndex = board.indexOf(0);
  const shuffleCount = { 3: 100, 4: 200, 5: 350 };
  const totalMoves = shuffleCount[gridSize];

  for (let i = 0; i < totalMoves; i++) {
    const neighbors = getNeighbors(emptyIndex);   
    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    board[emptyIndex] = board[randomNeighbor];
    board[randomNeighbor] = 0;
    emptyIndex = randomNeighbor;
  }

  moves = 0;
  document.getElementById('moveCount').textContent = '0';
  gameActive = true;
  resetTimer();
  startTimer();
  renderBoard();
  updateProgress();
}

function getNeighbors(index) {
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  const neighbors = [];

  if (row > 0)            neighbors.push(index - gridSize);  
  if (row < gridSize - 1) neighbors.push(index + gridSize);  
  if (col > 0)            neighbors.push(index - 1);          
  if (col < gridSize - 1) neighbors.push(index + 1);          

  return neighbors;
}

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';  

  const tileSize = parseInt(boardEl.style.gridTemplateColumns.split(' ')[0]);

  board.forEach((value, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (value === 0 ? ' empty' : '');
    tile.setAttribute('data-val', value);
    tile.style.width  = tileSize + 'px';
    tile.style.height = tileSize + 'px';

    if (value !== 0) {
      tile.textContent = value;  
      if (value === index + 1) {
        tile.style.opacity = '0.7';
        tile.style.filter  = 'brightness(0.6)';
      }
      tile.onclick = () => clickTile(index);
    }
    boardEl.appendChild(tile);
  });
}

function clickTile(index) {
  if (!gameActive) return;  
  const emptyIndex = board.indexOf(0);
  const neighbors  = getNeighbors(emptyIndex);

  if (neighbors.includes(index)) {
    moveTile(index, emptyIndex);
  }
}

function moveTile(tileIndex, emptyIndex) {
  board[emptyIndex] = board[tileIndex];
  board[tileIndex]  = 0;
  moves++;
  document.getElementById('moveCount').textContent = moves;

  renderBoard();
  updateProgress();

  const allTiles = document.getElementById('board').children;
  if (allTiles[emptyIndex]) {
    allTiles[emptyIndex].classList.add('moving');
    setTimeout(() => allTiles[emptyIndex]?.classList.remove('moving'), 100);
  }

  if (checkWin()) {
    setTimeout(triggerWin, 300);  
  }
}

document.addEventListener('keydown', (event) => {
  if (!gameActive) return;

  const emptyIndex = board.indexOf(0);
  const emptyRow   = Math.floor(emptyIndex / gridSize);
  const emptyCol   = emptyIndex % gridSize;
  let tileToMove = -1;  

  switch (event.key) {
    case 'ArrowUp':    if (emptyRow < gridSize - 1) tileToMove = emptyIndex + gridSize; break;
    case 'ArrowDown':  if (emptyRow > 0)            tileToMove = emptyIndex - gridSize; break;
    case 'ArrowLeft':  if (emptyCol < gridSize - 1) tileToMove = emptyIndex + 1; break;
    case 'ArrowRight': if (emptyCol > 0)            tileToMove = emptyIndex - 1; break;
  }

  if (tileToMove !== -1) {
    event.preventDefault();  
    moveTile(tileToMove, emptyIndex);
  }
});

function checkWin() {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;  
  }
  return board[board.length - 1] === 0;    
}

function updateProgress() {
  let correctCount = 0;
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] === i + 1) correctCount++;
  }
  if (board[board.length - 1] === 0) correctCount++;  

  const percentage = Math.round((correctCount / (gridSize * gridSize)) * 100);
  document.getElementById('progressBar').style.width = percentage + '%';
  document.getElementById('progressPct').textContent  = percentage + '%';
}

function triggerWin() {
  gameActive = false;
  clearInterval(timerInterval);

  const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const score = Math.max(0, Math.floor(10000 * gridSize / (moves * (elapsed + 1)) * 1000));

  gamesPlayed++;
  localStorage.setItem('ps9k_games', gamesPlayed);

  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('ps9k_hi', hiScore);
  }
  if (bestTime === 0 || elapsed < bestTime) {
    bestTime = elapsed;
    localStorage.setItem('ps9k_time', bestTime);
  }

  let rating = 'GOOD JOB!';
  if      (moves <= gridSize * gridSize * 2) rating = '★ LEGENDARY! ★';
  else if (moves <= gridSize * gridSize * 4) rating = '★ EXCELLENT! ★';
  else if (moves <= gridSize * gridSize * 8) rating = 'GREAT WORK!';

  document.getElementById('wMoves').textContent   = moves;
  document.getElementById('wTime').textContent    = formatTime(elapsed);
  document.getElementById('wScore').textContent   = score.toLocaleString();
  document.getElementById('winRating').textContent = rating;

  createExplosion();  
  document.getElementById('win-screen').classList.add('active');
}

function createExplosion() {
  const colors = ['#00ff41','#00ffff','#ff00ff','#ffff00','#ff0040','#ff8800'];
  for (let i = 0; i < 60; i++) {
    const pixel = document.createElement('div');
    pixel.classList.add('exp-pixel', 'explosion');
    const angle    = Math.random() * Math.PI * 2;             
    const distance = 100 + Math.random() * 300;               
    pixel.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
    pixel.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
    pixel.style.background = colors[Math.floor(Math.random() * colors.length)];
    pixel.style.left       = '50vw';    
    pixel.style.top        = '40vh';
    pixel.style.animationDelay = Math.random() * 0.3 + 's';
    pixel.style.boxShadow  = `0 0 4px ${pixel.style.background}`;
    document.body.appendChild(pixel);
    setTimeout(() => pixel.remove(), 1200);
  }
}

function playAgain() {
  document.getElementById('win-screen').classList.remove('active');
  setupBoard();
  shuffleBoard();
}

function goMenu() {
  clearInterval(timerInterval);
  gameActive = false;
  document.getElementById('win-screen').classList.remove('active');
  document.getElementById('game').classList.remove('active');
  document.getElementById('landing').style.display = 'flex';
  initLanding();  
}

function resetTimer() {
  clearInterval(timerInterval);
  startTime = null;
  document.getElementById('timer').textContent = '00:00';
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return minutes + ':' + seconds;
}

document.getElementById('landing').style.display = 'flex';
initLanding();