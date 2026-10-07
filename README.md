# Quadruple Agent

Open **index.html** in a browser, or put it on any static website host. It contains all styles, operation definitions and game logic. Keep **Background Music.mp3** alongside it for music; gameplay itself needs no other files or internet connection.

Designed for a shared iPhone with 3–9 players. Give everyone a different name, choose **Full** or **Confident**, set the starting Parasite count, then begin the private briefing. Each round is Operations → Discussion → private Voting → anonymous results.

**Settings → Rules → Operation phases before voting** selects 1–10 cycles per voting round (default 1). Every cycle gives each active player one freshly dealt operation, unique within that cycle, followed by discussion. Voting becomes available after the last cycle. A player may receive the same operation again in a later cycle. Vote bonuses and protection carry through all cycles to the next vote, then reset. Public operations list all cycles in the voting round. The one-voting-round ending works with any selected cycle count. Normal early team victories still apply unless the one-voting-round mode defers them.

Manual overrides use continuously numbered **operation cycles**: with two phases per vote, cycles 1 and 2 precede the first vote, cycles 3 and 4 precede the second. Existing saved override round numbers retain their meaning as cycle numbers.

## Presets and configurations

- **Full:** all 17 operations, all four agendas, all five special roles. With three or four players, deal that many distinct roles chosen randomly from the enabled pool.
- The initial default setup enables every operation and agenda, but has all special roles **off**. Full explicitly enables them. Previously saved configurations keep their selected roles.
- **Confident:** no special roles, Defector, Spy Transfer or Sleeper Agent. Hidden Agenda remains available with its other three outcomes. All eight new information operations are included, for 15 enabled operations.
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

Operation assignments are public: each round's shared screens have a **Public operations** list showing every owner's operation. Targets and results remain private. Players can lie about results, but not which operation they received.

The eight new operations work immediately without prior voting history. Majority Report selects three players and permits the owner to participate. Chain of Command compares the owner's apparent allegiance with a target's. Threat Assessment checks two targets against the owner's current actual team. Cross-Reference compares a chosen player with a randomly selected third player and privately identifies both. Internal Audit counts apparent Parasites among active players. Background Check detects the existence of a special role without identifying it. Divided Loyalties detects a personal agenda or secured personal win. Personnel File gives two statements about different categories (allegiance, special-role existence, personal victory), normally exactly one true relative to the information reader's view.

Counterintelligence Officer uses actual allegiance for all new allegiance checks. Unreliable Source inverts team and yes/no answers, reports `active players − apparent Parasites` for Internal Audit, and receives two false statements for Personnel File. Confession is unchanged. Manual guaranteed results take precedence, including Personnel File's optional truth pattern and Cross-Reference's optional second target.

The in-game Field guide explains the operations too. Full, Confident and the default setup gain the new operations automatically. Named saved configurations retain their selected operations; enable the new ones in Settings or load a default preset.

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

Run `node --test tests/engine.test.cjs tests/specials.test.cjs tests/single-round.test.cjs tests/information.test.cjs` for the rule checks. There are no runtime dependencies.
