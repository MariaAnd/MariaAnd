let memoryArray = ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E', 'F', 'F', 'G', 'G', 'H', 'H', 'I', 'I', 'J', 'J', 'K', 'K', 'L', 'L'];
let memoryValues = [];
let memoryCardIds = [];
let cardsFlipped = 0;
let imageUrl = 'white url(images/donut.png) no-repeat';
let time;

function changeLevel() {
    let levelEasy = document.getElementById('level_easy'); // Checkbox 1
    let levelHard = document.getElementById('level_hard'); // Checkbox 3
    if (levelEasy.checked) {
        memoryArray = ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E', 'F', 'F'];
        document.getElementById('side_bar').style.background = '#fad6e0';
    } else if (levelHard.checked) {
        memoryArray = ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E', 'F', 'F', 'G', 'G', 'H', 'H', 'I', 'I', 'J', 'J', 'K', 'K', 'L', 'L', 'M', 'M', 'N', 'N', 'O', 'O', 'P', 'P', 'R', 'R', 'S', 'S'];
        document.getElementById('side_bar').style.background = '#fad6e0 url(\'images/candies.png\') no-repeat center bottom ';
    } else {
        memoryArray = ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E', 'F', 'F', 'G', 'G', 'H', 'H', 'I', 'I', 'J', 'J', 'K', 'K', 'L', 'L'];
        document.getElementById('side_bar').style.background = '#fad6e0 url(\'images/candies.png\') no-repeat center bottom ';
    }
    generateBoard();
}

Array.prototype.shuffleCards = function () {
    let i = this.length;
    let j;
    let temp;
    while (--i > 0) {
        j = Math.floor(Math.random() * (i + 1));
        temp = this[j];
        this[j] = this[i];
        this[i] = temp;
    }
};

function generateBoard() {
    while (document.getElementById('memory_board').firstChild) {
        document.getElementById('memory_board').removeChild(document.getElementById('memory_board').firstChild);
    }
    clearInterval(time);
    countTime();
    cardsFlipped=0;
    memoryArray.shuffleCards();
    for (let i = 0; i < memoryArray.length; i++) {
        let div = document.createElement('div');
        let divFront = document.createElement('div');
        let divBack = document.createElement('div');
        divFront.className = "card front";
        divFront.id = "card_" + i;
        divFront.style.background = imageUrl;
        divFront.addEventListener("click", function () {
            flipCard(this);
        });
        divBack.innerHTML = memoryArray[i];
        divBack.className = "back";
        divBack.id = "b_card_" + i;
        div.appendChild(divFront);
        div.appendChild(divBack);
        document.getElementById('memory_board').appendChild(div);
    }
}

function flipCard(element) {
    if (memoryValues.length === 2) {
        return;
    }
    element.style.transform = 'perspective( 600px ) rotateY( -180deg )';
    document.getElementById('b_' + element.id).style.transform = 'perspective( 600px ) rotateY( 0deg )';
    if (memoryValues.length < 2) {
        if (memoryValues.length === 0) {
            memoryValues.push(document.getElementById('b_' + element.id).textContent);
            memoryCardIds.push('b_' + element.id);
        } else if (memoryValues.length === 1) {
            memoryValues.push(document.getElementById('b_' + element.id).textContent);
            memoryCardIds.push('b_' + element.id);
            if (memoryValues[0] === memoryValues[1]) {
                cardsFlipped += 2;
                setTimeout(clearMatch, 500);
                // Check to see if the whole board is cleared
                if (cardsFlipped === memoryArray.length) {
                    setTimeout(congratulate, 1000);
                }
            } else {
                setTimeout(flipToBack, 700);
            }
        }
    }
}

function changeCartShirt() {
    let shirtDonut = document.getElementById('shirt_donut'); // Checkbox 1
    let shirtCake = document.getElementById('shirt_cake'); // Checkbox 2
    if (shirtDonut.checked) {
        imageUrl = 'white url(images/donut.png) no-repeat';
    } else if (shirtCake.checked) {
        imageUrl = 'white url(images/cake.png) no-repeat';
    } else {
        imageUrl = 'white url(images/cupcake.png) no-repeat';
    }
    check(imageUrl);
}

function check(img) {
    let elements = document.getElementsByClassName('card');
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.background = img;
    }
}

function clearMatch() {
    document.getElementById(memoryCardIds[0]).style.opacity = "0";
    document.getElementById(memoryCardIds[1]).style.opacity = "0";
    // Clear both arrays
    memoryValues = [];
    memoryCardIds = [];
}

function flipToBack() {
    document.getElementById(memoryCardIds[0]).style.transform = 'perspective( 400px ) rotateY( 180deg )';
    document.getElementById(memoryCardIds[1]).style.transform = 'perspective( 400px ) rotateY( 180deg )';
    document.getElementById(memoryCardIds[0].replace('b_', '')).style.transform = 'perspective( 400px ) rotateY( 0deg )';
    document.getElementById(memoryCardIds[1].replace('b_', '')).style.transform = 'perspective( 400px ) rotateY( 0deg )';
    memoryValues = [];
    memoryCardIds = [];
}

function countTime() {
    let secs = 0;
    time = setInterval(function () {
        secs++;
        document.getElementById('timer').innerHTML = 'Total time: ' + Math.floor(secs / 60) + ':' + secs % 60;
    }, 1000);
}

function congratulate() {
    document.getElementById('overlay_congrats').style.display = 'block';
}