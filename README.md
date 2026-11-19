NeuroSpark
Working title. It can be changed in the TITLE array at the beginning of App.tsx.
Quick Start
Open NeuroSpark.html in a full web browser. This is a self-contained build: React, styles, and exercises are already included, so no installation or internet connection is required. An HTML viewer inside a messaging app may not execute JavaScript correctly — in that case, open the file directly in a browser. Saving progress for local HTML files depends on the browser settings.
Run the Source Code
You will need Node.js 20.19+ or 22.12+.
1. Extract the archive and open the neuro-spark folder in VS Code.
2. Run npm install in the terminal.
3. Run npm run dev and open the address shown in the terminal.
4. To create a production web build, run npm run build. The result will be in the dist folder.
The main requested files are App.tsx, App.css, and package.json. The additional index.html is the Vite entry point. When moving the app into an existing React project, import App as a normal component. App.tsx does not call createRoot, so there will be no double mounting.
Rules
- 60 seconds per round; the third mistake immediately ends the game.
- Exactly four answers per question; one is correct.
- One hint per round; the timer continues while the hint is being used.
- A correct answer earns one point. All four levels are immediately available: Easy, Medium, Hard, and Advanced. Three consecutive correct answers increase the difficulty within the selected level; a mistake resets the streak. The selected level is saved.
- Questions do not repeat within a round. If all cards at the available difficulty have been used, the next difficulty level becomes available.
- After the game, explanations, everyday examples, sources, and error review are available without a timer.
- Error practice has no mistake limit and does not contribute to overall progress.
- Progress, high score, language, and furigana settings are saved in localStorage. Points are awarded when a round is completed.
- Game ranks: 0 / 10 / 30 / 65 / 110 correct answers across completed rounds.
- Keyboard controls: 1–4 — answer, H — hint.
Content
117 cards: 24 area cards, 40 net cards, 28 percentage cards, and 25 mental-arithmetic cards. The 40 net cards use five families of solids, two question directions, and rotated diagrams. Text, choices, hints, and explanations are available in Russian, English, Japanese, and Simplified Chinese. Japanese furigana can be enabled separately and covers the main mathematical and interface terms.

The mathematical logic is built directly into App.tsx and does not require a server. Neutral labels for the net choices do not reveal the correct answer. Geometric diagrams are rendered as SVG, with dashed lines indicating folds. The dimensions shown in the diagrams are illustrative; the values stated in the question take priority.

The brain is a game-style representation with conditional network highlighting, not an anatomical atlas, brain scan, or IQ assessment. Highlighting different networks does not represent measurement of actual brain activity or proven development of a specific brain region. Frontal and parietal regions interact during mathematical tasks; geometry and calculation partially involve overlapping networks.
Sources
- OpenStax, Prealgebra 2e, Geometric Formulas: https://openstax.org/books/prealgebra-2e/pages/c-geometric-formulas
- Wolfram MathWorld, Net: https://mathworld.wolfram.com/Net.html
- Pearson, Nets of Geometric Solids: https://www.pearsoned.ca/text/cathcart/nets.html
- OpenStax, Understand Percent: https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent
- Hawes et al., Neural underpinnings of numerical and spatial cognition (2019): https://pubmed.ncbi.nlm.nih.gov/31082407/
The formulas and mathematical facts were used for verification. The illustrations, exercises, and explanations were created specifically for this game. Numerical answers are calculated from the original data and then independently checked.
Verification
TypeScript strict mode and the Vite production build completed successfully. Automated React testing in a DOM environment confirmed the 117 cards, four unique choices in each language, calculated answers, language switching, furigana, difficulty progression, one hint, game completion after the third mistake, no repeated cards within a round, error practice, progress recording, and timeout behavior. Independent verification of the cube and rectangular-prism nets confirmed six distinct face directions and consistent edge lengths.

A full visual check in Chromium was not performed because browser execution is blocked by the runtime environment. Mobile layout is provided through CSS, but its appearance should be checked on an actual device.
Update: Menu, Levels, and Illustration
The menu contains “Play” and “My Progress.” The progress screen shows the best score, number of completed game rounds, overall accuracy, and results for all four topics. The strongest topics are determined by the highest accuracy among topics with at least three answers; if there is a tie, all tied topics are shown. Detailed counters are collected starting from this update: older saved data retains XP and the high score, but unknown past answers are not fabricated. Error review does not increase the overall counters.

Levels do not need to be unlocked: Easy uses internal difficulties 1–2, Medium uses 2–3, Hard uses 3–4, and Advanced uses 4–5. Within the selected range, difficulty increases after a streak of correct answers. Once all cards in the selected topic and level range have been completed, the round ends without repeating questions.

The logo and brain illustration are now rendered as 2D SVG with gradients, smooth neural connections, and a soft glow. A correct answer triggers a short light pulse; the reduced-motion setting is respected. All elements are embedded directly in App.tsx and do not require a separate image. The position of the lower triangular face of the prism net has been corrected; rotated nets are automatically fitted within the drawing area.

Additional automated testing confirmed the menu, all four freely available levels, difficulty ranges, topic statistics, strongest topic calculation, high-score saving, and migration of old data. The 2D illustration was rendered separately and visually checked. Full browser-based layout testing remains unavailable in the runtime environment.
Update: Magical Sounds and Glow
The brain now has a unified silhouette, soft dimensional lighting, more expressive folds, and glowing signals along the neural connections. At the end of a round, all neurons briefly light up together with a wave of light. The “A Little More Magic” button repeats this effect. When the system’s reduced-motion setting is enabled, the animation is disabled.

Short sounds are generated locally through the Web Audio API without MP3 files, external services, or file downloads. After three consecutive correct answers, when the internal difficulty actually increases, a short shimmering sound plays; at the end of a round, a soft five-note arpeggio plays. Manually ending a round does not trigger the final sound. A “Sound” toggle is available both in the menu and during gameplay, saves the setting, and immediately disables audio when turned off.

The audio context is created only after a user interaction, such as pressing “Start Game.” If the browser does not support Web Audio or does not permit playback, the game and visual glow continue to work. A hidden tab does not trigger a new sound effect. Audio has not yet been tested on a real iPhone; the standard policy requiring audio playback to begin after user interaction is taken into account.

Recommendation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
Update: Brain View
The brain is shown from the side: an asymmetrical silhouette, naturally positioned folds, a small cerebellum, and a brainstem. The positions of the neurons and light pathways have been adapted to the new illustration. The game rules, menu, statistics, and sounds have not changed.
Card Bank and History
270 cards: 40 nets, 24 area/formula cards, 127 mental-arithmetic cards, and 79 percentage cards. Each card has four languages, four choices, a hint, a worked solution, and an application. Unseen eligible cards are prioritized, followed by the least-seen cards. A card is never repeated within a round.

Answer history begins with this version and stores the latest 3,000 answers in localStorage in the same browser, including practice answers, hint usage, and the selected difficulty. It can be filtered by topic or mistakes. Existing scores are preserved; past individual answers cannot be reconstructed. Deleting browser data clears the history. Opening a downloaded file from a new path or using another browser may result in separate storage.

Arithmetic shortcuts use elementary identities such as the distributive property and fractions.

References:
- https://openstax.org/books/prealgebra-2e/pages/7-3-distributive-property
- https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent
