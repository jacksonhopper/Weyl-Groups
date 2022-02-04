import { CustomCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { QuaternaryEntry, theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "weyl-experimental";
var name = "Weyl Groups";
var description = "Build longer words to progress faster!";
var authors = "Jackson Hopper";
var version = 0.1;

var currency;
const cUpgrades = []; // the upgrades (this may just be a clone of the upgrades array?)
const letterUpgrades = []; // permanent upgrades, forming the backbone of the interest for this theory
var buffer; // auto-buyer for letters
var algType; // the main milestone upgrade
var playerRank; // tracks the chapter and prevents the display from filling up too early
var group; // an object of type WeylGroup
var actuallyBuying; // to distinguish between backroom level resetting and intentional "buying"
const quaternaryEntries = [];

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"]
const TYPES = ["A", "D", "B", "E"];
const RANK = 8;

var init = () => 
{
    currency = theory.createCurrency();

    ///////////////////
    // Regular Upgrades

    // c1
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        cUpgrades.push(theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(30, Math.log2(2)))));
        cUpgrades[0].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[0].level));
        cUpgrades[0].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[0].level), getDesc(cUpgrades[0].level + amount));
        cUpgrades[0].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
    }

    // c2
    {
        let getDesc = (level) => "c_2=" + getC2(level).toString(0);
        cUpgrades.push(theory.createUpgrade(1, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[1].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[1].level));
        cUpgrades[1].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[1].level), getDesc(cUpgrades[1].level + amount));
        cUpgrades[1].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[1].isAvailable = false; // todo : gating
    }

    // c3
    {
        let getDesc = (level) => "c_3=" + getC3(level).toString(0);
        cUpgrades.push(theory.createUpgrade(2, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[2].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[2].level));
        cUpgrades[2].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[2].level), getDesc(cUpgrades[2].level + amount));
        cUpgrades[2].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[2].isAvailable = false;
    }

    // c4
    {
        let getDesc = (level) => "c_4=" + getC4(level).toString(0);
        cUpgrades.push(theory.createUpgrade(3, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[3].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[3].level));
        cUpgrades[3].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[3].level), getDesc(cUpgrades[3].level + amount));
        cUpgrades[3].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[3].isAvailable = false;
    }

    // c5
    {
        let getDesc = (level) => "c_5=" + getC5(level).toString(0);
        cUpgrades.push(theory.createUpgrade(4, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[4].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[4].level));
        cUpgrades[4].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[4].level), getDesc(cUpgrades[4].level + amount));
        cUpgrades[4].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[4].isAvailable = false;
    }

    // c6
    {
        let getDesc = (level) => "c_6=" + getC6(level).toString(0);
        cUpgrades.push(theory.createUpgrade(5, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[5].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[5].level));
        cUpgrades[5].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[5].level), getDesc(cUpgrades[5].level + amount));
        cUpgrades[5].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[5].isAvailable = false;
    }

    // c7
    {
        let getDesc = (level) => "c_7=" + getC7(level).toString(0);
        cUpgrades.push(theory.createUpgrade(6, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[6].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[6].level));
        cUpgrades[6].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[6].level), getDesc(cUpgrades[6].level + amount));
        cUpgrades[6].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[6].isAvailable = false;
    }

    // c8
    {
        let getDesc = (level) => "c_8=" + getC8(level).toString(0);
        cUpgrades.push(theory.createUpgrade(7, currency, new ExponentialCost(15, Math.log2(2))));
        cUpgrades[7].getDescription = (_) => Utils.getMath(getDesc(cUpgrades[7].level));
        cUpgrades[7].getInfo = (amount) => Utils.getMathTo(getDesc(cUpgrades[7].level), getDesc(cUpgrades[7].level + amount));
        cUpgrades[7].boughtOrRefunded = (_) => theory.invalidateQuaternaryValues();
        // cUpgrades[7].isAvailable = false;
    }

    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(RANK, currency, 1e10);
    theory.createBuyAllUpgrade(RANK + 1, currency, 1e13);
    theory.createAutoBuyerUpgrade(RANK + 2, currency, 1e30);
    {
        buffer = theory.createPermanentUpgrade(RANK + 3,currency, new CustomCost((_) => BigNumber.from(1e50)));
        buffer.getDescription = (_) => "Letter auto-buyer"; // localize / English
        buffer.getInfo = (_) => "Buffer a string of letters to buy when available"; // localize / English
        buffer.maxLevel = 1;
    }

    {
        /*
        the rough idea -- obviously subject to improvement via balancing --
        is that how long you have to wait to buy a letter depends on the length of the word,
            and you have to wait longer to buy letters later in the alphabet; potentially significantly longer,
            but not overwhelmingly
        right now it's set at 100^l(w) for an a, and that amount increases quadratically through the alphabet
        */
        letterUpgrades.push(theory.createPermanentUpgrade(0,currency,new FirstFreeCost(new ExponentialCost(100,Math.log2(100)))));
        letterUpgrades.push(theory.createPermanentUpgrade(1,currency,new ExponentialCost(4,Math.log2(100))));
        letterUpgrades.push(theory.createPermanentUpgrade(2,currency,new ExponentialCost(9,Math.log2(100))));
        letterUpgrades.push(theory.createPermanentUpgrade(3,currency,new ExponentialCost(16,Math.log2(100))));
        letterUpgrades.push(theory.createPermanentUpgrade(4,currency,new ExponentialCost(25,Math.log2(100))));
        letterUpgrades.push(theory.createPermanentUpgrade(5,currency,new ExponentialCost(36,Math.log2(100))));
        letterUpgrades.push(theory.createPermanentUpgrade(6,currency,new ExponentialCost(49,Math.log2(100))));
        letterUpgrades.push(theory.createPermanentUpgrade(7,currency,new ExponentialCost(64,Math.log2(100))));
        for (let i=0;i<RANK;i++) 
        {
            letterUpgrades[i].description = Utils.getMath(LETTERS[i] + "\\ "); // the "f" box cuts off the right side if you don't add a space after
            letterUpgrades[i].getInfo = (amount) => 
            {
                let result = "";

                if (amount%2==1) 
                {
                    result += Utils.getMathTo("w", "w" + LETTERS[i] + "\\ "); // the "f" box cuts off the right side if you don't add a space after
                }
                else result += Utils.getMathTo("w","w");

                return result;
            }
            letterUpgrades[i].maxLevel = 120;
            letterUpgrades[i].bought = (amount) =>
            {
                if (actuallyBuying)
                {
                    actuallyBuying = false;

                    if (amount%2==1)
                    {
                        group.addLetter(i); // todo: catch the letter, and let the player know which letter was deleted
                        theory.invalidateSecondaryEquation();
                        theory.invalidateTertiaryEquation();
                        theory.invalidateQuaternaryValues();
                    }
                    for (let j=0;j<RANK;j++)
                        {
                            letterUpgrades[j].level = group.word.length;
                        }

                    actuallyBuying = true;
                }
            }
        }
    }

    ///////////////////////
    //// Milestone Upgrades
    theory.setMilestoneCost(new LinearCost(2.5, 2.5));

    {
        algType = theory.createMilestoneUpgrade(0, 3);
        algType.getDescription = (amount) =>
        {
            let result = "";

            result += "Unlock type ";
            result += Utils.getMath(TYPES[Math.min(algType.level + amount,TYPES.length-1)]);

            return result;
        }
        algType.info = Localization.getUpgradeIncCustomExpInfo("c_1", "0.05");
        algType.boughtOrRefunded = (_) => 
        {
            group.changeType(algType.level);
            actuallyBuying = false;
            for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
            actuallyBuying = true;
            theory.invalidateSecondaryEquation();
            theory.invalidateTertiaryEquation();
            theory.invalidateQuaternaryValues();
        }
    }
    
    /////////////////
    //// Achievements
    // achievement1 = theory.createAchievement(0, "Achievement 1", "Description 1", () => cList[0].level > 1);
    // achievement2 = theory.createSecretAchievement(1, "Achievement 2", "Description 2", "Maybe you should buy two levels of c2?", () => cList[1].level > 1);

    ///////////////////
    //// Story chapters
    // chapter1 = theory.createStoryChapter(0, "My First Chapter", "This is line 1,\nand this is line 2.\n\nNice.", () => cList[0].level > 0);
    // chapter2 = theory.createStoryChapter(1, "My Second Chapter", "This is line 1 again,\nand this is line 2... again.\n\nNice again.", () => cList[1].level > 0);

    group = new WeylGroup(0);
    playerRank = 1;
    actuallyBuying = true;
    updateAvailability();

    currency.level = BigNumber.from(1e150);
}

