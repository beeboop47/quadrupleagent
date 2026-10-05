# Quadruple Agent

Open **index.html** in a browser, or put it on any static website host. It contains all styles, operation definitions and game logic. Keep **Background Music.mp3** alongside it for music; gameplay itself needs no other files or internet connection.

Designed for a shared iPhone with 3–9 players. Give everyone a different name, choose **Full** or **Confident**, set the starting Parasite count, then begin the private briefing. Each round is Operations → Discussion → private Voting → anonymous results.

## Presets and configurations

- **Full:** all nine operations, all four agendas, all five special roles. With three or four players, deal that many distinct roles chosen randomly from the enabled pool.
- The initial default setup enables every operation and agenda, but has all special roles **off**. Full explicitly enables them. Previously saved configurations keep their selected roles.
- **Confident:** no special roles, Defector, Spy Transfer or Sleeper Agent. Hidden Agenda remains available with its other three outcomes. There are seven unique operations, so this preset supports up to seven players unless manual assignments explicitly supply additional operations.
- **Settings → Saved presets:** save a named configuration including player names, rules and manual assignments. Load, update or delete it later. Export/import JSON to transfer it between browsers or back it up.
- Configurations and the current game are automatically saved in this browser. Resume always begins with a concealed screen. Browser storage belongs to the device and website address; use Export if it is unavailable or before changing addresses.

## Manual mode

Under **Settings → Manual mode**, leave any team or special role random, or explicitly assign it. Explicit assignments can exceed ordinary limits; random assignments respect them. The requested Parasite count is filled after counting manually assigned Parasites. When every team is explicitly assigned, that composition overrides the requested count.

Add an operation override for a player and round. Choose optional targets and guaranteed results/decisions. Explicitly assigned operations can be disabled in the preset or duplicated. All other operations are unique random assignments. Jailed owners are skipped; jailed or duplicate targets are replaced with eligible active players. Between rounds, **Controls → Edit upcoming round overrides** lets the host revise upcoming assignments. Shared round and voting-result screens do not announce manual mode or show override controls.

## Rule choices

- Shield subtracts one from votes against its target. Double vote makes the target's own vote count as two. Both expire at the end of the round. Explicitly repeated shields stack; repeated double bonuses still give a vote of two.
- Starting Parasites recognise each other only during their briefing. Team changes are never announced to either team. Spy Transfer does not reveal either allegiance, including to its owner.
- Special roles affect apparent allegiance for information operations. Confession normally reveals actual allegiance. Manual result overrides can intentionally report different intel.
- Players are never told their assigned special role, including in final outcomes. Each enabled role has one randomly chosen owner when the group has enough players. When there are more enabled roles than players, deal a random subset, one role per player. Manual assignments reserve their owners and role types before the remaining roles are dealt; manual duplicates remain supported. If manual assignments leave no eligible owner in a group large enough for all enabled roles, setup asks you to free an assignment or disable that role.
- **Unreliable Source:** invert the final answer to Anonymous Tip, Secret Intel, Unfortunate Encounter and Danish Intelligence. A two-player result is inverted once as a whole. Confession and allegiance-change reports stay truthful.
- **Fixed Asset:** Spy Transfer involving this player leaves both allegiances and Defector restrictions unchanged. The usual completion message is shown. Defector and Sleeper Agent remain available.
- **Counterintelligence Officer:** the owner's information operations use actual allegiances, bypassing Suspicious Agent and Deep Cover Agent.
- Shared Unfortunate Encounter results follow the operation owner's modifiers, not the invited partner's. Explicit manual guaranteed results take precedence over special-role information modifiers.
- Force Defectors cannot vote while Force. A Parasite Defector permanently loses if any current Parasite votes against them, even when they are not jailed. This loss overrides personal wins. A later actual team change clears the Defector restriction, but never reverses a recorded loss.
- A later Hidden Agenda replaces an unfinished agenda. Sleeper Agent switches teams and restores ordinary team victory. Scapegoat and Grudge secure personal wins immediately; secured wins remain, and stay private until the final results.
- Infatuation follows another player's personal result. For a closed Infatuation cycle, members use their own final team results; other players following them share those results.
- No self-votes. Ties jail nobody. Jailed players reveal actual allegiance and stop taking turns.
- Victory is checked after briefing, after the Operations phase, and after voting. No active Parasites means the Force wins. Optional parity victory ends the game when Parasites equal/outnumber the Force. The game always ends at two active players: any remaining Parasite gives the Parasites victory.

The in-game Field guide explains these rules too.

Under **Settings → Rules**, enable **End after one voting round** for a short game. Jailing Force gives the Parasites victory; jailing a Parasite gives the Force victory, even if others remain. A tie or zero final votes ends without a team winner. This mode waits for voting instead of ending early at parity or when no Parasites remain; the mandatory two-active-player ending remains in place before voting. Personal agendas and Defector losses still apply. This setting is saved and exported with configurations; it defaults off.

## Background music

The supplied **Background Music.mp3** streams and loops normally. The fade already in your file is preserved; no additional fades or crossfades are applied. Web Audio gain controls provide volume adjustment on iPhone too.

Music begins when you start/resume a game, after the required browser interaction. The **Music** button toggles it, and the volume slider is remembered on this browser. For hosting, upload the MP3 alongside the HTML with that exact filename; the host should support byte-range requests. `node preview.mjs` runs a local preview with byte-range support.

## Editing and verification

The distributable is the single **index.html** file. Its maintainable sources are:

- `src/catalogue.js`: operation descriptions, agendas, special roles and default presets.
- `src/engine.js`: team assignments, operation handlers, voting and victories.
- `src/app.js`: shared-phone interface, settings and local persistence.
- `src/music.js`: looping music and volume controls.
- `src/page.html`: page and styles.

After editing, run `node build.mjs` to regenerate `index.html`. New operations need a catalogue entry, a handler in the engine, and any required choice/result interface in the app.

Run `node --test tests/engine.test.cjs tests/specials.test.cjs` for the rule checks. There are no runtime dependencies.
