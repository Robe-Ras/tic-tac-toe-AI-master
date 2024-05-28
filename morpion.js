class Morpion {
	humanPlayer = 'J1';
	iaPlayer = 'J2';
    turn = 0;
	gameOver = false;
	history = [];
	redoStack = [];
	gridMap = [
		[null, null, null],
		[null, null, null],
		[null, null, null],
	];
    difficulty = 'Débutant'; // Options: 'Débutant', 'Intermédiaire', 'Avancé'

	constructor(firstPlayer = 'J1') {
		this.humanPlayer = firstPlayer;
		this.iaPlayer = (firstPlayer === 'J1') ? 'J2' : 'J1';
		this.initGame();
	}

	initGame = () => {
		this.gridMap.forEach((line, y) => {
			line.forEach((cell, x) => {
				this.getCell(x, y).onclick = () => {
					this.doPlayHuman(x, y);
				};
			});
		});

		document.getElementById('difficulty-selector').addEventListener('change', (event) => {
			this.difficulty = event.target.value;
		});

		if (this.iaPlayer === 'J1') {
			this.doPlayIa();
		}
	}

	getCell = (x, y) => {
		const column = x + 1;
		const lines = ['A', 'B', 'C'];
		const cellId = `${lines[y]}${column}`;
		return document.getElementById(cellId);
	}

    getBoardWinner = (board) => {
        const isWinningRow = ([a, b, c]) => (
            a !== null && a === b && b === c
        );

        let winner = null;

        // Horizontal
        board.forEach((line) => {
            if (isWinningRow(line)) {
                winner = line[0];
            }
        });

        // Vertical
        [0, 1, 2].forEach((col) => {
            if (isWinningRow([board[0][col], board[1][col], board[2][col]])) {
                winner = board[0][col];
            }
        });

        if (winner) {
            return winner;
        }

        // Diagonal
        const diagonal1 = [board[0][0], board[1][1], board[2][2]];
        const diagonal2 = [board[0][2], board[1][1], board[2][0]];
        if (isWinningRow(diagonal1) || isWinningRow(diagonal2)) {
            return board[1][1];
        }

        const isFull = board.every((line) => (
			line.every((cell) => cell !== null)
		));
        return isFull ? 'tie' : null;
    }

	checkWinner = (lastPlayer) => {
        const winner = this.getBoardWinner(this.gridMap);
        if (!winner) {
            return;
        }

        this.gameOver = true;
        switch(winner) {
            case 'tie':
			    this.displayEndMessage("Vous êtes à égalité !");
                break;
            case this.iaPlayer:
                this.displayEndMessage("L'IA a gagné !");
                break;
            case this.humanPlayer:
                this.displayEndMessage("Tu as battu l'IA !");
                break;
        }
	}

	displayEndMessage = (message) => {
		const endMessageElement = document.getElementById('end-message');
		endMessageElement.textContent = message;
		endMessageElement.style.display = 'block';
	}

	displaySaveMessage = (message) => {
		const endMessageElement = document.getElementById('end-message');
		endMessageElement.textContent = message;
		endMessageElement.style.display = 'block';
		setTimeout(() => {
			endMessageElement.style.display = 'none';
		}, 2000); 
	}

	drawHit = (x, y, player) => {
		if (this.gridMap[y][x] !== null) {
			return false;
		}

		this.gridMap[y][x] = player;
        this.turn += 1;
		this.history.push({ x, y, player });
		this.redoStack = [];
		this.getCell(x, y).classList.add(`filled-${player}`);
		this.checkWinner(player);
		return true;
	}

	doPlayHuman = (x, y) => {
		if (this.gameOver) {
			return;
		}

		if (this.drawHit(x, y, this.humanPlayer)) {
			this.doPlayIa();
		}
	}

	doPlayIa = () => {
		if (this.gameOver) {
			return;
		}
		let move;
		switch (this.difficulty) {
			case 'Débutant':
                console.log ('Difficulty: Debutant');
				move = this.getRandomOrBestMove(0.3); // 30% random
				break;
			case 'Intermédiaire':
                console.log ('Difficulty: Intermédiaire');
				move = this.getRandomOrBestMove(0.1); // 10% random
				break;
			case 'Avancé':
                console.log ('Difficulty: Avancé');
				move = this.minmax(this.gridMap, 0, -Infinity, Infinity, true); // Best move
				break;
            default:
                move = this.getRandomOrBestMove(0.1);
                break;
		}
		this.drawHit(move.x, move.y, this.iaPlayer);
	}

    minmax = (board, depth, alpha, beta, isMaximizing) => {
        // Return a score when there is a winner
        const winner = this.getBoardWinner(board);
        if (winner === this.iaPlayer) {
            return 10 - depth;
        }
        if (winner === this.humanPlayer) {
            return depth - 10;
        }
        if (winner === 'tie' && this.turn === 9) {
            return 0;
        }

        const getSimulatedScore = (x, y, player) => {
            board[y][x] = player;
            this.turn += 1;

            const score = this.minmax(
                board,
                depth + 1,
                alpha,
                beta,
                player === this.humanPlayer
            );

            board[y][x] = null;
            this.turn -= 1;

            return score;
        };

        // This tree is going to test every move still possible in game
        // and suppose that the 2 players will always play their best move.
        // The IA searches for its best move by testing every combination,
        // and assigns scores to every node of the tree.
        if (isMaximizing) {
            // The higher the score, the better the move for the IA.
            let bestIaScore = -Infinity;
            let optimalMove;
            for (const y of [0, 1, 2]) {
                for (const x of [0, 1, 2]) {
                    if (board[y][x]) {
                        continue;
                    }

                    const score = getSimulatedScore(x, y, this.iaPlayer);
                    if (score > bestIaScore) {
                        bestIaScore = score;
                        optimalMove = { x, y };
                    }

                    // Clear useless branches of the algorithm tree
                    // (optional but recommended)
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) {
                        break;
                    }
                }
            }

            return (depth === 0) ? optimalMove : bestIaScore;
        }

        // The lower the score, the better the move for the player.
        let bestHumanScore = Infinity;
        for (const y of [0, 1, 2]) {
            for (const x of [0, 1, 2]) {
                if (board[y][x]) {
                    continue;
                }

                const score = getSimulatedScore(x, y, this.humanPlayer);
                bestHumanScore = Math.min(bestHumanScore, score);

                // Clear useless branches of the algorithm tree
                // (optional but recommended)
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break;
                }
            }
        }

        return bestHumanScore;
    }

    getRandomMove = () => {
		const emptyCells = [];
		this.gridMap.forEach((line, y) => {
			line.forEach((cell, x) => {
				if (cell === null) {
					emptyCells.push({ x, y });
				}
			});
		});
		return emptyCells[Math.floor(Math.random() * emptyCells.length)];
	}

	getRandomOrBestMove = (randomFactor) => {
		if (Math.random() < randomFactor) {
			return this.getRandomMove();
		} else {
			return this.minmax(this.gridMap, 0, -Infinity, Infinity, true);
		}
	}

    undo = () => {
        while (this.history.length > 0) {
            const lastMove = this.history.pop();
            console.log('Undo:', lastMove);
            this.redoStack.push(lastMove);
            this.gridMap[lastMove.y][lastMove.x] = null;
            this.getCell(lastMove.x, lastMove.y).classList.remove(`filled-${lastMove.player}`);
            this.turn -= 1;
            this.gameOver = false;
            if (lastMove.player === this.humanPlayer) break;
        }
    }
    
    redo = () => {
        if (this.redoStack.length === 0) return;
        
        const move = this.redoStack.pop();
        console.log('Redo:', move);
        this.gridMap[move.y][move.x] = move.player;
        this.getCell(move.x, move.y).classList.add(`filled-${move.player}`);
        this.history.push(move);
        this.turn += 1;
        this.gameOver = false;
        this.checkWinner(move.player);

        // If it's the AI's turn, play immediately
        if (move.player === this.humanPlayer && !this.gameOver && this.redoStack.length > 0) {
            const nextMove = this.redoStack.pop();
            console.log('Redo IA:', nextMove);
            this.gridMap[nextMove.y][nextMove.x] = nextMove.player;
            this.getCell(nextMove.x, nextMove.y).classList.add(`filled-${nextMove.player}`);
            this.history.push(nextMove);
            this.turn += 1;
            this.gameOver = false;
            this.checkWinner(nextMove.player);
        }
    }

    saveGame = () => {
        const memento = new GameMemento(this.gridMap, this.turn, this.history, this.redoStack, this.gameOver, this.humanPlayer, this.iaPlayer);
        GameCaretaker.save(memento);
        console.log('Game saved:', memento);
        this.displaySaveMessage("Partie sauvegardée !");
    }

    loadGame = () => {
        const memento = GameCaretaker.load();
        if (memento) {
            this.gridMap = memento.gridMap;
            this.turn = memento.turn;
            this.history = memento.history;
            this.redoStack = memento.redoStack;
            this.gameOver = memento.gameOver;
            this.humanPlayer = memento.humanPlayer;
            this.iaPlayer = memento.iaPlayer;

            // Re-render the grid
            this.gridMap.forEach((line, y) => {
                line.forEach((cell, x) => {
                    const cellElement = this.getCell(x, y);
                    cellElement.classList.remove('filled-J1', 'filled-J2');
                    if (cell) {
                        cellElement.classList.add(`filled-${cell}`);
                    }
                });
            });

            console.log('Game loaded:', memento);
        }
    }

    resetGame = () => {
        this.gridMap = [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ];
        this.turn = 0;
        this.history = [];
        this.redoStack = [];
        this.gameOver = false;

        // Reset the grid display
        this.gridMap.forEach((line, y) => {
            line.forEach((cell, x) => {
                const cellElement = this.getCell(x, y);
                cellElement.classList.remove('filled-J1', 'filled-J2');
            });
        });

        // Reset the end message
        const endMessageElement = document.getElementById('end-message');
        endMessageElement.style.display = 'none';

        // Reset the game
        this.initGame();
    }
}

class GameMemento {
    constructor(gridMap, turn, history, redoStack, gameOver, humanPlayer, iaPlayer) {
        this.gridMap = gridMap;
        this.turn = turn;
        this.history = history;
        this.redoStack = redoStack;
        this.gameOver = gameOver;
        this.humanPlayer = humanPlayer;
        this.iaPlayer = iaPlayer;
    }
}

class GameCaretaker {
    static save(memento) {
        localStorage.setItem('morpionGameState', JSON.stringify(memento));
    }

    static load() {
        const savedState = localStorage.getItem('morpionGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            return new GameMemento(
                gameState.gridMap,
                gameState.turn,
                gameState.history,
                gameState.redoStack,
                gameState.gameOver,
                gameState.humanPlayer,
                gameState.iaPlayer
            );
        }
        return null;
    }
}
