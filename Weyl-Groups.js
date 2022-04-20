import { CompositeCost, CustomCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { Utils } from "./api/Utils";
import { Popup } from "../api/ui/Popup";
import { ImageSource } from "../api/ui/properties/ImageSource";
import { Thickness } from "../api/ui/properties/Thickness";
import { ui } from "../api/ui/UI"

var id = "weyl-groups";
var name = "Weyl Groups";
var description = "Many years have passed since you found infinity. You are sitting in your office, trying not to think about all the people in your department who want you to retire. You know you have more research to give to the world. Out of the corner of your eye, you spot a dusty yellow book, \"Combinatorics of Coxeter Groups,\" by Björner and Brenti. You blow away the dust and flip through a couple pages. Maybe your next great discovery is contained inside...\n\nThis is a theory about Weyl groups, which is to say it's a theory about words. An element of a Weyl group is a word, written using only a handful of letters. In this theory you will have a word, and you will make that word longer by buying letters.\n\nSometimes, when you buy a letter, the word will grow longer, and your income will grow faster. Sometimes, it will make the word shorter, stalling your progress. Which outcome happens follows a complicated set of rules depending on the letters you've already bought—and the order you bought them in.\n\nHere's one hint to get you started: buying the last letter of your word will always make your word shorter.\n\nGood luck, and enjoy!";
var authors = "Jackson Hopper";
var version = 0.6;

// theory variables
var currency; // rho
var q1, q2, q3; // normal q variables
var letterUpgrades = []; // letters that make up the word
var deleteLetterUpgrade; // Upgrade that deletes a letter for free
var algTypeD; // milestone upgrade for type D
var algTypeB; // milestone upgrade for type B
var algTypeE; // milestone upgrade for type E
var wRank; // milestone upgrade for rank -- level 0 is rank 3, up to level 5 for rank 8
var letterAutoBuyerUpgrade; // permanent upgrade used to make letter auto-buyer available
var letterAutoBuyerSettings; // singular upgrade used to open up the field where player inputs buffer string

// state variables
var q; // a typical "q" variable defined by a differential equation, as in T2, T4, T5, and T6 (not like T1 or T7)
var group; // an object of type WeylGroup
var letterAutoBuyerCount; // controls the letter auto-buyer; increments 1.6 times per second, and the letter auto buyer tries to buy a letter every time this is > 1
var letterAutoBuyerString; // auto-buyer for letters
var saveWord = true; // save your word on publishing? works with letter auto-buyer
var actuallyBuying; // to distinguish between backend level resetting and intentional "buying"--whether manual or automatic

// UI variables
var page; // Controls the primary and secondary equations
var rightArrow; // When tapped, page++ // todo: color
var leftArrow; // When tapped, page-- // todo: color
var equationOverlay; // Object of type Grid to hold right and left arrows
var letterAutoBuyerPopup; // This popup allows the player edit settings for the letter auto buyer; declared to call show() and hide()
var letterAutoBuyerPopupLabel; // First label on the letter auto buyer popup; declared for dynamic text
var letterAutoBuyerEntry; // Entry object on the letter auto buyer popup; declared for dynamic text
var tempText = ""; // For use in saving user input in the letter auto buyer popup
var letterAutoBuyerErrorPopup; // Appears if attempted input of invalid buffer string; declared to call show() and hide()
var errorLabel; // Holds message for error popup; declared for dynamic text
var saveWordSwitch; // Toggles saveWord; declared for dynamic toggling // todo -- color

// achievement variables
var longestWordCategory; // Achievement category for longest words
var exploringCategory; // Achievement category for exploring mechanics

var highestLetter; // The latest letter in the alphabet contained in word
var manualBuyStreak; // The number of letters bought manually in a row without deleting a letter
var buyingLastLetter; // Whether the most recent word change was due to buying the last letter in the word
var deletePressed; // Whether the delete button has been pressed
var deleteStreak; // The number of letters deleted in a row without lengthening the word
var isBuyingManually; // True when purchases are not made by the letter auto buyer
var earnAnAPhase; // A number from 0 to 8, corresponding to the number of successfully completed steps in the process of "Earning an A"
// it's a bit complicated, and can be accomplished in 2 ways, depending on whether the last letter is a or not
// if so, simply delete a with the delete button, buy a different letter that lengthens the word, and buy a when possible--but before you can buy b
// if a is not the last letter but it would shorten the word, delete the last letter, buy a so it shortens word, buy 2 more letters lengthening word, then buy a before you can buy b
// todo -- test
var hasBeached; // Does group.word contain the word beached?
var typed8LetterWord; // Is the entry field in the letter auto buyer populated with one of 5 accepted 8+ letter English words?
var editedBufferState; // True when the letter auto buyer setting has been altered

// free rho variables -- to be deleted once balance is sufficiently good
var freeE10Rho;
var timesClickedFreeE10Rho = 0;

// tick variables -- declared here to avoid re-declaring every tick
// anyone who actually codes for a living feel free to weigh in on this, but I think this is faster
// I think one alternative is to declare them in init()?
var letterToBuy;
var upgradeToBuy;

// constants
const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"]
const TYPES = ["A", "D", "B", "E"];
const RANK = 8;
const ID = [[1,0,0,0,0,0,0,0],
            [0,1,0,0,0,0,0,0],
            [0,0,1,0,0,0,0,0],
            [0,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0],
            [0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,1]];
const RHO = [1,1,1,1,1,1,1,1]; // This is the "Weyl vertex" (represented with the basis of fundamental coweights)
// note: the Weyl vertex is conventially called rho, but the player will not see this name for it
const MAX_LENGTHS = [[  1,  3,  6, 10, 15, 21, 28, 36],
                     [  0,  0,  0, 12, 20, 30, 42, 56],
                     [  0,  4,  9, 16, 25, 36, 49, 64],
                     [  0,  0,  0,  0,  0, 36, 63,120]]; // spoiler warning, lol
const LONGEST_WORDS = [ "010210321043210543210654321076543210",
                        "01021031021343102134543102134565431021345676543102134567",
                        "0101210123210123432101234543210123456543210123456765432101234567",
                        "010210321042103214235421032142354210654210321423542106542132456765421032142354210654213245676542103214235421065421324567"]; // super spoiler warning

var init = () => 
{
    currency = theory.createCurrency();

    // Upgrades -- these include q1, q2, letters, and the delete button
    {
        let getQ1Info = (level) => "q_1 = " + getQ1(level).toString(0);
        let q1Cost1 = new FirstFreeCost(new ExponentialCost(0.1481 * Math.log2(10), 0.1481 * Math.log2(10)));
        q1 = theory.createUpgrade(0, currency, q1Cost1);
        // let q1Cost2 = new ExponentialCost(BigNumber.TEN.pow(0.135 * 30) , 0.1315 * Math.log2(10));
        // q1 = theory.createUpgrade(0, currency, new CompositeCost(30, q1Cost1, q1Cost2));
        q1.getDescription = (_) => 
        {
            let result = "";
            result += Utils.getMath(getQ1Info(q1.level));
            return result;
        }
        q1.getInfo = (amount) => Utils.getMathTo(getQ1Info(q1.level), getQ1Info(q1.level + amount));

        let getQ2Info = (level) => "q_2 = " + getQ2(level).toString(0);
        let q2Cost1 = new ExponentialCost(10, Math.log2(10));
        let q2Cost2 = new ExponentialCost(BigNumber.from("e43"), 0.714 * Math.log2(10));
        q2 = theory.createUpgrade(1, currency, new CompositeCost(43, q2Cost1, q2Cost2));
        q2.getDescription = (_) => Utils.getMath("q_2 = 2^{" + q2.level + "}");
        q2.getInfo = (amount) => Utils.getMathTo(getQ2Info(q2.level), getQ2Info(q2.level + amount));

        let getQ3Info = (level) => "q_3 = " + getQ3(level).toString(0);
        q3 = theory.createUpgrade(2, currency, new ExponentialCost(BigNumber.from("e120"), 8 * Math.log2(10)));
        q3.getDescription = (_) => Utils.getMath("q_3 = 2^{" + q3.level + "}");
        q3.getInfo = (amount) => Utils.getMathTo(getQ3Info(q3.level), getQ3Info(q3.level + amount));

        for (let i=0;i<RANK;i++)
        {
            /**
             * Non-cumulative cost function for letters
             * Log of the cost is polynomial, so letters are initially cheap and grow more expensive over time (~e8 near the end of the game)
             * Note that 1.4403 is ln(1000)/ln(121)
             * The offset for each letter is i+1 (this is subject to change)
             * Also, the first a is free
             * @param {number} level 
             * @returns {BigNumber}
             */
            let letterLevelFn_i = (level) => 
            {
                let result = BigNumber.ZERO;

                if (i > 0 || level > 0) result = BigNumber.TEN.pow(Math.pow(level,1.4403));
                result *= BigNumber.from(i + 1);

                return result;
            }
            /**
             * The cumulative cost function for letters prevents you from buying multiple of the same letter
             * @param {number} level 
             * @param {number} amount 
             * @returns {BigNumber}
             */
            let letterCumulativeFn_i = (level, amount) => (amount > 1) ? BigNumber.from ("ee100") : letterLevelFn_i(level);
            // /** // todo : debug
            //  * The max level function for letters clamps to 1
            //  * @param {number} level 
            //  * @param {BigNumber} currencyAvailable 
            //  * @returns {number}
            //  */
            // let letterMaxFn_i = (level, currencyAvailable) =>
            // {
            // //     let diff = currencyAvailable - letterLevelFn_i(level);

            //     return (currencyAvailable > letterLevelFn_i(level)) ? 1 : 0;
            // }
            
            // the fully custom cost function is a little broken, at least as I'm using it
            // basically it seems the game uses multiple methods to determine what the max purchasable
            //      level of an upgrade is, including the max function. Worse, even if I tell it the
            //      max is 1, if it disagrees or something, it will simply not do anything at all when
            //      you try to buy a level if you have max set
            let letterMaxFn_i = (_,__) => 0;
            let customLetterFn_i = new CustomCost(letterLevelFn_i, letterCumulativeFn_i, letterMaxFn_i);

            letterUpgrades.push(theory.createUpgrade(100 + i, currency, customLetterFn_i));
        }

        for (let i=0;i<RANK;i++) 
        {
            letterUpgrades[i].description = "Letter " + Utils.getMath(LETTERS[i] + "\\ "); // the "f" box cuts off the right side if you don't add a space after
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

            /** 
             * When bought, automatically adjusts the levels of all other letters to l(w)
             * Also, if actuallyBuying, then updates deletePressed, deleteStreak, manualBuyStreak, and buyingLastLetter, and calls updateAchievements
             * todo: test
             * todo: update earningAnAPhase
             * Possible todo: let the player know which letter was deleted?
             * Note: assumes amount == 1, because of the way the cost function is written
             * @param {number} _
             */
            letterUpgrades[i].bought = (_) =>
            {
                if (actuallyBuying)
                {
                    actuallyBuying = false;

                    deletePressed = false;
                    let oldLength = group.word.length;
                    // note addLetterResult is the index of the dropped letter, or -1
                    let addLetterResult = group.addLetter(i);

                    theory.invalidateSecondaryEquation();
                    theory.invalidateTertiaryEquation();
                    letterAutoBuyerPopupLabel.text = getBufferMessage();

                    if (addLetterResult > -1)
                    {
                        deleteStreak++;
                        manualBuyStreak = 0;
                        buyingLastLetter = (addLetterResult == oldLength - 1);
                    } else
                    {
                        deleteStreak = 0;
                        manualBuyStreak = (isBuyingManually) ? manualBuyStreak + 1 : 0;
                        buyingLastLetter = false;
                    }

                    // update earnAnAPhase
                    // in phase 2, buying an a to shorten word increases earnAnAPhase
                    // in phases 3, 4, and 6, buying something that's not an a to lengthen word increases earnAnAPhase; phase 7 follows phase 4
                    // in phase 7, buying a while b is unattainable increases earnAnAPhase
                    // if phase 8 is reached, it is preserved
                    // other moves will reset the phase to 0
                    switch (earnAnAPhase)
                    {
                        case 2:
                            earnAnAPhase = (i == 0) ? 3 : 0;
                            break;
                        case 3:
                            earnAnAPhase = (deleteStreak < 1 && i != 0) ? 4 : 0;
                            break;
                        case 4:
                            earnAnAPhase = (deleteStreak < 1 && i != 0) ? 7 : 0;
                            break;
                        case 6:
                            earnAnAPhase = (deleteStreak < 1 && i != 0) ? 7 : 0;
                            break;
                        case 7:
                            let bCost = letterUpgrades[1].cost.getCost(letterUpgrades[1].level);
                            earnAnAPhase = (i == 0 && currency.value < bCost) ? 8 : 0;
                            break;
                        case 8: break;
                        default:
                            earnAnAPhase = 0;
                            break;
                    }

                    updateAchievements();

                    for (let j=0;j<RANK;j++)
                    {
                        letterUpgrades[j].level = group.word.length;
                    }

                    actuallyBuying = true;
                }
            }

            // defaults to unavailable for i > 3 and not autoBuyable for all i
            letterUpgrades[i].isAvailable = (i < 3);
            letterUpgrades[i].isAutoBuyable = false;
        }

        deleteLetterUpgrade = theory.createUpgrade(200, currency, new FreeCost());
        deleteLetterUpgrade.description = "Delete the last letter"; // todo: written in English; localize
        deleteLetterUpgrade.getInfo = (_) =>
        {
            let result = "";
            if (group.word.length > 0)
            {
                result += "Remove letter ";
                result += Utils.getMath(LETTERS[group.word[group.word.length - 1]] + "\\ ");
            } else
            {
                result += "No effect";
            }

            return result;
        }
        /**
         * Deletes last letter and updates levels self and all letters
         * Updates achievement variables deletePressed, deleteStreak, manualBuyStreak, and buyingLastLetter, and calls updateAchievements
         * todo: test
         * todo: update earningAnAPhase
         * @param {number} _ 
         */
        deleteLetterUpgrade.bought = (_) =>
        {
            if (group.word.length > 0 && actuallyBuying)
            {
                actuallyBuying = false;
            
                group.addLetter(group.word[group.word.length - 1]);
                for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
                theory.invalidateSecondaryEquation();
                theory.invalidateTertiaryEquation();
                updateAvailability();

                deletePressed = true;
                deleteStreak++;
                manualBuyStreak = 0;
                buyingLastLetter = false;

                // update earnAnAPhase: deleting a letter takes you from phase 1 to 2 or from phase 5 to 6
                // if phase 8 is reached, it is preserved
                // otherwise, it resets to 0
                switch(earnAnAPhase)
                {
                    case 1:
                        earnAnAPhase = 2;
                        break;
                    case 5:
                        earnAnAPhase = 6;
                        break;
                    case 8: break;
                    default:
                        earnAnAPhase = 0;
                        break;
                }

                updateAchievements();

                actuallyBuying = true;
            }
            deleteLetterUpgrade.level = 0;
        }
        deleteLetterUpgrade.isAutoBuyable = false;
    }

    // Permanent Upgrades -- the publisher, buy all button, autobuyer, and also a custom letter auto-buyer
    {
        theory.createBuyAllUpgrade(1, currency, BigNumber.from("1e6"));
        theory.createPublicationUpgrade(0, currency, BigNumber.from("e13"));
        theory.createAutoBuyerUpgrade(2, currency, BigNumber.from("1e20"));

        letterAutoBuyerUpgrade = theory.createPermanentUpgrade(3, currency, new CustomCost((_) => BigNumber.from(1e50)));
        letterAutoBuyerUpgrade.maxLevel = 1;
        letterAutoBuyerUpgrade.getDescription = (_) => "Letter auto-buyer"; // localize / English
        letterAutoBuyerUpgrade.getInfo = (_) => "Buffer a string of letters to buy when available"; // localize / English
        letterAutoBuyerUpgrade.bought = (_) => letterAutoBuyerSettings.isAvailable = true;
    }

    // Singular Upgrade -- the button to open the letter auto-buyer input box
    {
        letterAutoBuyerSettings = theory.createSingularUpgrade(0, currency, new FreeCost());
        letterAutoBuyerSettings.getDescription = (_) => "Enter a string of letters to auto-buy";
        letterAutoBuyerSettings.bought = (_) => 
        {
            if (actuallyBuying)
            {
                actuallyBuying = false;
                letterAutoBuyerSettings.level = 0; // I want to not have a level, but this will do for now
                letterAutoBuyerEntry.text = letterAutoBuyerString; // I want to reset the populated text when the popup is shown
                letterAutoBuyerPopup.show();
                actuallyBuying = true;
            }
        }
        letterAutoBuyerSettings.isAvailable = false;
    }

    // Milestone Upgrades -- These are variables controlling rank and type of W
    {
        /**
         * Milestone cost is based on the rho of the longest word available under the 
         *      second-most optimal milestone route
         * Sometimes, there is additional waiting beyond that
         * The optimal milestone route is 1/1/1/2/1/1/3/4
         * The "second-most optimal" routes are 1/2/1/1/3/1/4/1 and 1/1/1/1/1/2/3/4
         * The assumed longest words, according to the second-most optimal routes, are of lengths
         *      6,10,12,20,30,36,49,63,120 or 6,10,15,21,28,36,51,64,120, respectively
         * Correspondingly, by approximately taking the power of the minimum of each point in the sequence,
         *      sometimes after adding 1, we have the milestone costs
         * I could change my mind about how long some wait times are, but the idea is set
         * @param {number} level 
         * @returns {number}
         */
        var milestoneCost = (level) =>
        {
            let result = BigNumber.ZERO;

            switch (level)
            {
                case 0: {result = BigNumber.from(1.648); break;}
                case 1: {result = BigNumber.from(2.8); break;}
                case 2: {result = BigNumber.from(4); break;}
                case 3: {result = BigNumber.from(7.5); break;}
                case 4: {result = BigNumber.from(12.2); break;}
                case 5: {result = BigNumber.from(17.4); break;}
                case 6: {result = BigNumber.from(28); break;}
                case 7: {result = BigNumber.from(40); break;}
            }

            return result;
        }
        theory.setMilestoneCost(new CustomCost(milestoneCost));

        wRank = theory.createMilestoneUpgrade(0, 5);
        wRank.getDescription = (_) => 
        {
            let result = "Unlock the letter "; // English

            result += Utils.getMath(LETTERS[Math.min(wRank.level + 3, RANK - 1)]);

            return result;
        }
        wRank.getInfo = (_) => Localization.getUpgradeIncCustomInfo("n","1");
        wRank.bought = (_) =>
        {
            if (actuallyBuying)
            {
                actuallyBuying = false;
                if (wRank.level < 1) algTypeD.level = 0;
                if (wRank.level < 1) algTypeB.level = 0;
                if (wRank.level < 3) algTypeE.level = 0;
                for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
                actuallyBuying = true;
            
                theory.invalidatePrimaryEquation();
                theory.invalidateSecondaryEquation();
                updateAvailability();
            }
        }
        wRank.refunded = (_) =>
        {
            if (actuallyBuying)
            {
                actuallyBuying = false;
                if (wRank.level < 1) algTypeD.level = 0;
                if (wRank.level < 1) algTypeB.level = 0;
                if (wRank.level < 3) algTypeE.level = 0;
                group.eraseLettersAfter(wRank.level + 2);
                for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
                actuallyBuying = true;
            
                theory.invalidatePrimaryEquation();
                theory.invalidateSecondaryEquation();
                updateAvailability();
            }
        }
        wRank.canBeRefunded = (amount) =>
        {
            result = false;

            switch(getAlgTypeLevel())
            {
                case 0:
                {
                    result = true;
                    break;
                }
                case 1:
                {
                    result = (wRank.level - amount > 0);
                    break;
                }
                case 2:
                {
                    result = (wRank.level - amount > 0);
                    break;
                }
                case 3:
                {
                    result = (wRank.level - amount > 2);
                    break;
                }
            }

            return result;
        }

        // algTypeD
        {
            algTypeD = theory.createMilestoneUpgrade(1, 1);
            let desc = "Unlock type ";
            desc += Utils.getMath("D_n");
            algTypeD.description = desc;
            algTypeD.info = desc;
            algTypeD.boughtOrRefunded = (_) => 
            {
                if (actuallyBuying)
                {
                    actuallyBuying = false;
                    if (algTypeD.level < 1)
                    {
                        algTypeB.level = 0;
                        algTypeE.level = 0;
                    }
                    group.changeType(getAlgTypeLevel(),wRank.level+2);
                    for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
                    actuallyBuying = true;

                    theory.invalidatePrimaryEquation();
                    theory.invalidateSecondaryEquation();
                    updateAvailability();
                }
            }
            algTypeD.isAvailable = false;
            algTypeD.canBeRefunded = (_) => (getAlgTypeLevel() < 2);
        }

        // algTypeB
        {
            algTypeB = theory.createMilestoneUpgrade(2, 1);
            let desc = "Unlock type ";
            desc += Utils.getMath("B_n");
            algTypeB.description = desc;
            algTypeB.info = desc;
            algTypeB.boughtOrRefunded = (_) => 
            {
                if (actuallyBuying)
                {
                    actuallyBuying = false;
                    if (algTypeB.level < 1)
                    {
                        algTypeE.level = 0;
                    }
                    group.changeType(getAlgTypeLevel(),wRank.level+2);
                    for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
                    actuallyBuying = true;
                    
                    theory.invalidatePrimaryEquation();
                    theory.invalidateSecondaryEquation();
                    updateAvailability();
                }
            }
            algTypeB.isAvailable = false;
            algTypeB.canBeRefunded = (_) => (getAlgTypeLevel() < 3);
        }

        // algTypeE
        {
            algTypeE = theory.createMilestoneUpgrade(3, 1);
            let desc = "Unlock type ";
            desc += Utils.getMath("E_n");
            algTypeE.description = desc;
            algTypeE.info = desc;
            algTypeE.boughtOrRefunded = (_) => 
            {
                if (actuallyBuying)
                {
                    actuallyBuying = false;
                    group.changeType(getAlgTypeLevel(),wRank.level+2);
                    for (let i=0;i<RANK;i++) letterUpgrades[i].level = group.word.length;
                    actuallyBuying = true;
                    
                    theory.invalidatePrimaryEquation();
                    theory.invalidateSecondaryEquation();
                    updateAvailability();
                }
            }
            algTypeE.isAvailable = false;
        }
    }
    
    // Achievements
    // todo: localize, obviously
    // todo: test achievement variables
    {
        longestWordCategory = theory.createAchievementCategory(0, "Longest words");
        exploringCategory = theory.createAchievementCategory(1, "Exploring mechanics");

        // exploration achievements
        {
            theory.createAchievement(100, exploringCategory, "Never buy the last letter", "Delete a letter buy buying the last letter in your word", () => buyingLastLetter && deleteStreak > 0);
            theory.createAchievement(101, exploringCategory, "Why is this so complicated?", "Delete a letter by buying a letter other than the last letter", () => !buyingLastLetter && deleteStreak > 0 && !deletePressed);
            theory.createAchievement(102, exploringCategory, "Why do we even have that button?", "Delete a letter by clicking the \"Delete a letter\" button", () => deleteStreak > 0 && deletePressed);
            theory.createAchievement(103, exploringCategory, "Did you mean to do that?", "Delete your whole word", () => deleteStreak >= 5 && group.word.length == 0);
            theory.createAchievement(104, exploringCategory, "You're getting better at this", "Manually buy 5 letters in a row without deleting any", () => manualBuyStreak > 4);
            theory.createAchievement(105, exploringCategory, "Take a hint", "Manually buy 20 letters in a row without deleting any", () => manualBuyStreak > 19);
            theory.createAchievement(106, exploringCategory, "Customize the auto-buyer", "Change the settings on the letter auto buyer", () => editedBufferState);
            theory.createAchievement(107, exploringCategory, "Careful how you set that!", "Delete a letter with the letter auto buyer", () => deleteStreak > 0 && !deletePressed && !isBuyingManually);
            theory.createAchievement(108, exploringCategory, "Earn an A", "Rearrange your word to buy an \"a\"", () => earnAnAPhase == 8);
        }

        // longest word achievements
        {
            theory.createAchievement(0, longestWordCategory, "Longest word in A₂", "Find the longest word in A₂", () => getAlgTypeLevel() == 0 && highestLetter == 1 && group.word.length >= MAX_LENGTHS[0][1]);
            theory.createAchievement(1, longestWordCategory, "Longest word in A₃", "Find the longest word in A₃", () => getAlgTypeLevel() == 0 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[0][2]);
            theory.createAchievement(2, longestWordCategory, "Longest word in A₄", "Find the longest word in A₄", () => getAlgTypeLevel() == 0 && highestLetter == 3 && group.word.length >= MAX_LENGTHS[0][3]);
            theory.createAchievement(3, longestWordCategory, "Longest word in A₅", "Find the longest word in A₅", () => getAlgTypeLevel() == 0 && highestLetter == 4 && group.word.length >= MAX_LENGTHS[0][4]);
            theory.createAchievement(4, longestWordCategory, "Longest word in A₆", "Find the longest word in A₆", () => getAlgTypeLevel() == 0 && highestLetter == 5 && group.word.length >= MAX_LENGTHS[0][5]);
            theory.createAchievement(5, longestWordCategory, "Longest word in A₇", "Find the longest word in A₇", () => getAlgTypeLevel() == 0 && highestLetter == 6 && group.word.length >= MAX_LENGTHS[0][6]);
            theory.createAchievement(6, longestWordCategory, "Longest word in A₈", "Find the longest word in A₈", () => getAlgTypeLevel() == 0 && highestLetter == 7 && group.word.length >= MAX_LENGTHS[0][7]);

            theory.createAchievement(10, longestWordCategory, "Longest word in D₄", "Find the longest word in D₄", () => getAlgTypeLevel() == 1 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[1][3]);
            theory.createAchievement(11, longestWordCategory, "Longest word in D₅", "Find the longest word in D₅", () => getAlgTypeLevel() == 1 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[1][4]);
            theory.createAchievement(12, longestWordCategory, "Longest word in D₆", "Find the longest word in D₆", () => getAlgTypeLevel() == 1 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[1][5]);
            theory.createAchievement(13, longestWordCategory, "Longest word in D₇", "Find the longest word in D₇", () => getAlgTypeLevel() == 1 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[1][6]);
            theory.createAchievement(14, longestWordCategory, "Longest word in D₈", "Find the longest word in D₈", () => getAlgTypeLevel() == 1 && highestLetter == 7 && group.word.length >= MAX_LENGTHS[1][7]);

            theory.createAchievement(20, longestWordCategory, "Longest word in B₂", "Find the longest word in B₂", () => getAlgTypeLevel() == 2 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[2][1]);
            theory.createAchievement(21, longestWordCategory, "Longest word in B₃", "Find the longest word in B₃", () => getAlgTypeLevel() == 2 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[2][2]);
            theory.createAchievement(22, longestWordCategory, "Longest word in B₄", "Find the longest word in B₄", () => getAlgTypeLevel() == 2 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[2][3]);
            theory.createAchievement(23, longestWordCategory, "Longest word in B₅", "Find the longest word in B₅", () => getAlgTypeLevel() == 2 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[2][4]);
            theory.createAchievement(24, longestWordCategory, "Longest word in B₆", "Find the longest word in B₆", () => getAlgTypeLevel() == 2 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[2][5]);
            theory.createAchievement(25, longestWordCategory, "Longest word in B₇", "Find the longest word in B₇", () => getAlgTypeLevel() == 2 && highestLetter == 2 && group.word.length >= MAX_LENGTHS[2][6]);
            theory.createAchievement(26, longestWordCategory, "Longest word in B₈", "Find the longest word in B₈", () => getAlgTypeLevel() == 2 && highestLetter == 7 && group.word.length >= MAX_LENGTHS[2][7]);

            theory.createAchievement(30, longestWordCategory, "Longest word in E₆", "Find the longest word in E₆", () => getAlgTypeLevel() == 3 && highestLetter == 5 && group.word.length >= MAX_LENGTHS[3][5]);
            theory.createAchievement(31, longestWordCategory, "Longest word in E₇", "Find the longest word in E₇", () => getAlgTypeLevel() == 3 && highestLetter == 6 && group.word.length >= MAX_LENGTHS[3][6]);
            theory.createAchievement(32, longestWordCategory, "Longest word in E₈", "Find the longest word in E₈", () => getAlgTypeLevel() == 3 && highestLetter == 7 && group.word.length >= MAX_LENGTHS[3][7]);
        }

        // secret achievements
        {
            theory.createSecretAchievement(200, "Headache", "Type a common 8-letter English word in the letter auto buyer", "Have some fun in the letter auto buyer settings", () => typed8LetterWord);
            // beachhead, beheaded, cabbaged, deadhead, headache
            theory.createSecretAchievement(201, "Beached", "Have a common 7-letter English word contained in word", "There's a word in my word!", () => hasBeached);
            theory.createSecretAchievement(202, "Master of Weyl groups", "Manually buy all 120 letters of the longest word in E₈ without deleting any or using the auto buyer", "You really need to know your Weyl groups", () => getAlgTypeLevel() == 3 && manualBuyStreak >= 120);
        }
    }

    // Story chapters
    // todo: localize, obviously
    {
        theory.createStoryChapter(0, "Getting Started", "You've done it—you bought your first letter! It always feels so good to start a new project. So far, things are looking pretty good.\nWill this theory always be so easy?", () => group.word.length > 0);
        theory.createStoryChapter(1, "A Little Longer", "Congratulations! You've unlocked a milestone and now your word is longer than was originally possible.\nThings are getting a little more complicated now.\nYou begin to wonder, are there any hints anywhere? If so, what do they mean?", () => group.word.length > 6);
        theory.createStoryChapter(2, "Making Progress", "It looks like the milestones are going well! You're getting a lot of publications out of this theory already. You've still got it in you, after all!\nHave you played with the letter auto buyer?", () => group.word.legnth > 15);
        theory.createStoryChapter(3, "Smooth Sailing", "You're learning about a lot of different types of Weyl groups now.\nYou're pretty confident you can follow this theory to the end, whenever that will be.\nThere's still a lot to learn, but things are starting to make some more sense now.", () => group.word.length > 36);
        theory.createStoryChapter(4, "The Home Stretch", "Wow, you've unlocked all the milestones! You've heard of E₈ before, but you can't remember exactly where...\nYou decide to give it a quick google.", () => group.word.length > 64);
        theory.createStoryChapter(5, "The End of the Game", "You did it! You found the longest word in type E₈! You lean back in your chair and sigh contentedly.\nSurely that's the end of the theory...\nRight?", () => group.word.length > 119);
    }

    // State initializations
    {
        page = 0;
        q = BigNumber.ZERO;
        group = new WeylGroup(0);
        letterAutoBuyerCount = 0;
        actuallyBuying = true;
        updateAvailability();
        letterAutoBuyerString = "";

        // achievement states
        highestLetter = 0;
        manualBuyStreak = 0;
        buyingLastLetter = false;
        deletePressed = false;
        deleteStreak = 0;
        isBuyingManually = true; // defaults to true since the letter auto buyer can turn it off
        earnAnAPhase = 0;
        hasBeached = false;
        typed8LetterWord = false;
        editedBufferState = false;
        updateAchievements();
    }

    // UI initializations
    {
        // letter auto buyer popup
        letterAutoBuyerPopup = ui.createPopup({
            title: "Letter auto-buyer", // todo : localize
            content: ui.createStackLayout({
                children: [
                    ui.createFrame({
                        padding: new Thickness(11,11),
                        content: letterAutoBuyerPopupLabel = ui.createLatexLabel({
                            text: getBufferMessage(),
                        })
                    }),
                    letterAutoBuyerEntry = ui.createEntry({
                        isSpellCheckEnabled: false,
                        isTextPredictionEnabled: false,
                        text: letterAutoBuyerString,
                        onTextChanged: (_, tempInput) => 
                        {
                            tempText = tempInput.toLowerCase();
                            switch(tempText)
                            {
                                case "beachhead": typed8LetterWord = true; break;
                                case "beheaded": typed8LetterWord = true; break;
                                case "cabbaged": typed8LetterWord = true; break;
                                case "deadhead": typed8LetterWord = true; break;
                                case "headache": typed8LetterWord = true; break;
                                default: break;
                            }
                        },
                        onCompleted: () => 
                        {
                            if (bufferIsValid(tempText)) 
                            {
                                let oldBufferState = letterAutoBuyerString;
                                letterAutoBuyerString = tempText;
                                editedBufferState = letterAutoBuyerString != oldBufferState;
                                letterAutoBuyerPopup.hide();
                            } else letterAutoBuyerErrorPopup.show();
                            tempText = "";
                        }
                    }),
                    ui.createButton({
                        text: "Set buffer", // localize
                        onClicked: () => 
                        {
                            if (bufferIsValid(tempText)) 
                            {
                                let oldBufferState = letterAutoBuyerString;
                                letterAutoBuyerString = tempText;
                                editedBufferState = letterAutoBuyerString != oldBufferState;
                                letterAutoBuyerPopup.hide()
                            }
                            else letterAutoBuyerErrorPopup.show();
                            tempText = "";
                        }
                    }),
                    ui.createGrid({
                        columnDefinitions: ["*","60"],
                        children: [
                            ui.createFrame({
                                padding: new Thickness(11,11),
                                content: ui.createLatexLabel({
                                    text: "Turn this button on to save your current word when you publish. Otherwise, the buffer will be cleared upon publishing."
                                }),
                                column: 0
                            }),
                            ui.createStackLayout({
                                children: [
                                    ui.createLatexLabel({text: "On"}),
                                    saveWordSwitch = ui.createSwitch({
                                        onTouched: (touch) =>
                                        {
                                            if (touch.type.isReleased())
                                            {
                                                saveWordSwitch.isToggled = !saveWord;
                                                saveWord = saveWordSwitch.isToggled;
                                            }
                                            // todo: add in animation for the arrows to increase subjective responsiveness
                                        },
                                        rotation: 270,
                                        isToggled: saveWord,
                                        column: 1
                                    }),
                                    ui.createLatexLabel({text: "Off"})
                                ],
                                column: 1
                            })
                        ]
                    })
                ]
            }),
            isPeekable: true,
            closeOnBackgroundClicked: true,
            onAppearing: () => 
            {
                letterAutoBuyerPopupLabel.text = getBufferMessage();
                letterAutoBuyerEntry.text = letterAutoBuyerString;
                saveWordSwitch.isToggled = saveWord;
            }
        });

        // letter auto buyer error message
        letterAutoBuyerErrorPopup = ui.createPopup({
            title: "Error: Invalid buffer", // localize
            content: ui.createStackLayout({
                children: [
                    ui.createFrame({
                        padding: new Thickness(10,10),
                        content: errorLabel = ui.createLatexLabel({
                            text: getErrorMessage()
                        })
                    }),
                    ui.createButton({
                        text: "Close", // localize
                        onClicked: () => letterAutoBuyerErrorPopup.hide()
                    }),
                ]
            }),
            closeOnBackgroundClicked: true,
            onAppearing: () => errorLabel.text = getErrorMessage()
        });

        // arrows overlay
        {
            equationOverlay = ui.createGrid({
                columnDefinitions: ["*", "*", "*"],
                rowDefinitions: ["*", "*", "*"],
                children: [
                    leftArrow = ui.createImage({
                        source: ImageSource.ARROW_120,
                        row: 1,
                        column: 0,
                        scale: 0.3,
                        rotation: 270
                    }),
                    rightArrow = ui.createImage({
                        source: ImageSource.ARROW_120,
                        row: 1,
                        column: 2,
                        scale: 0.3,
                        rotation: 90
                    })
                ]
            });
            leftArrow.isVisible = false;
            rightArrow.onTouched = (touch) =>
            {
                if (touch.type.isReleased())
                {
                    page += 1;
                    theory.invalidatePrimaryEquation();
                    theory.invalidateSecondaryEquation();
                    rightArrow.isVisible = (page < 2);
                    leftArrow.isVisible = (page > 0);
                }
            }
            leftArrow.onTouched = (touch) =>
            {
                if (touch.type.isReleased())
                {
                    page -= 1;
                    theory.invalidatePrimaryEquation();
                    theory.invalidateSecondaryEquation();
                    rightArrow.isVisible = (page < 2);
                    leftArrow.isVisible = (page > 0);
                }
            }
        }
    }

    // Alpha feature: free rho
    {
        freeE10Rho = theory.createSingularUpgrade(1,currency,new FreeCost());
        freeE10Rho.bought = (amount) => timesClickedFreeE10Rho += amount;
        freeE10Rho.description = "Alpha feature: Get \\(e10\\rho\\) free";
    }
}

/**
 * Call whenever "availability" needs to be reevaluated
 * Includes the singular upgrade, letter upgrades, and milestone upgrades
 */
var updateAvailability = () => 
{
    letterAutoBuyerSettings.isAvailable = (letterAutoBuyerUpgrade.level > 0);

    for (let i=3;i<RANK;i++) letterUpgrades[i].isAvailable = (wRank.level + 3 > i);

    algTypeD.isAvailable = (wRank.level > 0);
    algTypeB.isAvailable = (wRank.level > 0 && algTypeD.level > 0);
    algTypeE.isAvailable = (wRank.level > 2 && algTypeB.level > 0);
}

/**
 * Updates the achievement variables highestLetter and hasBeached
 * Assumed to be called every time group.addLetter() is called
 * todo: update earningAnAPhase
 */
var updateAchievements = () =>
{
    let word = group.word;
    let tempHighestLetter = 0;
    let beachedLetters = 0;

    for (let i=0;i<word.length;i++)
    {
        let letter = word[i];
        // set highest letter
        tempHighestLetter = Math.max(tempHighestLetter, letter)

        // look for beached (1402743)
        switch (beachedLetters)
        {
            case 0: beachedLetters = (letter == 1) ? 1 : 0; break;
            case 1: beachedLetters = (letter == 4) ? 2 : 0; break;
            case 2: beachedLetters = (letter == 0) ? 3 : 0; break;
            case 3: beachedLetters = (letter == 2) ? 4 : 0; break;
            case 4: beachedLetters = (letter == 7) ? 5 : 0; break;
            case 5: beachedLetters = (letter == 4) ? 6 : 0; break;
            case 6: beachedLetters = (letter == 3) ? 7 : 0; break;
            default: break;
        }
    }
    highestLetter = tempHighestLetter;
    hasBeached = (beachedLetters == 7);

    // update progress in earning an a
    // only kick-starts the process; the rest is handled in buying a letter or the delete button
    switch(earnAnAPhase)
    {
        case 0:
            if (word[word.length - 1] == 0) earnAnAPhase = 5;
            else
            {
                let wRho = multiplyMatrixVector(group.element, RHO);
                earnAnAPhase = (wRho[0] < 0) ? 1 : 0;
            }
            break;
        default: break;
    }
}

/**
 * There are 4 steps in the tick:
 *      1. auto-buy letters from the buffer
 *      2. increase q and rho according to the primary equation, and refresh 3ary equation
 *      3. award free rho if the player touched the free rho button
 *      4. turn off isAutoBuyable for all letter variables
 * @param {number} elapsedTime 
 * @param {number} multiplier 
 */
var tick = (elapsedTime, multiplier) => {
    // auto-buy letters
    {
        letterAutoBuyerCount += elapsedTime * 1.6;

        while (letterAutoBuyerCount > 1)
        {    
            if (letterAutoBuyerString.length > 0)
            {
                switch (letterAutoBuyerString[0])
                {
                    case "0": {letterToBuy = 0; break;}
                    case "1": {letterToBuy = 1; break;}
                    case "2": {letterToBuy = 2; break;}
                    case "3": {letterToBuy = 3; break;}
                    case "4": {letterToBuy = 4; break;}
                    case "5": {letterToBuy = 5; break;}
                    case "6": {letterToBuy = 6; break;}
                    case "7": {letterToBuy = 7; break;}
                    case "a": {letterToBuy = 0; break;}
                    case "b": {letterToBuy = 1; break;}
                    case "c": {letterToBuy = 2; break;}
                    case "d": {letterToBuy = 3; break;}
                    case "e": {letterToBuy = 4; break;}
                    case "f": {letterToBuy = 5; break;}
                    case "g": {letterToBuy = 6; break;}
                    case "h": {letterToBuy = 7; break;}
                    default:
                    {
                        // log("You tried to buy something that's not a letter!");
                        letterToBuy = -1; 
                        break;
                    }
                }
                if (letterToBuy > -1)
                {
                    upgradeToBuy = letterUpgrades[letterToBuy];
                    // diff = currency.value - upgradeToBuy.cost.getCost(upgradeToBuy.level);
                    if (currency.value > upgradeToBuy.cost.getCost(upgradeToBuy.level)) 
                    {
                        isBuyingManually = false;

                        upgradeToBuy.buy(1);
                        letterAutoBuyerString = letterAutoBuyerString.slice(1);

                        isBuyingManually = true;
                    }
                }
            }

            letterAutoBuyerCount -= 1;
        }
    }

    // increase q and rho
    {
        let dt = BigNumber.from(elapsedTime * multiplier);
        let bonus = theory.publicationMultiplier;
        q += dt * getQ1(q1.level) * getQ2(q2.level) * getQ3(q3.level) / BigNumber.TEN;
        currency.value += dt * bonus * q * BigNumber.TWO.pow(group.word.length);

        theory.invalidateTertiaryEquation();
    }

    // alpha feature: free rho
    {
        if (timesClickedFreeE10Rho > 0)
        {
            currency.value *= BigNumber.from(1e10);
            timesClickedFreeE10Rho--;
        }
    }

    // turn off auto-buy for letters and delete button
    for (let i=0;i<RANK;i++) letterUpgrades[i].isAutoBuyable = false;
    deleteLetterUpgrade.isAutoBuyable = false;
}

// equation area
{
    /**
     * When page == 0, returns the dot(rho), dot(q), and tau equations
     * When page == 1, returns the Dynkin diagram of W
     * When page == 2, returns an empty string
     * @returns {String}
     */
    var getPrimaryEquation = () => 
    {
        let result = "";
        switch(page)
        {
            case 0:
            {
                theory.primaryEquationHeight = 40;

                result += "\\begin{matrix}";

                result += "\\dot{\\rho} = q \\cdot 2^{\\ell(w)}, &";

                result += "\\dot{q} = \\displaystyle\\frac{q_1 q_2 q_3}{10}, &";

                result += theory.latexSymbol;
                result += " = \\max{\\rho^{0.1}}";

                result += "\\end{matrix}";
                break;
            }
            case 1:
            {
                result += "\\begin{matrix}";

                switch (getAlgTypeLevel())
                {
                    // type A
                    case 0: 
                    {
                        theory.primaryEquationHeight = 30;

                        result += "a & - & b & - & c";
                        let i = 0;
                        while (i < wRank.level)
                        {
                            result += " & - & ";
                            result += LETTERS[i + 3];

                            i++;
                        }

                        break;
                    }
                    // type D
                    case 1: 
                    {
                        theory.primaryEquationHeight = 60;

                        result += " & & c & &";
                        let i = 1;
                        while (i < wRank.level) 
                        {
                            result += " & &";
                            i++;
                        }
                        result += "\\\\";
                        result += " & & | & &";
                        i = 1;
                        while (i < wRank.level) 
                        {
                            result += " & &";
                            i++;
                        }
                        result += "\\\\";

                        result += "a & - & b & - & d";
                        i = 1;
                        while (i < wRank.level)
                        {
                            result += " & - & ";
                            result += LETTERS[i + 3];

                            i++;
                        }

                        break;
                    }
                    // type B
                    case 2: 
                    {
                        theory.primaryEquationHeight = 30;

                        result += "a & \\Leftarrow & b & - & c & - & d";
                        let i = 1;
                        while (i < wRank.level)
                        {
                            result += " & - & ";
                            result += LETTERS[i + 3];

                            i++;
                        }

                        break;
                    }
                    // type E
                    case 3: 
                    {
                        theory.primaryEquationHeight = 60;

                        result += " & & & & d & & & &";
                        let i = 3;
                        while (i < wRank.level) 
                        {
                            result += " & &";
                            i++;
                        }
                        result += "\\\\";
                        result += " & & & & | & & & &";
                        i = 3;
                        while (i < wRank.level) 
                        {
                            result += " & &";
                            i++;
                        }
                        result += "\\\\";

                        result += "a & - & b & - & c & - & e & - & f";
                        i = 3;
                        while (i < wRank.level)
                        {
                            result += " & - & ";
                            result += LETTERS[i + 3];

                            i++;
                        }

                        break;
                    }
                }

                result += "\\end{matrix}";
                break;
            }
            case 2:
            {
                theory.primaryEquationHeight = 0;
                break;
            }
        }

        return result;
    }

    /**
     * Returns a string representing the word passed in
     * The letters of the returned string are letters "a" through "h"
     * @param {number[]} word 
     * @returns {String}
     */
    var getWordString = (word) => 
    {
        let result = "";

        if (word != null) for (let i=0;i<word.length;i++) result += LETTERS[word[i]];

        return result;
    }
    /**
     * When page == 0, returns type and w
     * When page == 1, returns cryptic and potentially unhelpful key to interpreting the Dynkin diagram
     * When page == 2, returns a hint to choosing a good letter, adapted from the "numbers game" for Coxeter groups
     * @returns {String}
     */
    var getSecondaryEquation = () => 
    {
        let result = "";

        switch(page)
        {
            case 0:
            {
                let actualRank = wRank.level + 3;
                let wordString = getWordString(group.word);
                if (wordString.length == 0) wordString += "*";
                let segmentedWordString = [];
                {
                    segmentedWordString.push(wordString.slice(0,30));
                    if (wordString.length > 30) segmentedWordString.push(wordString.slice(30, 60));
                    if (wordString.length > 60) segmentedWordString.push(wordString.slice(60, 90));
                    if (wordString.length > 90) segmentedWordString.push(wordString.slice(90));
                }
                let SWSLen = segmentedWordString.length;
                theory.secondaryEquationHeight = 50 + SWSLen * 10; // todo: test this height

                result += "\\begin{matrix}";

                result += "\\text{Type} = ";
                result += TYPES[getAlgTypeLevel()];
                result += "_{";
                result += actualRank;
                result += "}";
                result += "\\\\ \\\\";

                result += "w =";
                // print w in up to 4 lines
                {
                    result += "\\begin{array}{l}";

                    result += segmentedWordString[0];

                    if (SWSLen > 1)
                    {
                        result += "\\\\";
                        result += segmentedWordString[1];
                    }
                    if (SWSLen > 2)
                    {
                        result += "\\\\";
                        result += segmentedWordString[2];
                    }
                    if (SWSLen > 3)
                    {
                        result += "\\\\";
                        result += segmentedWordString[3];
                    }

                    result += "\\end{array}";
                }

                result += "\\end{matrix}";
                break;
            }
            case 1:
            {
                result += "\\begin{matrix}";

                result += "x & & y & : & xy=yx \\\\ ";
                result += "x & - & y & : & xyx = yxy \\\\ ";
                result += "x & \\Leftarrow & y & : & xyxy = yxyx";

                result += "\\end{matrix}";

                break;
            }
            case 2:
            {
                let wRho = multiplyMatrixVector(group.element, RHO);

                switch(getAlgTypeLevel())
                {
                    // type A
                    case 0: 
                    {
                        result += "(" + wRho[0] + ")";
                        result += " - (" + wRho[1] + ")";
                        result += " - (" + wRho[2] + ")";
                        let i = 0;
                        while (i < wRank.level)
                        {
                            result += " - (" + wRho[i + 3] + ")";
                            i++;
                        }
                        break;
                    }
                    // type D
                    case 1:
                    {
                        result += "\\begin{array}{rcl}";
                        result += "& (" + wRho[2] + ") &";

                        result += "\\\\";
                        result += "& | &";

                        result += "\\\\";
                        result += "(" + wRho[0] + ")";
                        result += " - & (" + wRho[1] + ") &";
                        result += " - (" + wRho[3] + ")";
                        let i = 1;
                        while (i< wRank.level)
                        {
                            result += " - (" + wRho[i + 3] + ")";
                            i++;
                        }
                        result += "\\end{array}";

                        break;
                    }
                    // type B
                    case 2:
                    {
                        result += "(" + wRho[0] + ")";
                        result += " \\Leftarrow (" + wRho[1] + ")";
                        result += " - (" + wRho[2] + ")";
                        result += " - (" + wRho[3] + ")";

                        let i=1;
                        while (i < wRank.level)
                        {
                            result += " - (" + wRho[i + 3] + ")";
                            i++;
                        }

                        break;
                    }
                    // type E
                    case 3:
                    {
                        result += "\\begin{array}{rcl}";

                        result += "& (" + wRho[3] + ") &";
                        result += "\\\\";

                        result += "& | &";
                        result += "\\\\";

                        result += "(" + wRho[0] + ")";
                        result += " - (" + wRho[1] + ")";
                        result += " - & (" + wRho[2] + ") &";
                        result += " - (" + wRho[4] + ")";
                        result += " - (" + wRho[5] + ")";

                        let i = 3;
                        while (i < wRank.level)
                        {
                            result += " - (" + wRho[i + 3] + ")";
                            i++;
                        }

                        result += "\\end{array}"

                        break;
                    }
                }

                // result += "\\end{matrix}";

                break;
            }
        }

        return result;
    }

    /**
     * Always returns the current values of q and l(w)
     * @returns {String}
     */
    var getTertiaryEquation = () =>
    {
        let result = "q =";
        result += q.toString(1);

        result += ", \\ \\ \\ell(w) = ";
        result += group.word.length;

        return result;
    }

    /**
     * Gets the equation overlay, which is a grid containing the arrow buttons to change pages
     * @returns {Grid}
     */
    var getEquationOverlay = () => equationOverlay;
}

/**
 * Before publishing, adds the current word to the start of the buffer (if set to do so)
 * Otherwise, erases the buffer string (this is the right thing to do)
 */
var prePublish = () => 
{
    if (saveWord && letterAutoBuyerUpgrade.level > 0)
    {
        let tempBuffer = getWordString(group.word);
        tempBuffer += letterAutoBuyerString;
        letterAutoBuyerString = "";
        for (let i=0;i<tempBuffer.length;i++) letterAutoBuyerString += tempBuffer[i];

        log("tempBuffer is " + tempBuffer);
        log(letterAutoBuyerString);
    } else letterAutoBuyerString = "";
}
/**
 * After publishing, updates availability, resets word, resets q, resets 2ary equation
 */
var postPublish = () =>
{
    group = new WeylGroup(getAlgTypeLevel());
    q = BigNumber.ZERO;
    theory.invalidateSecondaryEquation();
    updateAvailability();
}

// publish menu and tau info
{
    var getPublicationMultiplier = (tau) => tau.pow(1.69) / BigNumber.TEN;
    var getPublicationMultiplierFormula = (_) => "\\frac{{" + currency.symbol + "}^{0.169}}{10}";
    var getTau = () => BigNumber.from(currency.value).pow(0.1);
    var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();
    var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(10), currency.symbol];
}