var updateAvailability = () => {}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier;
    const nVals = getNVals(group.word);
    let sum = BigNumber.ZERO;
    for (let i=0;i<RANK;i++) sum += nVals[i] * nVals[i]; // todo : implement calculation of |lambda - w(lambda)|
    currency.value += dt * bonus * BigNumber.TWO.pow(group.word.length) * BigNumber.from(Math.sqrt(sum));
}

var getPrimaryEquation = () => 
{
    theory.primaryEquationHeight = 60;
    let result = "\\dot{\\rho} = ";
    
    result += "2^{\\ell(w)}";
    result += "\\sqrt{\\textstyle\\sum_{i=1}^8 n_i^2}";

    return result;
}
var getSecondaryEquation = () => 
{
    theory.secondaryEquationHeight = 80;
    theory.secondaryEquationScale = 0.85;
    let result = "";
    let dynkin = [
        "\\begin{matrix}a&-&b&-&c&-&d&-&e&-&f&-&g&-&h\\end{matrix}",
        "\\begin{matrix}a&-&b&-&d&-&e&-&f&-&g&-&h\\\\&&|&&&&&&&&&&\\\\&&c&&&&&&&&&&\\end{matrix}",
        "\\begin{matrix}a&\\Leftarrow &b&-&c&-&d&-&e&-&f&-&g&-&h\\end{matrix}",
        "\\begin{matrix}a&-&b&-&c&-&e&-&f&-&g&-&h\\\\&&&&|&&&&&&&&\\\\&&&&d&&&&&&&&\\end{matrix}"
    ];
    
    result += "\\begin{matrix}\\begin{matrix}";
    result += theory.latexSymbol;
    result += "=\\max\\rho^{0.1}, &";
    result += "\\lambda = \\displaystyle \\sum_{i=1}^8 c_i \\omega _i, \\\\";
    result += "\\lambda - w(\\lambda ) = \\displaystyle \\sum_{i=1}^8 n_i \\omega _i, &";
    result += "\\ell(w) =";
    result += group.word.length;
    result += "\\end{matrix}\\\\ \\\\" // todo : make sum only go to playerRank
    result += dynkin[algType.level];
    result += "\\end{matrix}"

    return result;
}
var wordString = (aWord) =>
{
    let result = "";

    if (aWord.length == 0) result += "*";
    else 
    {
        for (let i=0;i<aWord.length;i++) result += LETTERS[aWord[i]];
    }

    return result;
}
var getTertiaryEquation = () =>
{
    let result = "w=\\begin{array}{l}";
    let rawString = wordString(group.word);

    let i=0;
    while (i<rawString.length && i<30) 
    {
        result += rawString[i];
        i++;
    }
    if (rawString.length > 30) result += "\\\\";
    while (i<rawString.length && i<60)
    {
        result += rawString[i];
        i++;
    }
    if (rawString.length > 30) result += "\\\\";
    while (i<rawString.length && i<90) 
    {
        result += rawString[i];
        i++;
    }
    if (rawString.length > 30) result += "\\\\";
    while (i<rawString.length && i<120)
    {
        result += rawString[i];
        i++;
    }

    result += "\\end{array}"

    return result;
}
var getQuaternaryEntries = () =>
{
    const nVals = getNVals(group.word);
    while (quaternaryEntries.length < RANK)
    {
        let len = quaternaryEntries.length;
        let qeName = "n_{";
        qeName += BigNumber.from(len+1).toString(0);
        qeName += "}";
        let qe = new QuaternaryEntry(qeName, BigNumber.ZERO);
        quaternaryEntries.push(qe);
    }
    for (let i=0;i<quaternaryEntries.length;i++) 
    {
        quaternaryEntries[i].value = nVals[i].toString(0);
    }

    return quaternaryEntries;
}
var getPublicationMultiplier = (tau) => tau.pow(1.5) / BigNumber.THREE;
var getPublicationMultiplierFormula = (symbol) => "\\frac{{" + symbol + "}^{1.5}}{3}";
var getTau = () => BigNumber.from(currency.value).pow(0.1);
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC2 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC3 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC4 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC5 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC6 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC7 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC8 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getNVals = (word) => 
{
    const nVals = [];

    const lambda = [];
    lambda.push(getC1(cUpgrades[0].level));
    lambda.push(getC2(cUpgrades[1].level));
    lambda.push(getC3(cUpgrades[2].level));
    lambda.push(getC4(cUpgrades[3].level));
    lambda.push(getC5(cUpgrades[4].level));
    lambda.push(getC6(cUpgrades[5].level));
    lambda.push(getC7(cUpgrades[6].level));
    lambda.push(getC8(cUpgrades[7].level));

    const wLambda = [];
    for (let i=0;i<RANK;i++) wLambda.push(lambda[i]);

    for (let j=0;j<word.length;j++)
    {
        let letterIndex = (word.length - 1) - j; // acts from the left
        let newWLambda = group.multiply(word[letterIndex], wLambda);
        for (let i=0;i<RANK;i++) wLambda[i] = newWLambda[i];
    }

    for (let i=0;i<RANK;i++) nVals.push(BigNumber.from(lambda[i]-wLambda[i]));

    return nVals;
}

