const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

class Card {
    constructor (suit, value, isFaceDown = false) {
        this.suit = suit;
        this.value = value;
        this.score = this.getCardScore(value);
        this.x = canvas.width/2 - 89.5;
        this.y = 125;
        this.isFaceDown = isFaceDown;

        this.img = new Image();
        this.imgLoaded = false;

        let imagePath = `https://raw.githubusercontent.com/Swillycoder/blackjack/main/${this.suit}_${this.value}.png`;
        this.img.src = imagePath;
        this.img.onload = () => {
            this.imgLoaded = true;
        };
        this.backImg = new Image();
        this.backImgLoaded = false;
        this.backImg.src = `https://raw.githubusercontent.com/Swillycoder/blackjack/main/back.png`; // You'll need a card back image
        this.backImg.onload = () => {
            this.backImgLoaded = true;
        };
    }

        getCardScore(value) {
        if (['Jack', 'Queen', 'King'].includes(value)) return 10;
        if (value === '01') return 11; // Ace initially as 11
        return parseInt(value, 10);
    }

    draw() {
        const scale = 0.5;

        if (this.isFaceDown && this.backImgLoaded) {
            const width = this.backImg.width * scale;
            const height = this.backImg.height * scale;
            ctx.drawImage(this.backImg, this.x, this.y, width, height);
        } else if (!this.isFaceDown && this.imgLoaded) {
            const width = this.img.width * scale;
            const height = this.img.height * scale;
            ctx.drawImage(this.img, this.x, this.y, width, height);
        }
    }
}

let buttons = [];
let deck = [];
let currentCard = null;
let playerCards = [];
let dealerCards = [];
let playerScore = 0
let dealerScore = 0;
let twistEnabled = false;
let stickEnabled = false;
let dealerScoreEnabled = false;
let gameResult = null;
let gameOverTime = null;
let playerChips = 10;
let bettingActive = true;
let betAmount = 0;
let potAmount = 0;
let payoutHandled = false;
let dealerInterval = null;
let showPlayerScore = false;

function drawButton(ctx, x, y, width, height, radius, text, textY, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '30px Impact';
    ctx.fillText(text, x + width / 2, y + height / 2 + textY);
}

function createButtons() {
    buttons.length = 0;
    buttons.push({ x: 25, y: 20, width: 200, height: 50, type: 'player' });
    buttons.push({ x: canvas.width/2-100, y: 20, width: 200, height: 50, type: 'chips' });
    buttons.push({ x: canvas.width/2-100, y: 70, width: 200, height: 50, type: 'chipDisplay' });
    buttons.push({ x: 575, y: 20, width: 200, height: 50, type: 'dealer' });
    buttons.push({ x: 25, y: 470, width: 200, height: 50, type: 'stick' });
    buttons.push({ x: 25, y: 535, width: 200, height: 50, type: 'twist' });
    buttons.push({ x: canvas.width/2 - 50, y: 535, width: 100, height: 50, type: 'bet' });
    buttons.push({ x: canvas.width/2 - 50, y: 485, width: 100, height: 50, type: 'betDisplay' });
    buttons.push({ x: canvas.width/2 - 110, y: 535, width: 50, height: 50, type: '<' });
    buttons.push({ x: canvas.width/2 + 60, y: 535, width: 50, height: 50, type: '>' });
    buttons.push({ x: canvas.width/2 - 50, y: 360, width: 100, height: 50, type: 'pot' });
    buttons.push({ x: canvas.width/2 - 50, y: 410, width: 100, height: 50, type: 'potDisplay' });

}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function createDeck() {
    const values = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'Jack', 'Queen', 'King'];
    for (let suit of ['Hearts', 'Diamonds', 'Clubs', 'Spades']) {
        for (let value of values) {
            let card = new Card(suit, value);
            deck.push(card);
        }
    }
}

function dealCards() {
    
    playerCards = [];
    dealerCards = [];

    // Make sure we have enough cards to deal
    if (deck.length >= 4) {
        // Deal 2 cards to player and 2 to dealer
        playerCards.push(deck.pop());
        dealerCards.push(deck.pop()); // First card, face up
        playerCards.push(deck.pop());
        
        let secondDealerCard = deck.pop();
        secondDealerCard.isFaceDown = true; // Face down
        dealerCards.push(secondDealerCard);

        // Set x/y for drawing purposes if needed
        if (playerCards.length >= 2) {
            playerCards[0].x = 75  // Position player's 1st card
            playerCards[0].y = 130
            playerCards[1].x = 75  // Position player's 2nd card
            playerCards[1].y = 280
        }

        if (dealerCards.length >= 2){
            dealerCards[0].x = 635;  // Position dealer's cards
            dealerCards[0].y = 130;
            dealerCards[1].x = 635;  // Position dealer's cards
            dealerCards[1].y = 280
        }
        playerScore = calculateScore(playerCards);
    }
    console.log('Cards dealt:', playerCards.map(c => c.value), 'Score:', playerScore);
}

function calculateScore(cards) {
    let score = 0;
    let aceCount = 0;

for (let card of cards) {
        let val = card.value;

        if (val === 'Jack' || val === 'Queen' || val === 'King') {
            score += 10;
        } else if (val === '01') {
            score += 11;
            aceCount += 1;
        } else {
            score += parseInt(val);
        }
    }

    // Adjust for aces if over 21
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }

    return score;
}

function playerScoreFunc() {
    if (playerCards.length >= 2) {
        ctx.font = '25px Impact';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE ${playerScore}`,120, 435);
    }
}

function dealerScoreFunc() {
    ctx.font = '25px Impact';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE ${dealerScore}`,680, 435);
}