// get values
{
    /**
     * Normal stepwise q1
     * @param {number} level 
     * @returns {BigNumber}
     */
    var getQ1 = (level) => BigNumber.from(Utils.getStepwisePowerSum(level,2,6,0));
    /**
     * Normal doubling q2
     * @param {number} level 
     * @returns {BigNumber}
     */
    var getQ2 = (level) => BigNumber.TWO.pow(level);
    /**
     * Normal doubling q3
     * @param {number} level 
     * @returns {BigNumber}
     */
    var getQ3 = (level) => BigNumber.TWO.pow(level);

    /**
     * Returns the combined "level" of the "algType" milestone upgrades
     * They are separated into distinct upgrades to allow proper control of availability
     * The value returned should be:
     *      0 if type A
     *      1 if type D
     *      2 if type B
     *      3 if type E
     * @returns {number} 
     */
    var getAlgTypeLevel = () =>
    {
        let algTypeLevel = 0;

        algTypeLevel += algTypeD.level;
        algTypeLevel += algTypeB.level;
        algTypeLevel += algTypeE.level;

        return algTypeLevel;
    }
}

// serialization
{
    /**
     * Saves q, group.word, letter auto-buyer settings, and achievement variables as a string delimited by spaces
     * @returns {String}
     */
    var getInternalState = () =>
    {
        // todo: letter auto-buyer counter -- or don't, maybe?

        let result = "";

        // get q
        result += q.toString();

        // get group word
        result += " ";
        if (group.word.length > 0) 
        {
            for (let i=0;i<group.word.length;i++) result += group.word[i];
        }

        // get letter auto buyer setting and "save word" switch
        result += " ";
        result += letterAutoBuyerString;
        result += " ";
        result += (saveWord) ? 1 : 0;

        // get achievement variables
        result += " "; 
        result += manualBuyStreak;
        result += " ";
        result += deleteStreak;
        result += " ";
        result += earnAnAPhase;

        return result;
    }
    /**
     * Sets q, re-initializes group and adds the saved word, re-inputs the letter auto-buyer setting, and sets the achievement variables from stateString
     * Also resets certain variables without a saved value
     * @param {String} stateString 
     */
    var setInternalState = (stateString) =>
    {
        values = stateString.split(" ");

        // set q
        if (values.length > 0) q = BigNumber.from(values[0]);

        // set group word
        group = new WeylGroup(getAlgTypeLevel());
        if (values.length > 1) group.addWord(values[1]);

        // set buffer state
        letterAutoBuyerString = "";
        if (values.length > 2 && letterAutoBuyerUpgrade.level > 0) for (let i=0;i<values[2].length;i++) letterAutoBuyerString += values[2][i]; // I don't trust js strings or arrays well enough to populate this string without a for loop
        if (values.length > 3) saveWord = (values[3] == "1") ? true : false;

        // set achievement variables
        if (values.length > 4) manualBuyStreak = values[4];
        if (values.length > 5) deleteStreak = values[5];
        if (values.length > 6) earnAnAPhase = values[6];

        // reset other variables
        letterAutoBuyerCount = 0;
        timesClickedFreeE10Rho = 0;
        actuallyBuying = true;
        page = 0;
        updateAvailability();

        buyingLastLetter = false;
        deletePressed = false;
        isBuyingManually = true;
        updateAchievements();
    }
}