var getInternalState = () =>
{
    let result = "";

    for (let i=0;i<group.word.length;i++) result += group.word[i];

    return result;
}

var setInternalState = (stateString) =>
{
    group.reset(algType.level);
    group.addWord(stateString);
}

/*
Wanted this to be a static method in WeylGroup, but it's not working like I hoped
*/
var getIdentityBoard = () =>
{
    const board = [];

    for (let i=0;i<RANK;i++)
    {
        board.push(1);
    }

    return board;
}

/*
Wanted this to be a static method in WeylGroup, but it's not working like I hoped
*/
/*
Returns the Cartan matrix corresponding to the type input
Remember, the type order is A, D, B, E and the rank is always 8
*/
var getCartan = (type) =>
{
    cartan = [];
    for (let i=0;i<RANK;i++)
    {
        cartan.push([]);
        for (let j=0;j<RANK;j++)
        {
            if (i==j) cartan[i].push(2);
            else if (Math.abs(i-j)==1)
            {
                switch (type)
                {
                    case 0: cartan[i].push(-1); break;
                    case 1: cartan[i].push((i+j==5) ? 0 : -1); break;
                    case 2: cartan[i].push((j==0) ? -2 : -1); break;
                    case 3: cartan[i].push((i+j==7) ? 0 : -1); break;
                }
            } 
            else if (Math.abs(i-j)==2 && type==1 && i+j==4) cartan[i].push(-1);
            else if (Math.abs(i-j)==2 && type==3 && i+j==6) cartan[i].push(-1);
            else cartan[i].push(0);
        }
    }

    return cartan;
}

