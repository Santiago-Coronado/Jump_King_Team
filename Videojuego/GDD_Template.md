# **Knight's Fall**

## _Game Design Document_

---

##### **Copyright notice / author information / boring legal stuff nobody likes**
Middle Earth Studios
- Santiago Coronado Hernández
- Juan de Dios Gastélum Flores 
- Enrique Antonio Pires Rodríguez
##
## _Index_

---

1. [Index](#index)
2. [Game Design](#game-design)
    1. [Summary](#summary)
    2. [Gameplay](#gameplay)
    3. [Mindset](#mindset)
3. [Technical](#technical)
    1. [Screens](#screens)
    2. [Controls](#controls)
    3. [Mechanics](#mechanics)
4. [Level Design](#level-design)
    1. [Themes](#themes)
        1. Ambience
        2. Objects
            1. Ambient
            2. Interactive
        3. Challenges
    2. [Game Flow](#game-flow)
5. [Development](#development)
    1. [Abstract Classes](#abstract-classes--components)
    2. [Derived Classes](#derived-classes--component-compositions)
6. [Graphics](#graphics)
    1. [Style Attributes](#style-attributes)
    2. [Graphics Needed](#graphics-needed)
7. [Sounds/Music](#soundsmusic)
    1. [Style Attributes](#style-attributes-1)
    2. [Sounds Needed](#sounds-needed)
    3. [Music Needed](#music-needed)
8. [Schedule](#schedule)

## _Game Design_

---

### **Summary**

Imagine the fun challenge of games like jump king but with the addictive gameplay of a roguelite. Welcome to Knight's Fall, where every leap is a gamble, and every fall is a lesson. 

You control a knight who must climb a mysterious tower to rescue the princess. However, the tower changes with each attempt: platforms, enemies, biomes and objects are randomly selected. As you climb, you'll unlock new jumping abilities that will make you feel more powerful. Can you break the cycle and reach the top?

### **Gameplay**

You'll be a knight that will enter a mysterious tower to save the princess, when you enter the tower, you will be met with a platforming level that you will have to climb, when climbing each level you will realize that many things change, the biome will change the further up you go and there will be enemies everywhere, but don't worry to much, because you will get harder to hit as well, you will get different types of jumps in each level, so that you can traverse the tower easier. If you die trying to save the princess, then pick yourself up and try again, beware that the platforms, biomes, enemy positions positions will change with each try, so give it your all to end the cycle of trying.


### **Mindset**

In this game, platforming will be the main gameplay, that is why we want our players to have difficulty at first (by having less tools to avoid the enemies, or by not being able to memorize the levels right away because they will be randomly selected), but feel more powerful as they play more (when they unlock movement tools). Also we want them to try completing the game as many times as possible, that is why we will be implementing a highscore system, so that the players can try and get highest score to flex on other players.


## _Technical_

---

### **Screens**

## 1. Login/Register Screen (HTML)
- **Description**: Initial screen where players can log in or register.
- **Elements**:
  - Text field for username.
  - Text field for password.
  - "Log In" button.
  - "Register" button.
- **Interaction**: Players enter their credentials to access the game.

---

## 2. Main Menu Screen (HTML)
- **Description**: Main screen with the game logo and menu options.
- **Elements**:
  - Game logo.
  - "Play" button.
  - "Controls" button.
  - "Leaderboard" button.
  - "Game Description" button.
  - "Exit" button.
- **Interaction**: Players select an option to navigate to the corresponding screen.

---

## 3. Game Screen (HTML)
- **Description**: Screen where the main level is played.
- **Elements**:
  - Game area.
  - HUD (Heads-Up Display) showing score and available abilities.
  - "Pause" button.
- **Interaction**: Players control the knight using the defined controls (A, D, SPACEBAR, Q).

---

## 4. Player Statistics Screen (HTML)
- **Description**: Screen where players can view their statistics.
- **Elements**:
  - Highest score.
  - Total playtime.
  - Other relevant metrics.
- **Interaction**: Players can review their progress and achievements.

---

## 5. Leaderboard Screen (HTML)
- **Description**: Screen that displays a leaderboard with the highest scores.
- **Elements**:
  - Table with player names and their scores.
- **Interaction**: Players can see how they compare to others.

---

## 6. Controls Screen (HTML)
- **Description**: Screen that displays the game controls.
- **Elements**:
  - List of controls (A, D, SPACEBAR, Q).
  - Brief description of each control.
- **Interaction**: Players can check the controls before playing.

---

## 7. Game Description Screen (HTML)
- **Description**: Screen that displays the game description.
- **Elements**:
  - Text describing the game premise.
  - Related images or graphics.
- **Interaction**: Players can read about the story and objective of the game.

---

## 8. End Credits Screen (HTML)
- **Description**: Screen shown after rescuing the princess.
- **Elements**:
  - Congratulatory message.
  - Development team credits.
  - Option to return to the main menu or play again.
- **Interaction**: Players can celebrate their victory and decide what to do next.

---

### **Controls**

- **Movement**:
  - **A**: Move left.
  - **D**: Move right.
- **Jumps**:
  - **SPACEBAR**: Jump.
  - **Hold SPACEBAR**: Charge jump for a higher jump.
  - **SPACEBAR in the air**: Double jump.
- **Dash**:
  - **Q**: Perform a quick dash in the current direction.

**Note**: Controls are not customizable by the player.

---

### **Levels and Themes**

- **Structure**: A single level with different screens (sections) that change themes as the player progresses.
- **Themes**: Each group of sections will have a unique visual design (e.g., forest, cave, sky, etc.) that reflects the progress towards the top of the tower.
- **Objective**: Rescue the princess in the final section.



### **Mechanics**

Are there any interesting mechanics? If so, how are you going to accomplish them? Physics, algorithms, etc.

## _Level Design_

---

_(Note : These sections can safely be skipped if they&#39;re not relevant, or you&#39;d rather go about it another way. For most games, at least one of them should be useful. But I&#39;ll understand if you don&#39;t want to use them. It&#39;ll only hurt my feelings a little bit.)_

### **Themes**

1. Forest
    1. Mood
        1. Dark, calm, foreboding
    2. Objects
        1. _Ambient_
            1. Fireflies
            2. Beams of moonlight
            3. Tall grass
        2. _Interactive_
            1. Wolves
            2. Goblins
            3. Rocks
2. Castle
    1. Mood
        1. Dangerous, tense, active
    2. Objects
        1. _Ambient_
            1. Rodents
            2. Torches
            3. Suits of armor
        2. _Interactive_
            1. Guards
            2. Giant rats
            3. Chests

_(example)_

### **Game Flow**

1. Player starts at the bottom of the tower
2. Pass first two screens by jumping from platform to platform and killing or evading enemies
3. Take first powerup from the last platform of the second screen
4. Jump to the next screen were the level will take your jumps into account
5. Complete each screen until you reach the top, while you are passing each screen you will be getting points by killing enemies, when you reach a certain number you will gain an increase in velocity, also you may encounter more powerups in the way so be sure to get them
7. Once you reach the top just walk and save the princess

_(example)_

## _Development_

---

### **Abstract Classes / Components**

1. BasePhysics
    1. BasePlayer
    2. BaseEnemy
    3. BaseObject
2. BaseObstacle
3. BaseInteractable
4. BaseLevel

### **Derived Classes / Component Compositions**

1. BasePlayer
    1. PlayerMain
2. BaseEnemy
    1. EnemyDemon
    2. EnemySkeleton
    3. EnemyJumper
4. BaseObject
    1. ObjectStats
    2. ObjectScore
5. BaseObstacle
    1. ObstacleWall



## _Graphics_

---

### **Style Attributes**

The characters will have a pixel-y design with attack, movement and death animations, the protagonist when jumping and moving will always make an animation, the enemies will always be moving and if you are in their range, they will attack you with an animation, the princess will have an animation that asks for rescue. The scenarios where the player will explore and interact with the castle will be pixel-y, with variations depending on what level you are, if you are in level 1, you will have a medieval atmosphere, in the second level you will change your environment for a frozen one and the last level will have a more lively style, because as you are approaching the princess, she will be in a better state.

### **Graphics Needed**

1. Characters
    1. Human-like
        1.	Knight (Stay, move, jump,bend)
        2.	Princess (Request help, move)
    2.	Other
        1.	Skeleton(Move, attacks)
        2.	Demon (Fly)
3.	Blocks
    1.	Brick
    2.	Magma
    3.	Dirt
    4.	Dirt/Grass
    5.	Stone
    6.	Tilded floor
    7.	Walls
4.	Ambient
    1.	Tower abandoned
    2.	Freeze
    3.	Magma
5.	Other
    1.	Door



## _Sounds/Music_

---

### **Style Attributes**

Again, consistency is key. Define that consistency here. What kind of instruments do you want to use in your music? Any particular tempo, key? Influences, genre? Mood?

Stylistically, what kind of sound effects are you looking for? Do you want to exaggerate actions with lengthy, cartoony sounds (e.g. mario&#39;s jump), or use just enough to let the player know something happened (e.g. mega man&#39;s landing)? Going for realism? You can use the music style as a bit of a reference too.

 Remember, auditory feedback should stand out from the music and other sound effects so the player hears it well. Volume, panning, and frequency/pitch are all important aspects to consider in both music _and_ sounds - so plan accordingly!

### **Sounds Needed**

1. Effects
    1. Soft Footsteps (dirt floor)
    2. Sharper Footsteps (stone floor)
    3. Soft Landing (low vertical velocity)
    4. Hard Landing (high vertical velocity)
    5. Glass Breaking
    6. Chest Opening
    7. Door Opening
2. Feedback
    1. Relieved &quot;Ahhhh!&quot; (health)
    2. Shocked &quot;Ooomph!&quot; (attacked)
    3. Happy chime (extra life)
    4. Sad chime (died)

_(example)_

### **Music Needed**

1. Slow-paced, nerve-racking &quot;forest&quot; track
2. Exciting &quot;castle&quot; track
3. Creepy, slow &quot;dungeon&quot; track
4. Happy ending credits track
5. Rick Astley&#39;s hit #1 single &quot;Never Gonna Give You Up&quot;

_(example)_


## _Schedule_

---

_(define the main activities and the expected dates when they should be finished. This is only a reference, and can change as the project is developed)_

1. develop base classes
    1. base entity
        1. base player
        2. base enemy
        3. base block
  2. base app state
        1. game world
        2. menu world
2. develop player and basic block classes
    1. physics / collisions
3. find some smooth controls/physics
4. develop other derived classes
    1. blocks
        1. moving
        2. falling
        3. breaking
        4. cloud
    2. enemies
        1. soldier
        2. rat
        3. etc.
5. design levels
    1. introduce motion/jumping
    2. introduce throwing
    3. mind the pacing, let the player play between lessons
6. design sounds
7. design music

_(example)_