/**
 * Returns the Cartan matrix corresponding to the type input
 * This matrix is an 8x8 array of numbers, and is useful for the multiply function
 * @param {number} type - The type order is A, D, B, E
 * @returns {number[][]}
 */
var getCartan = (type) =>
{
    let cartan;
    switch (type)
    {
        case 0: // type A
        {
            cartan = [[ 2,-1, 0, 0, 0, 0, 0, 0],
                      [-1, 2,-1, 0, 0, 0, 0, 0],
                      [ 0,-1, 2,-1, 0, 0, 0, 0],
                      [ 0, 0,-1, 2,-1, 0, 0, 0],
                      [ 0, 0, 0,-1, 2,-1, 0, 0],
                      [ 0, 0, 0, 0,-1, 2,-1, 0],
                      [ 0, 0, 0, 0, 0,-1, 2,-1],
                      [ 0, 0, 0, 0, 0, 0,-1, 2]];
            break;
        }
        case 1: // type D
        {
            cartan = [[ 2,-1, 0, 0, 0, 0, 0, 0],
                      [-1, 2,-1,-1, 0, 0, 0, 0],
                      [ 0,-1, 2, 0, 0, 0, 0, 0],
                      [ 0,-1, 0, 2,-1, 0, 0, 0],
                      [ 0, 0, 0,-1, 2,-1, 0, 0],
                      [ 0, 0, 0, 0,-1, 2,-1, 0],
                      [ 0, 0, 0, 0, 0,-1, 2,-1],
                      [ 0, 0, 0, 0, 0, 0,-1, 2]];
            break;
        }
        case 2: // type B
        {
            cartan = [[ 2,-1, 0, 0, 0, 0, 0, 0],
                      [-2, 2,-1, 0, 0, 0, 0, 0],
                      [ 0,-1, 2,-1, 0, 0, 0, 0],
                      [ 0, 0,-1, 2,-1, 0, 0, 0],
                      [ 0, 0, 0,-1, 2,-1, 0, 0],
                      [ 0, 0, 0, 0,-1, 2,-1, 0],
                      [ 0, 0, 0, 0, 0,-1, 2,-1],
                      [ 0, 0, 0, 0, 0, 0,-1, 2]];
            break;
        }
        case 3: // type E
        {
            cartan = [[ 2,-1, 0, 0, 0, 0, 0, 0],
                      [-1, 2,-1, 0, 0, 0, 0, 0],
                      [ 0,-1, 2,-1,-1, 0, 0, 0],
                      [ 0, 0,-1, 2, 0, 0, 0, 0],
                      [ 0, 0,-1, 0, 2,-1, 0, 0],
                      [ 0, 0, 0, 0,-1, 2,-1, 0],
                      [ 0, 0, 0, 0, 0,-1, 2,-1],
                      [ 0, 0, 0, 0, 0, 0,-1, 2]];
            break;
        }
    }

    return cartan;
}

