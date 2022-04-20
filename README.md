# Weyl-Groups
A custom theory for Exponential Idle where you build long words in Weyl Groups!

This theory is all about Weyl groups. The main component is an element w in a Weyl group W, which can be viewed as a word written using the first few letters of the alphabet. The main goal is to make w longer (i.e. have more letters in it) by carefully selecting and purchasing letters to add on to the end. But be careful—sometimes, insteading of making your word longer, a letter will make it shorter! It is very complicated to tell in advance whether adding a certain letter will make w longer or shorter; I expect a significant amount of trial and error. If you do make w shorter, you can always purchase the same letter you just bought to bring it back to the same length. The longer w is, the faster rho grows—so see how long you can make it!
There is a second element to the theory, a "q" variable to help grow rho between letter purchases. The variable q grows according to a "q-dot" equation, and rho-dot is equal to q times 2^(length(w)). So the main way to make rho grow faster will be to buy letters that make w longer, and q will help grow rho in between letter purchases.

To complicate the theory and allow further progress over time, there are four different types of Weyl groups in use: A, D, B, and E (in that order, with good reason), and rank grows from 3 to 8. The rank is the number of letters you can use to write the word w, and the type affects the relationships between them, determining (in a very complicated way) which letters will increase the length of w, and which will decrease it. For a given type and rank, there is a "longest word," so if you've found the longest word for your given type and rank, you will need to buy a milestone upgrade to make w longer. Whether to change type or increase rank is difficult to know in advance—if you do get stuck, try rearranging your milestones.

An additional and unusual feature of my thoery is a permanent upgrade called "Letter auto-buyer" which lets the player input a string of letters to auto-buy. I added this because the normal auto-buyer would be worthless if applied to letters. If you want to play full idle, you will need to use the letter auto-buyer. The most useful feature of the letter auto-buyer is a setting that automatically buys the current word after publishing, so you don't have to remember it and manually buy the letters every publish. Some players might also find the longest word for their given type and rank in advance, and never have to manually buy letters. On the other hand, some players may find it faster to write a totally new word after publishing, so the "save word" feature can be turned off.

The theory is in alpha, but at this point if you play you will get a good idea how the final version will feel. That said, there is still work to be done. 

Firstly, the balance is passable for a first draft, but it is largely untested. I will improve the balance, so the game gets slower as you progress and does not take too long in the beginning or go too fast in the end. I am still including a free e10 rho button, but I will remove it soon, when I am happy with the balance.

I need to improve the theory's stability—most egregiously, there is an algorithm called "add word" that has the potential to time out the theory, and as it stands the state variable it creates hard locks the theory and deletes all progress. I think the way it is implemented has been improved, so I'm not sure if this kind of disaster is still organically possible, but I have to be more sure before moving to beta. In general, there are many places performance and stability can be improved.

I will implement an endgame feature so the theory isn't totally dead at e100 rho.

Finally, I need to improve the UI overall. Both to increase the usefulness of the hints on pages 2 and 3, but also just to improve the feel and responsiveness of the theory.

I hope the discussion of routing for this theory is active and interesting. Outside of buying letters, the optimal active strategy should be a q doubling, and because the equation is a "q-dot" equation, I hope doubling is not overly important. (Also, the value function for q1 is stepwise, base 2, but without too many steps and its cost has a reasonably large exponential base, especially compared to q2—this should contribute to making doubling less important than it could have been.) I don't feel comfortable enough balancing theories to make promises about the idleness/activeness of the theory in its finished state, but it seems likely they won't be too different. I will ensure that non-optimal idle play will be able to beat the game in reasonable time, but I can't guarantee optimal active play won't beat out optimal idle play.

In contrast to the active strategy, which is just doubling, I believe routing should be pretty interesting. Different letters have different costs, and all available letters will be necessary to build long words. However, there are many different words of a given length, and length is all that matters for the rho equation. For instance, c costs 3 times as much as a, and b costs twice as much—so the word cbc is more expensive than aba. However, no matter what the fourth letter is, it will be more expensive than the third letter was. And (in type A, at least) the cheapest word that makes aba longer is c (abaa=ab and abab=ba, both of which are length 2), whereas an a will make cbc longer—cbca is length 4. So is it better to buy cheap letters now or later? This question turns out to be very complicated to answer. (Or is the answer somehow now *and* later?)

Building the longest word of E_8 requires nearly e1000 rho, and the word grows steadily longer throughout the entire theory, with the costs of letters spread out more as the word grows longer. The longest word of E_8 is much longer than the longest words of either B_8 or E_7, so a completionist player will spend the majority of their time working exclusively in type E_8; the final milestone will be available at e400 rho. Publishing will be available when w is around 5 letters long, and the first milestone upgrade after a painful wait during which w is the longest it can be in type A_3. The optimal milestone route will not leave the player waiting with the longest word for very long (and usually not at all). Two other milestone routes are be possible, but will involve some waiting. I don't plan on introducing any milestones thata do not either increase rank or change type. The cost and value functions for q1, q2, and q3 naturally rebalance the theory as rho grows, to make up for the lack of milestones.

I welcome all comments, but please be aware of unfinished state of the theory. In particular, if anyone thinks something I haven't mentioned is broken or non-functional, please let me know. If you have thoughts on the current costs of milestones, permanent upgrades, and letter upgrades, or the general feel of the current state of the game, I would be interested to know. More specifically, if you have suggestions for balancing, I would love it if you reached out to me. Finally, if you speak a language other than English I would greatly appreciate your help localizing.
