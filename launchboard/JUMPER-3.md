# Jumper 3: The Legend of Atom

The sixth tile is an original, three-chapter side-scrolling platformer. Atom is a beaver with a paddle tail, buck teeth, green scarf, and railroad equipment. The fictional Order of the Hollow Ember has stolen three ignition seals to stop clean-carbon production and destroy working industry. Recover the seals to restore the supply line.

| Chapter | Setting and goal |
| --- | --- |
| The Severed Spur | Cross the rail yard, jump broken tracks, and reclaim the Rail Seal. |
| The Silent Kilns | Navigate moving lifts, hot vents, and kiln catwalks to recover the Heat Seal. |
| The Hollow Foundry | Defeat the Null Keeper and return the Atom Seal to the foundry. |

Five original enemy variants wear hoods with glowing red eyes: patrolling acolytes, jumping iron-boot hoppers, floating wraiths, staff-wielding ash-callers, and armored seal wardens. Stomp them from above or hit them with carbon sparks. Each chapter's guardian takes three, four, or five hits and must be defeated before the exit signal unlocks. Damage briefly protects the enemy from repeated hits.

## Controls and equipment

| Action | Keyboard | Controller | Touch |
| --- | --- | --- | --- |
| Move | Left / Right or A / D | Left stick / D-pad | Hold Left / Right |
| Jump | Space, W, Up, or Enter | A | Hold Jump |
| Run | Hold Shift | Hold RT | Toggle Run |
| Fire | Hold X | Hold X | Hold Blaster |
| Pause | P | On-screen Pause | Pause |
| Leave | Escape / B | B | Exit |

Hold Jump for a higher arc and release for a short hop. A brief grace period after leaving an edge and a buffered press just before landing make jumps forgiving. Touch holds are tracked independently so movement, jumping, and firing work together. Buttons stay at least 56 CSS pixels tall. Rotation, focus loss, and hidden tabs pause the game and clear held controls.

Bump orange C crates from below. A crate releases its contents once:

- **Rail hardhat:** an extra hit of protection.
- **Spark coil:** bouncing green projectiles and an additional armor layer. Taking damage reduces the coil to a hardhat, then to unarmored Atom.
- **Atom Core:** twelve seconds of protection against enemies and vents; gaps still cost a life.
- **Maple reserve:** one extra life, up to five.
- **Carbon credits:** collectible credits; every 100 earns an extra life. Credit crates award five.

Each chapter starts with a 180-second shift clock. A green halfway signal saves a checkpoint. After a lost life, retry from there with a fresh clock and brief protection. Used crates, collected credits, and defeated enemies stay saved, preventing repeated score farming. Three lives start a run; losing the last life ends it. A new adventure resets the full run.

## Score and verification

Earn 50 points per credit, 150 per ordinary enemy, 1,000 per guardian, 200 for a hardhat or maple reserve, and 300 for a spark coil or Atom Core. Each restored seal adds 2,000 points plus 10 per second remaining, rounded down to whole points. Finished runs use the existing first-and-last-name leaderboard form, local browser storage, and Formspree copy. No separate service is needed.

`tests/jumper-3.test.ts` checks jump arcs, every mandatory gap, input buffering, crates, armor, stomps, sparks, checkpoints, scoring, all three guardians, and independent touch holds. `e2e/jumper-3.spec.ts` checks keyboard play, three chapter transitions, native score entry, persistence, and Chromium tablet multitouch, cancellation, and rotation. Formspree requests are intercepted in tests. Physical iPad Safari testing remains a booth hardware check.

The art is built from local 3D geometry and existing self-hosted fonts. The lazy game module and its CSS join the app's first-visit offline cache. The `?e2e` inspection hook exists only in development builds.