// I never implemented this one, but I might in the future
/**
 * Returns an 8x8 matrix representing the given letter
 * @param {number} type - the type order is A, D, B, E
 * @param {number} letter - the letter a to h
 * @returns {number[][]}
 */
var getLetter = (type, letter) =>
{
    const letterMatrix = [];

    return letterMatrix;
}

/**
 * Returns AB, where A and B are 8x8 matrices
 * Does not validate in any way; assumes both matrices are 8x8, and crashes if they're smaller
 * Multiplies the matrices very naively 
 * @param {number[][]} matrixA
 * @param {number[][]} matrixB
 * @returns {number[][]}
 */
var multiplyMatrices = (matrixA, matrixB) =>
{
    const result = [];

    for (let i=0;i<RANK;i++)
    {
        result.push([]);
        for (let j=0;j<RANK;j++)
        {
            let ijEntry = 0;
            for (let k=0;k<RANK;k++) ijEntry += matrixA[i][k] * matrixB[k][j];
            result[i].push(ijEntry);
        }
    }

    return result;
}

/**
 * Returns Ax, where A is a an 8x8 matrix and x is a length-8 column vector
 * Does not validate in any way; assumes the two arrays are the correct dimension
 * Multiplies the matrices very naively; this operation does not need to happen too many times, hopefully
 * Should return a length-8 array of numbers if x holds numbers, and of BigNumbers if x holds BigNumbers
 * @param {number[][]} matrixA
 * @param {number[]} vectorX
 * @returns {number[]}
 */