/*
WeylGroup holds an element of a Weyl group of rank 8

type is an integer 0..4 corresponding to the type, in the order A, D, B, E
word is an array of integers 0..7 representing a reduced word in the Weyl group, with letters corresponding to simple reflections
board is a representation of the element corresponding to word. Specifically, it is a length-8 array of integers corresponding to
    coefficients for fundamental weigths in the element w(rho)
*/
class WeylGroup
{
    type;
    cartan = [];
    word = [];
    board = [];

    constructor(type)
    {
        this.type = type;
        this.cartan = [];
        let CM = getCartan(type);
        for (let i=0;i<RANK;i++) this.cartan[i] = CM[i];
        this.word = [];
        this.board = [];
        let idBoard = getIdentityBoard();
        for (let i=0;i<RANK;i++) this.board[i] = idBoard[i];
    }

    reset(type)
    {
        this.type = type;
        this.cartan = [];
        let CM = getCartan(type);
        for (let i=0;i<RANK;i++) this.cartan[i] = CM[i];
        this.word = [];
        this.board = [];
        let idBoard = getIdentityBoard();
        for (let i=0;i<RANK;i++) this.board[i] = idBoard[i];
    }

    /*
    creates a board corresponding to multiplying an element by a letter
    */
    multiply(letter,board)
    {
        let mult = board[letter];

        for (let j=0;j<RANK;j++) board[j] -= mult * this.cartan[letter][j];

        return board;
    }

    /*
    Changes this.board and this.word to reflect the addition of a letter
    Preserves the status of this.word being reduced
    Returns a -1 if the letter makes this.word longer, and returns the drop index if not
    */
    addLetter(letter) // this needs testing, but it should be more readable than the mainline one
    {
        let dropIndex = -1;

        if (this.board[letter] < 0) // then we need to find the drop index and create the new reduced word
        {
            const sBoard = this.multiply(letter, getIdentityBoard());
            const wBoard = getIdentityBoard();
            var conjLetter;
            let i=0;

            // this while loop is entirely to find the correct dropIndex
            while (i < this.word.length && dropIndex < 0)
            {
                // get sBoard: if letter is s, and word is (s_k_1,s_k_2,...,s_k_l) then
                // sBoard_i corresponds to s * s_k_l * s_k_(l-1) * ... * s_k_((l+1)-i)
                // note sBoard_0 then is just s
                if (i > 0)
                {
                    let newSBoard = this.multiply(conjLetter,sBoard);
                    for (let j=0;j<RANK;j++) sBoard[j] = newSBoard[j];
                }

                conjLetter = this.word[(this.word.length - 1) - i];

                // get wBoard: wBoard_i corresponds to s_k_l * ... * s_k_(l-i)
                let newWBoard = this.multiply(conjLetter,wBoard);
                for (let j=0;j<RANK;j++) wBoard[j] = newWBoard[j];

                //compare sBoard with wBoard: if the two boards are equal, then we need to drop
                let flag = true;
                let k = 0;
                while (k < RANK && flag)
                {
                    if (sBoard[k] != wBoard[k]) flag = false;
                    k++;
                }
                if (flag) dropIndex = (this.word.length - 1) - i;

                i++;
            }

            this.word.splice(dropIndex, 1);
        }
        else this.word.push(letter);

        this.board = this.multiply(letter,this.board);

        return dropIndex;
    }

    addWord(wordString)
    {
        for (let i=0;i<wordString.length;i++) this.addLetter(parseInt(wordString[i]));
    }

    changeType(type)
    {
        let oldWord = [];
        let oldLength = this.word.length;
        for (let i=0;i<oldLength;i++) oldWord.push(this.word[i]);
        for (let i=0;i<oldLength;i++) this.word.pop();
        let idBoard = getIdentityBoard();
        for (let i=0;i<RANK;i++) this.board[i] = idBoard[i];
        this.type = type;
        let newCartan = getCartan(type);
        for (let i=0;i<RANK;i++)
        {
            for (let j=0;j<RANK;j++) this.cartan[i][j] = newCartan[i][j];
        }
        for (let i=0;i<oldLength;i++) this.addLetter(oldWord[i]);
    }
}

init();