function resultMsg(color, text) {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.fillRect(canvas.width/2 - 150,130,300,60);
    ctx.strokeRect(canvas.width/2 - 150,130,300,60);

    ctx.font = '50px Impact';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width/2,162);
}

function twist() {
    if (deck.length > 0 && twistEnabled) {
        const newCard = deck.pop();
        playerCards.push(newCard);

        // Update position of all player cards
        const i = playerCards.length - 1; // Index of the new card
        newCard.x = 200 + (i - 2) * 30;   // Adjust based on twist count
        newCard.y = 210;

        // Recalculate score
        playerScore = calculateScore(playerCards);

    }
}

function stick() {
    twistEnabled = false;

    if (dealerCards[1]) {
        dealerCards[1].isFaceDown = false;
    }

    // Start revealing dealer cards with delay
    function revealNextCard() {
        if (dealerScore >= 17 || dealerScore >= playerScore) || deck.length === 0) {
            clearInterval(dealerInterval);

            // Delay result calculation
            setTimeout(() => {
                if (dealerScore > 21 || playerScore > dealerScore) {
                    gameResult = 'win';
                } else if (playerScore < dealerScore) {
                    gameResult = 'lose';
                } else {
                    gameResult = 'draw';
                }
                gameOverTime = Date.now();
            }, 1000);
            return;
        }

        const newCard = deck.pop();
        dealerCards.push(newCard);

        const i = dealerCards.length - 1;
        newCard.x = 450 + (i - 2) * 30;
        newCard.y = 210;

        dealerScore = calculateScore(dealerCards);
    }

    const dealerInterval = setInterval(revealNextCard, 1000);
}

function resetGame() {
    // Reset per-game state (but NOT playerChips)
    buttons = [];
    deck = [];
    currentCard = null;
    playerCards = [];
    dealerCards = [];
    playerScore = 0;
    dealerScore = 0;
    twistEnabled = false;
    stickEnabled = false;
    dealerScoreEnabled = false;
    gameResult = null;
    gameOverTime = null;
    bettingActive = true;
    betAmount = 0;
    potAmount = 0;
    payoutHandled = false;
    

    if (dealerInterval) {
        clearInterval(dealerInterval);
        dealerInterval = null;
    }

    // Reinitialize deck and buttons
    createDeck();
    shuffleDeck(deck);
    dealCards();
    createButtons();
    
}

function gameLoop() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(0,0,canvas.width, canvas.height);

    for (let card of playerCards) {
        card.draw();
    }

    for (let card of dealerCards) {
        card.draw();
    }

    for (let btn of buttons) {
    if (btn.type === 'chipDisplay') {
        drawButton(ctx, btn.x, btn.y, btn.width, btn.height, 10, `${playerChips}`, 0, 'orange');
    } else if (btn.type === 'betDisplay') {
        drawButton(ctx, btn.x, btn.y, btn.width, btn.height, 10, `${betAmount}`, 0, 'gold');
    } else if (btn.type === 'potDisplay') {
        drawButton(ctx, btn.x, btn.y, btn.width, btn.height, 10, `${potAmount}`, 0, 'red');
    } else {
        drawButton(ctx, btn.x, btn.y, btn.width, btn.height, 10, btn.type.toUpperCase(), 0, 'blue');
    }
}
    playerScoreFunc();
    dealerScoreFunc();

    if (bettingActive) {
        resultMsg('black', 'PLACE BETS')
    }
    if (twistEnabled) {
        resultMsg('black', 'STICK/TWIST?')
    }

    if (playerScore > 21) {
        resultMsg('red', 'YOU BUST');

        if (!gameOverTime) {
            gameOverTime = Date.now(); // Set the timestamp once
        }

        if (Date.now() - gameOverTime > 1000) {
            resetGame();
            gameOverTime = null; // Reset for next round
            requestAnimationFrame(gameLoop);
            return;
        }
         // Keep looping until 2s pass
        //return;
    }

    if (gameResult) {
            if (gameResult === 'win' && !payoutHandled) {
                playerChips += potAmount;
                payoutHandled = true;
            } else if (gameResult === 'win') {
                resultMsg('green', 'YOU WIN');
            } else if (gameResult === 'lose') {
                resultMsg('red', 'YOU LOSE');
                potAmount = 0;
            } else if (gameResult === 'draw') {
                resultMsg('black', 'DRAW');
            }

            // Reload after 2 seconds
            if (Date.now() - gameOverTime > 2000) {
                resetGame();
                requestAnimationFrame(gameLoop);
                return;
            }
        }

    requestAnimationFrame(gameLoop);
}

createDeck();
shuffleDeck(deck);
dealCards();
createButtons();
gameLoop();

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

        for (let btn of buttons) {
        if (
            mouseX >= btn.x &&
            mouseX <= btn.x + btn.width &&
            mouseY >= btn.y &&
            mouseY <= btn.y + btn.height
        ) {
            if (btn.type === 'twist' && twistEnabled) {
                twist();
            } else if (btn.type === 'stick' && stickEnabled) {
                stick();
          
            }
            if (btn.type === '<' && bettingActive && betAmount > 0) {
                betAmount -= 1;
                playerChips += 1;
            }

            // Right bet button
            if (btn.type === '>' && bettingActive && playerChips >= 1) {
                betAmount += 1;
                playerChips -= 1;
            }
            if (btn.type === 'bet' && bettingActive && betAmount >= 1) {
                potAmount += betAmount * 2;  
                betAmount = 0;
                bettingActive = false;
                twistEnabled = true;
                stickEnabled = true;
            }
    
        }
    }
});