var multiplyMatrixVector = (matrixA, vectorX) =>
{
    const result = [];

    for (let i=0;i<RANK;i++)
    {
        result.push([]);
        let iEntry = 0;
        for (let k=0;k<RANK;k++) iEntry += matrixA[i][k] * vectorX[k];
        result[i].push(iEntry);
    }

    return result;
}

/**
 * Returns true if the string is composed of only the letters a purchaseable at the player's current rank, and false otherwise
 * Is case sensitive (assumes the string passed in is all lowercase)
 * @param {String} testText 
 * @returns {boolean}
 */
var bufferIsValid = (testText) =>
{
    let isValid = true;
    let rank = wRank.level;

    let i=0;
    while (isValid && i < testText.length)
    {
        switch(testText[i])
        {
            case "a": break;
            case "b": break;
            case "c": break;
            case "d": 
            {
                if (rank < 1) isValid = false; 
                break;
            }
            case "e": 
            {
                if (rank < 2) isValid = false;
                break;
            }
            case "f": 
            {
                if (rank < 3) isValid = false;
                break;
            }
            case "g": 
            {
                if (rank < 4) isValid = false;
                break;
            }
            case "h": 
            {
                if (rank < 5) isValid = false;
                break;
            }
            default: 
            {
                isValid = false; 
                break;
            }
        }
        i++;
    }

    return isValid;
}

/**
 * Returns the message to be shown in the popup where buffer is input
 * I want this to be dynamic so the player can read the entire word (if they intend to use that information)
 * todo: localize
 * @returns {String}
 */
var getBufferMessage = () =>
{
    let result = "";
    let rawWordString = getWordString(group.word);
    let len = rawWordString.length;
    
    result += "Enter a string of letters (\\(a\\) through \\(";
    result += LETTERS[wRank.level + 2];
    result += "\\)) to automatically buy when available.";
    result += " Your current word is:\\\\ \\(\\begin{array}{l}";
    if (len == 0) result += "*";

    let i=0;
    while (i < len)
    {
        if (i > 0) result += "\\\\";
        result += rawWordString.slice(i,i+40);
        i += 40;
    }
    result += "\\end{array}\\)";

    return result;
}

/**
 * Returns the error message to be shown in the for invalid buffer text
 * todo: localize
 * @returns {String}
 */
var getErrorMessage = () =>
{
    let result = "";
    
    result += "Only use the letters \\(a\\) through \\(";
    result += LETTERS[wRank.level + 2];
    result += "\\)";

    return result;
}

/**
 * WeylGroup holds a reduced word for an element of a Weyl group of rank 8
 *
 * type is an integer 0 to 4 corresponding to the type, in the order A, D, B, E
 * word is an array of integers 0 to 7 representing a reduced word in the Weyl group, with letters corresponding to simple reflections
 * element is an 8x8 matrix representing the element corresponding to word. Specifically, it is the matrix corresponding to the
 *      restriction of the 8-dimensional contragradient representation of the rank-8 group of given type
 * 
 * 
 */
