import { CustomCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
// import { QuaternaryEntry, theory } from "./api/Theory";
import { Utils } from "./api/Utils";
import { Popup } from "../api/ui/Popup";
import { ImageSource } from "../api/ui/properties/ImageSource";
import { Thickness } from "../api/ui/properties/Thickness";
import { ui } from "../api/ui/UI"

var id = "weyl-groups";
var name = "Weyl Groups";
var description = "Build longer words to progress faster!\n\nA word w is an element of a Weyl group W, and it is a sequence of letters a through h.";
var authors = "Jackson Hopper";
var version = 0.4;

// theory variables
var currency; // rho
var q1, q2; // normal q variables
const letterUpgrades = []; // letters that make up the word
var algTypeD; // milestone upgrade for type D
var algTypeB; // milestone upgrade for type B
var algTypeE; // milestone upgrade for type E
var wRank; // milestone upgrade for rank -- level 0 is rank 3, up to level 5 for rank 8
var letterAutoBuyer; // permanent upgrade used to make letter auto-buyer available
var bufferButton; // singular upgrade used to open up the field where player inputs buffer string

// state variables
var q; // a typical q variable
var group; // an object of type WeylGroup
var letterAutoBuyerCount; // controls the letter auto-buyer
var bufferState = ""; // auto-buyer for letters
var saveWord = true;
var actuallyBuying; // to distinguish between backend level resetting and intentional "buying"

// UI variables
var page; // controls the primary, secondary, and tertiary equations
var rightArrow; // when touched, page++
var leftArrow; // when touched, page--
var equationOverlay; // object of type View to hold right and left arrows
var bufferPopup; // This popup asks the player to enter a buffer string for the letter auto-buyer
var bufferPopupLabel; // Label on the buffer popup; declared for dynamic text
var bufferPopupEntry; // Field on the buffer popup; declared for dynamic text
var tempText = ""; // For use in saving user input
var bufferErrorPopup; // Appears if attempted input of invalid buffer string
var errorLabel;
var saveWordSwitch;

// achievement variables
var highestLetter;

// free rho variables
var freeE10Rho;
var timesClickedFreeE10Rho = 0;

// tick variables -- declared here to avoid re-declaring every tick
// anyone who actually codes for a living feel free to weigh in on this, but I think this is faster
var letterToBuy;
var upgradeToBuy;
var diff;

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
                     [  0,  0,  0, 16, 25, 36, 49, 64],
                     [  0,  0,  0,  0,  0, 36, 63,120]]; // spoiler warning, lol
const LONGEST_WORDS = [ "010210321043210543210654321076543210",
                        "01021031021343102134543102134565431021345676543102134567",
                        "0101210123210123432101234543210123456543210123456765432101234567",
                        "010210321042103214235421032142354210654210321423542106542132456765421032142354210654213245676542103214235421065421324567"]; // super spoiler warning

