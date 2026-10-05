# Quadruple Agent

Open **index.html** in a browser, or put that one file on any static website host. It contains all styles, operation definitions and game logic; no internet connection or installation is needed to play once it is loaded.

Designed for a shared iPhone with 3–9 players. Give everyone a different name, choose **Full** or **Confident**, set the starting Parasite count, then begin the private briefing. Each round is Operations → Discussion → private Voting → anonymous results.

## Presets and configurations

- **Full:** all nine operations, all four agendas, both special roles.
- **Confident:** no special roles, Defector, Spy Transfer or Sleeper Agent. Hidden Agenda remains available with its other three outcomes. There are seven unique operations, so this preset supports up to seven players unless manual assignments explicitly supply additional operations.
- **Settings → Saved presets:** save a named configuration including player names, rules and manual assignments. Load, update or delete it later. Export/import JSON to transfer it between browsers or back it up.
- Configurations and the current game are automatically saved in this browser. Resume always begins with a concealed screen. Browser storage belongs to the device and website address; use Export if it is unavailable or before changing addresses.

## Manual mode

Under **Settings → Manual mode**, leave any team or special role random, or explicitly assign it. Explicit assignments can exceed ordinary limits; random assignments respect them. The requested Parasite count is filled after counting manually assigned Parasites. When every team is explicitly assigned, that composition overrides the requested count.

Add an operation override for a player and round. Choose optional targets and guaranteed results/decisions. Explicitly assigned operations can be disabled in the preset or duplicated. All other operations are unique random assignments. Jailed owners are skipped; jailed or duplicate targets are replaced with eligible active players. Between rounds, **Edit round overrides** lets you revise upcoming assignments without changing current allegiances.

## Rule choices

- Shield subtracts one from votes against its target. Double vote makes the target's own vote count as two. Both expire at the end of the round. Explicitly repeated shields stack; repeated double bonuses still give a vote of two.
- Starting Parasites recognise each other only during their briefing. Team changes are never announced to either team. Spy Transfer does not reveal either allegiance, including to its owner.
- Special roles affect apparent allegiance for information operations. Confession normally reveals actual allegiance. Manual result overrides can intentionally report different intel.
- Force Defectors cannot vote while Force. A Parasite Defector permanently loses if any current Parasite votes against them, even when they are not jailed. This loss overrides personal wins. A later actual team change clears the Defector restriction, but never reverses a recorded loss.
- A later Hidden Agenda replaces an unfinished agenda. Sleeper Agent switches teams and restores ordinary team victory. Scapegoat and Grudge secure personal wins immediately; secured wins remain, and stay private until the final results.
- Infatuation follows another player's personal result. For a closed Infatuation cycle, members use their own final team results; other players following them share those results.
- No self-votes. Ties jail nobody. Jailed players reveal actual allegiance and stop taking turns.
- Victory is checked after briefing, after the Operations phase, and after voting. No active Parasites means the Force wins. Optional parity victory ends the game when Parasites equal/outnumber the Force. The game always ends at two active players: any remaining Parasite gives the Parasites victory.

The in-game Field guide explains these rules too.

## Editing and verification

The distributable is the single **index.html** file. Its maintainable sources are:

- `src/catalogue.js`: operation descriptions, agendas, special roles and default presets.
- `src/engine.js`: team assignments, operation handlers, voting and victories.
- `src/app.js`: shared-phone interface, settings and local persistence.
- `src/page.html`: page and styles.

After editing, run `node build.mjs` to regenerate `index.html`. New operations need a catalogue entry, a handler in the engine, and any required choice/result interface in the app.

Run `node --test tests/engine.test.cjs` for the rule checks. There are no runtime dependencies.