class WeylGroup
{
    /**
     * The type of W: A, D, B, or E; note the rank is actually just 8
     * @type {number}
     */
    type;
    /**
     * The Cartan matrix corresponding to the group W, an 8x8 number array, determined by this.type
     * @type {number[][]}
     */
    cartan;
    /**
     * An arbitrarily long array of numbers, the reduced word for an element of W
     * @type {number[]}
     */
    word;
    /**
     * An 8x8 matrix of numbers representing an element w in W, determined by this.word
     * @type {number[][]}
     */
    element;

    constructor(type)
    {
        this.type = type;

        this.cartan = [];
        let CM = getCartan(type);
        for (let i=0;i<RANK;i++) 
        {
            this.cartan.push([]);
            for (let j=0;j<RANK;j++) this.cartan[i].push(CM[i][j]);
        }

        this.word = [];

        this.element = [];
        for (let i=0;i<RANK;i++)
        {
            this.element.push([]);
            for (let j=0;j<RANK;j++) this.element[i].push(ID[i][j]);
        }
    }

    /**
     * Returns an 8x8 matrix corresponding to the action of w on V
     * @param {number} letter 
     * @returns {number[][]}
     */
    getLetterMatrix(letter)
    {
        const letterMatrix = [];

        for (let i=0;i<RANK;i++)
        {
            letterMatrix.push([]);
            for (let j=0;j<RANK;j++)
            {
                letterMatrix[i].push(ID[i][j]);
                if (letter == j) letterMatrix[i][j] -= this.cartan[i][j];
            }
        }

        return letterMatrix;
    }

