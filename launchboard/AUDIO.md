# Booth audio

All six games share an original, gentle lo-fi soundtrack and soft synthesized effects. The music is an eight-bar, 76 BPM loop with extended chords, a sparse melody, sine bass, soft kicks, and brushed percussion. Swung eighth notes give it a relaxed rhythm. No recordings, external audio services, or licensed music assets are required; the sound works offline with the cached app.

Audio unlocks on the first tap or keypress. Open **Sound** at the bottom center for separate **Music** and **Sound effects** sliders or **Mute all sound**. The defaults are deliberately low (28% music, 45% effects, with additional output attenuation and compression). Preferences are stored under `itd.audio.v1` on this browser and website origin. If browser storage is unavailable, controls still work for the current session. A controller-only session may need one tap or keypress to satisfy browser audio permission.

| Game | Effects |
| --- | --- |
| Beaver Crossing | Gentle hop, collision, level-start and completion cues |
| Carbon Sort | Movement and rotation blips, soft placement knocks, recycling chimes |
| Kiln Keeper | Conveyor adjustment clicks, wood-drop knocks, quiet temperature warnings, batch outcomes |
| Carbon Rails | Card draws, railway connection chimes, match start and completion |
| Convention Hall | Scanner chirps, successful contact chimes, soft damage and result cues |
| Jumper 3 | Jump and landing cues, bouncing sparks, carbon-credit chimes, power-ups, enemy defeats, damage and seals restored |

Music continues across games and lowers during pause, instructions, result screens, and leaderboard entry. Audio fades out and suspends when the page loses focus, becomes hidden, or returns to the idle attract screen. Muting stops scheduling and releases voices; returning does not replay a backlog. Effects have rate limits and the synthesizer caps simultaneous voices. Unsupported or blocked Web Audio does not prevent playing the games.

The implementation lives in `src/audio/`: `score.ts` contains the composition; `engine.ts` manages the audio graph, envelopes, lifecycle and preferences; `events.ts` maps real game-state changes to cues. `useGameAudio.ts` observes each game without changing its physics or scoring. The native `AudioControls` panel prevents its keyboard and touch events from controlling the game beneath it.

Unit tests cover preferences, swing timing, and real game actions producing the expected cues. Browser tests check gesture unlocking, measurable audio output, mute and persistence, all six games, tablet controls, interruption cleanup, and the unavailable-audio fallback. Tests use Chromium; physical iPad Safari listening remains a hardware check. The development-only `?e2e` audio inspector is excluded from the production build.