var init = () => 
{
    currency = theory.createCurrency();

    ///////////////////
    // Upgrades -- these include q1, q2, and letter variables
    {
        var getQ1Info = (level) => "q_1 = " + getQ1(level).toString(0);
        q1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(2, 1)));
        q1.getDescription = (_) => 
        {
            let result = "";
            result += Utils.getMath(getQ1Info(q1.level));
            return result;
        }
        q1.getInfo = (amount) => Utils.getMathTo(getQ1Info(q1.level), getQ1Info(q1.level + amount));

        var getQ2Info = (level) => "q_2 = " + getQ2(level).toString(0);
        q2 = theory.createUpgrade(1, currency, new ExponentialCost(10, 1.5 * Math.log2(10)));
        q2.getDescription = (_) => Utils.getMath("q_2 = 2^{" + q2.level + "}");
        q2.getInfo = (amount) => Utils.getMathTo(getQ2Info(q2.level), getQ2Info(q2.level + amount));

        letterUpgrades.push(theory.createUpgrade(100 + 0, currency, new FirstFreeCost(new ExponentialCost(1000, 3 * Math.log2(10)))));
        letterUpgrades.push(theory.createUpgrade(100 + 1, currency, new ExponentialCost(Math.pow(2, Math.PI), 3 * Math.log2(10))));
        letterUpgrades.push(theory.createUpgrade(100 + 2, currency, new ExponentialCost(Math.pow(3, Math.PI), 3 * Math.log2(10))));
        letterUpgrades.push(theory.createUpgrade(100 + 3, currency, new ExponentialCost(Math.pow(4, Math.PI), 3 * Math.log2(10))));
        letterUpgrades.push(theory.createUpgrade(100 + 4, currency, new ExponentialCost(Math.pow(5, Math.PI), 3 * Math.log2(10))));
        letterUpgrades.push(theory.createUpgrade(100 + 5, currency, new ExponentialCost(Math.pow(6, Math.PI), 3 * Math.log2(10))));
        letterUpgrades.push(theory.createUpgrade(100 + 6, currency, new ExponentialCost(Math.pow(7, Math.PI), 3 * Math.log2(10))));
        letterUpgrades.push(theory.createUpgrade(100 + 7, currency, new ExponentialCost(Math.pow(8, Math.PI), 3 * Math.log2(10))));
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

            // When bought, automatically adjusts the levels of all other letters to l(w)
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
                        bufferPopupLabel.text = getBufferMessage();
                    }
                    for (let j=0;j<RANK;j++)
                        {
                            letterUpgrades[j].level = group.word.length;
                        }

                    actuallyBuying = true;
                }
            }

            // defaults to unavailable for i< 3 and not autoBuyable
            letterUpgrades[i].isAvailable = (i < 3);
            letterUpgrades[i].isAutoBuyable = false;
        }
    }

    /////////////////////
    // Permanent Upgrades -- the publisher, buy all button, autobuyer, and also a custom letter auto-buyer
    {
        theory.createPublicationUpgrade(0, currency, 1e10);
        theory.createBuyAllUpgrade(1, currency, 1e13);
        theory.createAutoBuyerUpgrade(2, currency, 1e30);

        letterAutoBuyer = theory.createPermanentUpgrade(3, currency, new CustomCost((_) => BigNumber.from(1e50)));
        letterAutoBuyer.maxLevel = 1;
        letterAutoBuyer.getDescription = (_) => "Letter auto-buyer"; // localize / English
        letterAutoBuyer.getInfo = (_) => "Buffer a string of letters to buy when available"; // localize / English
        letterAutoBuyer.bought = (_) => bufferButton.isAvailable = true;
    }

    //////////////////////
    // Singular upgrade -- the button to open the letter auto-buyer input box
    {
        bufferButton = theory.createSingularUpgrade(0, currency, new FreeCost());
        bufferButton.getDescription = (_) => "Enter a string of letters to auto-buy";
        bufferButton.bought = (_) => 
        {
            if (actuallyBuying)
            {
                actuallyBuying = false;
                bufferButton.level = 0; // I want to not have a level, but this will do for now
                bufferPopupEntry.text = bufferState; // I want to reset the populated text when the popup is shown
                bufferPopup.show();
                actuallyBuying = true;
            }
        }
        bufferButton.isAvailable = false;
    }

    ///////////////////////
    //// Milestone Upgrades
    theory.setMilestoneCost(new LinearCost(2, 2));
    {
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

        algTypeD = theory.createMilestoneUpgrade(1, 1);
        var desc = "Unlock type ";
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

        algTypeB = theory.createMilestoneUpgrade(2, 1);
        desc = "Unlock type ";
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

        algTypeE = theory.createMilestoneUpgrade(3, 1);
        desc = "Unlock type ";
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
    
    /////////////////
    //// Achievements
    // w0A8 = theory.createAchievement(0, "A8", "You found the longest word in A8", () => group.word.length >= 36 && algType.level == 0);
    // achievement2 = theory.createSecretAchievement(1, "Achievement 2", "Description 2", "Maybe you should buy two levels of c2?", () => cList[1].level > 1);

    ///////////////////
    //// Story chapters
    // var chap  = theory.createStoryChapter(0, "Chapter 1", "description", () => group.word.length == 1);

    // state initializations
    {
        page = 0;
        q = BigNumber.ZERO;
        group = new WeylGroup(0);
        letterAutoBuyerCount = 0;
        actuallyBuying = true;
        updateAvailability();
    }

    // UI initializations
    {
        // buffer popup
        bufferPopup = ui.createPopup({
            title: "Letter auto-buyer", // todo : localize
            content: ui.createStackLayout({
                children: [
                    ui.createFrame({
                        padding: new Thickness(11,11),
                        content: bufferPopupLabel = ui.createLatexLabel({
                            text: getBufferMessage(),
                        })
                    }),
                    bufferPopupEntry = ui.createEntry({
                        isSpellCheckEnabled: false,
                        isTextPredictionEnabled: false,
                        text: bufferState,
                        onTextChanged: (_, tempInput) => tempText = tempInput.toLowerCase(),
                        onCompleted: () => 
                        {
                            if (bufferIsValid(tempText)) 
                            {
                                bufferState = tempText;
                                bufferPopup.hide();
                            } else bufferErrorPopup.show();
                            tempText = "";
                        }
                    }),
                    ui.createButton({
                        text: "Set buffer", // localize
                        onClicked: () => 
                        {
                            if (bufferIsValid(tempText)) 
                            {
                                bufferState = tempText;
                                bufferPopup.hide()
                            }
                            else bufferErrorPopup.show();
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
                bufferPopupLabel.text = getBufferMessage();
                bufferPopupEntry.text = bufferState;
                saveWordSwitch.isToggled = saveWord;
            }
        });

        // buffer error message
        bufferErrorPopup = ui.createPopup({
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
                        onClicked: () => bufferErrorPopup.hide()
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

    // debug feature: free rho
    {
        freeE10Rho = theory.createSingularUpgrade(1,currency,new FreeCost());
        freeE10Rho.bought = (amount) => timesClickedFreeE10Rho += amount;
        freeE10Rho.description = "Get \\(e10\\rho\\) free";
    }
}

/**
 * Call whenever "availability" needs to be reevaluated
 * Includes the singular upgrade, letter upgrades, and milestone upgrades
 */
var updateAvailability = () => 
{
    bufferButton.isAvailable = (letterAutoBuyer.level > 0);

    for (let i=3;i<RANK;i++) letterUpgrades[i].isAvailable = (wRank.level + 3 > i);

    algTypeD.isAvailable = (wRank.level > 0);
    algTypeB.isAvailable = (wRank.level > 0 && algTypeD.level > 0);
    algTypeE.isAvailable = (wRank.level > 2 && algTypeB.level > 0);
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
            if (bufferState.length > 0)
            {
                switch (bufferState[0])
                {
                    case "a": {letterToBuy = 0; break;}
                    case "b": {letterToBuy = 1; break;}
                    case "c": {letterToBuy = 2; break;}
                    case "d": {letterToBuy = 3; break;}
                    case "e": {letterToBuy = 4; break;}
                    case "f": {letterToBuy = 5; break;}
                    case "g": {letterToBuy = 6; break;}
                    case "h": {letterToBuy = 7; break;}
                }
                upgradeToBuy = letterUpgrades[letterToBuy];
                diff = currency.value - upgradeToBuy.cost.getCost(upgradeToBuy.level);
                if (diff.sign > -1)
                {
                    upgradeToBuy.buy(1);
                    bufferState = bufferState.slice(1);
                }
            }

            letterAutoBuyerCount -= 1;
        }
    }

    // increase q and rho
    {
        let dt = BigNumber.from(elapsedTime * multiplier);
        let bonus = theory.publicationMultiplier;
        q += dt * getQ1(q1.level) * getQ2(q2.level);
        currency.value += dt * bonus * q * BigNumber.TWO.pow(group.word.length);

        theory.invalidateTertiaryEquation();
    }

    // debug feature: free rho
    {
        if (timesClickedFreeE10Rho > 0)
        {
            currency.value *= BigNumber.from(1e10);
            timesClickedFreeE10Rho--;
        }
    }

    // turn off auto-buy for letters
    for (let i=0;i<RANK;i++) letterUpgrades[i].isAutoBuyable = false;
}

// equation area
{
    /**
     * When page == 0, returns the dot(rho) and dot(q) equations, as well as tau
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
                theory.primaryEquationHeight = 30;

                result += "\\begin{matrix}";

                result += "\\dot{\\rho} = q \\cdot 2^{\\ell(w)}, &";

                result += "\\dot{q} = q_1 q_2, &";

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

        for (let i=0;i<word.length;i++) result += LETTERS[word[i]];

        return result;
    }
    /**
     * When page == 0, returns type and w
     * When page == 1, returns a (probably useless) key to the Dynkin diagram
     * When page == 2, returns a hint to choosing a good letter
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
     * Called when page changes; refreshes visibility of arrow buttons, then returns the Grid holding them
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
    if (saveWord && letterAutoBuyer.level > 0)
    {
        let tempBuffer = getWordString();
        tempBuffer += bufferState;
        bufferState = "";
        for (let i=0;i<tempBuffer.length;i++) bufferState += tempBuffer[i];
    } else bufferState = "";
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
var getPublicationMultiplier = (tau) => tau.pow(1.5);
var getPublicationMultiplierFormula = (symbol) => symbol + "^{1.5}";
var getTau = () => BigNumber.from(currency.value).pow(0.1);
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

// get levels
{
    /**
     * I think Q1 will be stepwise, with 10 steps per doubling
     * @param {number} level 
     * @returns {BigNumber}
     */
    var getQ1 = (level) => BigNumber.from(Utils.getStepwisePowerSum(level,2,10,0));
    /**
     * I think q2 will be exponential, with doubling every purchase
     * @param {number} level 
     * @returns {BigNumber}
     */
    var getQ2 = (level) => BigNumber.TWO.pow(level);

    /**
     * Returns the combined "level" of the "algType" milestone upgrades
     * They have been separated into distinct upgrades to allow proper control of availability
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
     * Saves q, group.word, and letter auto-buyer settings as a string delimited by spaces
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

        // get buffer state and "save word" switch
        result += " ";
        if (bufferState.length > 0) result += bufferState;
        result += " ";
        result += (saveWord) ? 1 : 0;

        return result;
    }
    /**
     * Sets q, re-initializes group and adds the saved word, and re-inputs the letter auto-buyer setting from stateString
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
        bufferState = "";
        if (values.length > 2 && letterAutoBuyer.level > 0) for (let i=0;i<values[2].length;i++) bufferState += values[2][i]; // I don't trust js strings or arrays well enough to populate this string without a for loop
        if (values.length > 3) saveWord = (values[3] == "1") ? true : false;

        // reset other variables
        letterAutoBuyerCount = 0;
        timesClickedFreeE10Rho = 0;
        actuallyBuying = true;
        page = 0;
        updateAvailability();
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
 * Multiplies the matrices very naively; this operation does not need to happen too many times, hopefully
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
    result += " Your current word is:\\\\ \\(\\begin{matrix}";
    if (len == 0) result += "*";

    let i=0;
    while (i < len)
    {
        if (i > 0) result += "\\\\";
        result += rawWordString.slice(i,i+40);
        i += 40;
    }
    result += "\\end{matrix}\\)";

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
     * Returns -1 if the letter makes this.word longer, and returns the drop index if not
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
     * The string should be a string of numbers 0-7, rather than the letters themselves
     * @param {String} wordString 
     */
    addWord(wordString)
    {
        for (let i=0;i<wordString.length;i++) this.addLetter(parseInt(wordString[i]));
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