    /**
     * Returns an 8x8 matrix corresponding to ws where w is element and s is a letter
     * Note that the letter matrix is multiplied on the left of w; this is an idiosyncratic decision, but I think preserves
     *      in the best way possible the intuitive feel of the theory
     * @param {number} letter
     * @param {number[][]} element
     * @returns {number[][]}
     */
    multiplyLetter(letter,element)
    {
        return multiplyMatrices(this.getLetterMatrix(letter),element);
    }    

    /**
     * Changes this.element and this.word to reflect the addition of a letter to word
     * Preserves the status of this.word being reduced
     * It attempts to keep this.word as similar to the previous word as possible:
     *      Let w be the old word and let x be the letter being added. If wx is reduced, simply
     *      replaces w with wx. If wx is not reduced, there is a unique letter of w that can be 
     *      removed so that the resulting word is equal to wx
     * In the case wx is shorter than w, this algorithm finds the index of the letter to remove and removes it
     * Returns -1 if letter makes this.word longer, and returns the drop index if not
     * @param {number} letter - the letter to multiply
     * @return {number}
     */
    addLetter(letter)
    {
        let dropIndex = -1;
        let wRho = multiplyMatrixVector(this.element, RHO);
        let len = this.word.length;

        if (wRho[letter] < 0) // then we need to find the drop index and create the new reduced word
        // There is exactly one possible letter where skipping the letter in the word for the w is the same as ws
        // wRho is the vector that lets us tell if this is the situation we're in
        {
            // The first step is to set up the process
            // We use two different vectors: sRho and silRho
            // for i=0, we have sRho = letter(RHO), silRho = word[word.length-1](RHO)
            // for successive j, we multiply sRho on the left by s_(i_(j+1)) and silRho by s_(i_j) but we use i
            // let i = 0;
            let sRho = multiplyMatrixVector(this.getLetterMatrix(letter), RHO);
            let currIndex = len - 1;
            let currLetter = this.word[currIndex];
            let silRho = multiplyMatrixVector(this.getLetterMatrix(currLetter), RHO);

            // then compare, for i = 0, sRho with silRho
            // if they're the same, then dropIndex is currIndex
            let flag = true;
            let j=0;
            while (j<RANK && flag)
            {
                flag = (Math.abs(sRho[j] - silRho[j]) < 0.5); // Can't use == and I don't know the proper workaround
                j++;
            }
            if (flag) dropIndex = currIndex;

            // iterate, for other values of i
            while (currIndex > 0 && dropIndex < 0)
            {
                let newSRho = multiplyMatrixVector(this.getLetterMatrix(currLetter), sRho);
                for (let j=0;j<RANK;j++) sRho[j] = newSRho[j];
                // i++;
                currIndex--;
                currLetter = this.word[currIndex];
                let newSilRho = multiplyMatrixVector(this.getLetterMatrix(currLetter),silRho);
                for (let j=0;j<RANK;j++) silRho[j] = newSilRho[j];

                flag = true;
                let j=0;
                while (j<RANK && flag)
                {
                    flag = (Math.abs(sRho[j] - silRho[j]) < 0.5);
                    j++;
                }
                if (flag) dropIndex = currIndex;
            }

            // Finally, we need to remove the letter from word
            this.word.splice(dropIndex, 1);
        }
        else this.word.push(letter);

        let newElement = this.multiplyLetter(letter, this.element);
        for (let i=0;i<RANK;i++) 
        {
            for (let j=0;j<RANK;j++) this.element[i][j] = newElement[i][j];
        }

        return dropIndex;
    }

    /**
     * Adds a string of letters to word and reduces them
     * Runs much faster if the word is already reduced; may cause a timeout if not
     * Caution: The string should be a string of numbers 0-7, rather than the letters themselves
     * This function will ignore letters that are not number 0-7
     * @param {String} wordString 
     */
    addWord(wordString)
    {
        for (let i=0;i<wordString.length;i++) 
        {
            let letter_i = parseInt(wordString[i]);
            if (letter_i > -1 && letter_i < RANK) this.addLetter(letter_i);
        }
    }

    /**
     * Changes the type of W according to the number passed in
     * As opposed to reset(), changeType is intended to be non-destructive of w
     * It determines how close w is to the longest word given the type and rank, then replaces
     *      w with a valid word of the new type, with either the same fraction of progress, or the same length
     * The types are A, D, B, E
     * @param {number} newType 
     * @param {number} rank
     */
    changeType(newType, rank)
    {
        // store old info
        let oldLength = this.word.length;
        let oldType = this.type;

        // decide how long to make the new word
        // I may change this, but the current model is to let the length be the same fraction of the maximum length as the old word
        let fracOfMaxLength = oldLength / MAX_LENGTHS[oldType][rank];
        let newLength = Math.min(Math.floor(MAX_LENGTHS[newType][rank] * fracOfMaxLength), oldLength);
        let newWord = LONGEST_WORDS[newType].slice(0,newLength);

        // reset group
        for (let i=0;i<oldLength;i++) this.word.pop();
        for (let i=0;i<RANK;i++) this.element.pop();
        for (let i=0;i<RANK;i++) 
        {
            this.element.push([]);
            for (let j=0;j<RANK;j++) this.element[i].push(ID[i][j]);
        }

        // change type
        this.type = newType;
        let newCartan = getCartan(newType);
        for (let i=0;i<RANK;i++)
        {
            for (let j=0;j<RANK;j++) this.cartan[i][j] = newCartan[i][j];
        }

        // add a standard word of determined length
        this.addWord(newWord);
    }

    /**
     * Delete letters (this is a misnomer; actually a standard new word is provided with an appropriately chosen number of letters)
     * The number of letters of the new word is the smaller of: the maximum length for its type and rank, and the old number of letters, minus
     *      the old number of letters that are no longer allowed
     * @param {number} newRank 
     */
    eraseLettersAfter(newRank)
    {
        // determine info for setting new word
        let numberInvalidLetters = 0;
        for (let i=0;i<this.word.length;i++)
        {
            if (this.word[i] > newRank) numberInvalidLetters++;
        }
        let newLength = Math.min(this.word.length - numberInvalidLetters, MAX_LENGTHS[this.type][newRank]);
        let newWord = LONGEST_WORDS[this.type].slice(0,newLength);

        // reset word
        let oldLength = this.word.length;
        for (let i=0;i<oldLength;i++) this.word.pop();
        for (let i=0;i<RANK;i++) this.element.pop();
        for (let i=0;i<RANK;i++) 
        {
            this.element.push([]);
            for (let j=0;j<RANK;j++) this.element[i].push(ID[i][j]);
        }

        // add a standard word of determined length
        this.addWord(newWord);
    }
}

init();
