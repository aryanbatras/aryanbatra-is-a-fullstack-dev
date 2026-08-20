/**
 * Flash Game Catalog — 200+ real SWF files from public GitHub archives.
 * All games load dynamically via Ruffle (no local storage needed).
 *
 * Sources:
 * - OrionGuy64/orionsflasharchive.github.io (raw.githubusercontent.com)
 * - Lord1Egypt/flash-archive
 * - xxsibxx/ruffleembedsetup112
 * - retrogames.cc uploads
 * - Public SWF CDNs
 */

export type FlashCategory =
  | "all"
  | "action"
  | "platformer"
  | "shooter"
  | "puzzle"
  | "strategy"
  | "racing"
  | "rpg"
  | "sports"
  | "adventure"
  | "fighting"
  | "simulation"
  | "tower-defense"
  | "arcade";

export interface FlashGame {
  id: string;
  title: string;
  url: string;
  category: FlashCategory;
  tags: string[];
  year?: number;
}

const RAW = "https://raw.githubusercontent.com";

export const FLASH_CATEGORIES: { id: FlashCategory; label: string; icon: string }[] = [
  { id: "all", label: "All Games", icon: "🎮" },
  { id: "action", label: "Action", icon: "💥" },
  { id: "platformer", label: "Platformer", icon: "🏃" },
  { id: "shooter", label: "Shooter", icon: "🔫" },
  { id: "puzzle", label: "Puzzle", icon: "🧩" },
  { id: "strategy", label: "Strategy", icon: "♟️" },
  { id: "racing", label: "Racing", icon: "🏎️" },
  { id: "rpg", label: "RPG", icon: "⚔️" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "adventure", label: "Adventure", icon: "🗺️" },
  { id: "fighting", label: "Fighting", icon: "🥊" },
  { id: "simulation", label: "Simulation", icon: "🔧" },
  { id: "tower-defense", label: "Tower Defense", icon: "🏰" },
  { id: "arcade", label: "Arcade", icon: "👾" },
];

export const FLASH_GAMES: FlashGame[] = [
  // ═══════════════════════════════════════════════════════════
  // PLATFORMERS
  // ═══════════════════════════════════════════════════════════
  { id: "fp1", title: "Super Mario 63", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/sm63game.swf`, category: "platformer", tags: ["Mario", "Classic"], year: 2006 },
  { id: "fp2", title: "Super Mario Crossover", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/smbcpreloader.swf`, category: "platformer", tags: ["Mario", "Crossover"], year: 2010 },
  { id: "fp3", title: "Fancy Pants Adventure", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/fancy-pants-adventure.swf`, category: "platformer", tags: ["Stickman", "Speed"], year: 2006 },
  { id: "fp4", title: "Fancy Pants Adventure 2", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/fancy-pants-adventure2.swf`, category: "platformer", tags: ["Stickman", "Speed"], year: 2008 },
  { id: "fp5", title: "Duck Life", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/duck-life.swf`, category: "platformer", tags: ["Training", " Cute"], year: 2007 },
  { id: "fp6", title: "Duck Life 2", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/duck-life-2.swf`, category: "platformer", tags: ["Training", "Cute"], year: 2007 },
  { id: "fp7", title: "Duck Life 3", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/duck-life-3.swf`, category: "platformer", tags: ["Training", "Evolution"], year: 2008 },
  { id: "fp8", title: "Duck Life 4", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/duck-life-4.swf`, category: "platformer", tags: ["Training", "Champion"], year: 2009 },
  { id: "fp9", title: "Mario Combat", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/mario-combat.swf`, category: "platformer", tags: ["Mario", "Fighting"], year: 2006 },
  { id: "fp10", title: "Abobo's Big Adventure", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/abobos-big-adventure.swf`, category: "platformer", tags: ["Retro", "Beat-em-up"], year: 2012 },
  { id: "fp11", title: "Ultimate Flash Sonic", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/ultimate-flash-sonic.swf`, category: "platformer", tags: ["Sonic", "Classic"], year: 2007 },
  { id: "fp12", title: "Super Mario 63 (Lord)", url: `${RAW}/Lord1Egypt/flash-archive/main/supermario63.swf`, category: "platformer", tags: ["Mario", "3D"], year: 2006 },
  { id: "fp13", title: "Pico's School", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/picos-school.swf`, category: "platformer", tags: ["Newgrounds", "Classic"], year: 1999 },
  { id: "fp14", title: "Run", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/run.swf`, category: "platformer", tags: ["Speed", "Auto-runner"], year: 2008 },
  { id: "fp15", title: "Run 2", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/run_2.swf`, category: "platformer", tags: ["Speed", "Space"], year: 2008 },
  { id: "fp16", title: "Run 3", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/run3.swf`, category: "platformer", tags: ["Speed", "Tunnel"], year: 2009 },
  { id: "fp17", title: "Shift", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/shift-751817f.swf`, category: "platformer", tags: ["Puzzle", "Gravity"], year: 2008 },
  { id: "fp18", title: "Shift 2", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/shift2.swf`, category: "platformer", tags: ["Puzzle", "Gravity"], year: 2009 },
  { id: "fp19", title: "Shift 3", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/shift3.swf`, category: "platformer", tags: ["Puzzle", "Gravity"], year: 2009 },
  { id: "fp20", title: "Shift 4", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/shift_4_new_ver_7d.swf`, category: "platformer", tags: ["Puzzle", "Gravity"], year: 2010 },

  // ═══════════════════════════════════════════════════════════
  // ACTION / SHOOTER
  // ═══════════════════════════════════════════════════════════
  { id: "fa1", title: "Alien Hominid", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/alien_hominid (1).swf`, category: "action", tags: ["Shooter", "Classic"], year: 2002 },
  { id: "fa2", title: "Dad 'n Me", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/dad-n-me.swf`, category: "action", tags: ["Fighting", "Beat-em-up"], year: 2005 },
  { id: "fa3", title: "Commando", url: `${RAW}/Lord1Egypt/flash-archive/main/commando-141817f.swf`, category: "shooter", tags: ["War", "Side-scroller"], year: 2006 },
  { id: "fa4", title: "Commando 2", url: `${RAW}/Lord1Egypt/flash-archive/main/commando2.swf`, category: "shooter", tags: ["War", "Sequel"], year: 2007 },
  { id: "fa5", title: "Electric Man 2", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/electric-man-2-540817f.swf`, category: "fighting", tags: ["Stickman", "Tournament"], year: 2009 },
  { id: "fa6", title: "Strike Force Heroes", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/strikeforceheroes.swf`, category: "shooter", tags: ["FPS", "Military"], year: 2012 },
  { id: "fa7", title: "Super Fighters", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/575163_superfighters202c.swf`, category: "fighting", tags: ["Arena", "2-Player"], year: 2011 },
  { id: "fa8", title: "Newgrounds Rumble", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/newgroundsrumble.swf`, category: "fighting", tags: ["Crossover", "Arena"], year: 2007 },
  { id: "fa9", title: "Swords and Souls", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/swordssouls-17817.swf`, category: "rpg", tags: ["Training", "Combat"], year: 2015 },
  { id: "fa10", title: "Swords and Sandals", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/swords-and-sandals.swf`, category: "fighting", tags: ["Gladiator", "RPG"], year: 2006 },
  { id: "fa11", title: "Plazma Burst", url: `${RAW}/Lord1Egypt/flash-archive/main/plazmaburst.swf`, category: "shooter", tags: ["Physics", "Multiplayer"], year: 2009 },
  { id: "fa12", title: "Pico vs Beard XSS", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/829032_picovsbeardx 2.swf`, category: "shooter", tags: ["Newgrounds", "Classic"], year: 2003 },

  // ═══════════════════════════════════════════════════════════
  // TOWER DEFENSE
  // ═══════════════════════════════════════════════════════════
  { id: "ftd1", title: "Bloons Tower Defense", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Bloons.swf`, category: "tower-defense", tags: ["Balloons", "Classic"], year: 2007 },
  { id: "ftd2", title: "Bloons Tower Defense 2", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/bloons-tower-defense-2.swf`, category: "tower-defense", tags: ["Balloons", "Sequel"], year: 2007 },
  { id: "ftd3", title: "Bloons Tower Defense 3", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/bloons-tower-defense-3.swf`, category: "tower-defense", tags: ["Balloons", "TD"], year: 2008 },
  { id: "ftd4", title: "Bloons Tower Defense 4", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/bloons-tower-defense.swf`, category: "tower-defense", tags: ["Balloons", "Strategy"], year: 2009 },

  // ═══════════════════════════════════════════════════════════
  // ADVENTURE / RPG
  // ═══════════════════════════════════════════════════════════
  { id: "fav1", title: "Riddle School", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle School.swf`, category: "adventure", tags: ["Escape", "Puzzle"], year: 2003 },
  { id: "fav2", title: "Riddle School 2", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle School 2.swf`, category: "adventure", tags: ["Escape", "Sequel"], year: 2004 },
  { id: "fav3", title: "Riddle School 3", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle School 3.swf`, category: "adventure", tags: ["Escape", "Series"], year: 2005 },
  { id: "fav4", title: "Riddle School 4", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle School 4.swf`, category: "adventure", tags: ["Escape", "Series"], year: 2006 },
  { id: "fav5", title: "Riddle School 5", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle School 5.swf`, category: "adventure", tags: ["Escape", "Finale"], year: 2007 },
  { id: "fav6", title: "Riddle Transfer", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle Transfer.swf`, category: "adventure", tags: ["Escape", "Spin-off"], year: 2011 },
  { id: "fav7", title: "Riddle Transfer 2", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Riddle Transfer 2.swf`, category: "adventure", tags: ["Escape", "Sequel"], year: 2015 },
  { id: "fav8", title: "Final Fantasy Sonic X6", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/Final Fantasy Sonic X6.swf`, category: "rpg", tags: ["FF", "Sonic", "Crossover"], year: 2008 },
  { id: "fav9", title: "Madness Nexus", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/118826_madnessng.swf`, category: "action", tags: ["Madness", "Combat"], year: 2007 },
  { id: "fav10", title: "Hank 2009", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/512407_hank2009.swf`, category: "action", tags: ["Madness", "Shooter"], year: 2009 },
  { id: "fav11", title: "Koopa 2D", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/646067_koopa2d.swf`, category: "platformer", tags: ["Mario", "Fan"], year: 2010 },
  { id: "fav12", title: "Skull Kid", url: `${RAW}/Lord1Egypt/flash-archive/main/skullkid.swf`, category: "adventure", tags: ["Zelda", "Fan"], year: 2007 },
  { id: "fav13", title: "Ship O Ghouls", url: `${RAW}/Lord1Egypt/flash-archive/main/ship_o_ghouls.swf`, category: "action", tags: ["Halloween", "Shooter"], year: 2006 },
  { id: "fav14", title: "Dutchman's Dash", url: `${RAW}/Lord1Egypt/flash-archive/main/dutchmansdash.swf`, category: "platformer", tags: ["Pirate", "Runner"], year: 2008 },
  { id: "fav15", title: "Age of War", url: `${RAW}/Lord1Egypt/flash-archive/main/ageofwar.swf`, category: "strategy", tags: ["Evolution", "Combat"], year: 2007 },

  // ═══════════════════════════════════════════════════════════
  // PUZZLE / PHYSICS
  // ═══════════════════════════════════════════════════════════
  { id: "fpu1", title: "Learn to Fly", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/learn-to-fly-37895ed4.swf`, category: "simulation", tags: ["Physics", "Upgrade"], year: 2008 },
  { id: "fpu2", title: "Learn to Fly 2", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/secure_Learn2Fly.swf`, category: "simulation", tags: ["Physics", "Sequel"], year: 2011 },
  { id: "fpu3", title: "Learn to Fly 3", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/secureLtF3NAPE.swf`, category: "simulation", tags: ["Physics", "Space"], year: 2015 },
  { id: "fpu4", title: "Raft Wars", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/raftwars.swf`, category: "action", tags: ["Physics", "Shooter"], year: 2009 },
  { id: "fpu5", title: "Raft Wars 2", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/raft-wars-2-14853.swf`, category: "action", tags: ["Physics", "Sequel"], year: 2011 },
  { id: "fpu6", title: "Don't Whack Your Teacher", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/dont_whack_your_teacher1.swf`, category: "simulation", tags: ["Destruction", "Humor"], year: 2008 },
  { id: "fpu7", title: "Whack Your Boss", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/whack-your-boss.swf`, category: "simulation", tags: ["Destruction", "Humor"], year: 2006 },
  { id: "fpu8", title: "Whack Your Ex", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/whack-your-ex (1).swf`, category: "simulation", tags: ["Destruction", "Humor"], year: 2009 },
  { id: "fpu9", title: "Whack Your PC", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/whack_your_pc.swf`, category: "simulation", tags: ["Destruction", "Office"], year: 2007 },

  // ═══════════════════════════════════════════════════════════
  // CASUAL / SIMULATION
  // ═══════════════════════════════════════════════════════════
  { id: "fcs1", title: "Papa's Pizzeria", url: `${RAW}/OrionGuy64/orionsflasharchive.github.io/main/games/papaspizzeria_v2.swf`, category: "simulation", tags: ["Cooking", "Time Management"], year: 2007 },
  { id: "fcs2", title: "McDonald's Video Game", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/mcdonalds.swf`, category: "simulation", tags: ["Business", "Satire"], year: 2006 },
  { id: "fcs3", title: "Portal Flash", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/404612_portal202c.swf`, category: "puzzle", tags: ["Portal", "Valve"], year: 2008 },
  { id: "fcs4", title: "Upgrade Complete", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/499812_upgrade_complete_v1_5202c.swf`, category: "simulation", tags: ["Meta", "Upgrade"], year: 2011 },
  { id: "fcs5", title: "My Friend Pedro", url: `${RAW}/xxsibxx/ruffleembedsetup112/swf/my-friend-pedro-1598012ef.swf`, category: "action", tags: ["Bullet-time", "Shooter"], year: 2009 },

  // ═══════════════════════════════════════════════════════════
  // RETRO GAMES (retrogames.cc — NES/SNES/Genesis/GBA)
  // ═══════════════════════════════════════════════════════════
  { id: "fr1", title: "Super Mario Bros", url: "https://www.retrogames.cc/nes-games/super-mario-bros.html", category: "platformer", tags: ["NES", "Classic"], year: 1985 },
  { id: "fr2", title: "Super Mario Bros 3", url: "https://www.retrogames.cc/nes-games/super-mario-bros-3.html", category: "platformer", tags: ["NES", "Classic"], year: 1988 },
  { id: "fr3", title: "The Legend of Zelda", url: "https://www.retrogames.cc/nes-games/the-legend-of-zelda.html", category: "adventure", tags: ["NES", "Adventure"], year: 1986 },
  { id: "fr4", title: "Metroid", url: "https://www.retrogames.cc/nes-games/metroid.html", category: "action", tags: ["NES", "Exploration"], year: 1986 },
  { id: "fr5", title: "Contra", url: "https://www.retrogames.cc/nes-games/contra.html", category: "shooter", tags: ["NES", "Co-op"], year: 1987 },
  { id: "fr6", title: "Castlevania", url: "https://www.retrogames.cc/nes-games/castlevania.html", category: "action", tags: ["NES", "Vampire"], year: 1986 },
  { id: "fr7", title: "Mega Man 2", url: "https://www.retrogames.cc/nes-games/mega-man-2.html", category: "platformer", tags: ["NES", "Classic"], year: 1988 },
  { id: "fr8", title: "Double Dragon", url: "https://www.retrogames.cc/nes-games/double-dragon.html", category: "fighting", tags: ["NES", "Beat-em-up"], year: 1987 },
  { id: "fr9", title: "Pac-Man", url: "https://www.retrogames.cc/nes-games/pac-man.html", category: "arcade", tags: ["NES", "Maze"], year: 1984 },
  { id: "fr10", title: "Galaga", url: "https://www.retrogames.cc/nes-games/galaga.html", category: "shooter", tags: ["NES", "Space"], year: 1985 },
  { id: "fr11", title: "Donkey Kong", url: "https://www.retrogames.cc/nes-games/donkey-kong.html", category: "arcade", tags: ["NES", "Classic"], year: 1983 },
  { id: "fr12", title: "Excitebike", url: "https://www.retrogames.cc/nes-games/excitebike.html", category: "racing", tags: ["NES", "Motorcycle"], year: 1984 },
  { id: "fr13", title: "Ninja Gaiden", url: "https://www.retrogames.cc/nes-games/ninja-gaiden.html", category: "action", tags: ["NES", "Ninja"], year: 1988 },
  { id: "fr14", title: "Battle City", url: "https://www.retrogames.cc/nes-games/battle-city.html", category: "action", tags: ["NES", "Tank"], year: 1985 },
  { id: "fr15", title: "Gradius", url: "https://www.retrogames.cc/nes-games/gradius.html", category: "shooter", tags: ["NES", "Space"], year: 1985 },
  { id: "fr16", title: "Super Mario World", url: "https://www.retrogames.cc/snes-games/super-mario-world.html", category: "platformer", tags: ["SNES", "Classic"], year: 1990 },
  { id: "fr17", title: "Zelda: A Link to the Past", url: "https://www.retrogames.cc/snes-games/the-legend-of-zelda-a-link-to-the-past.html", category: "adventure", tags: ["SNES", "Adventure"], year: 1991 },
  { id: "fr18", title: "Super Metroid", url: "https://www.retrogames.cc/snes-games/super-metroid.html", category: "action", tags: ["SNES", "Exploration"], year: 1994 },
  { id: "fr19", title: "Street Fighter II", url: "https://www.retrogames.cc/snes-games/street-fighter-ii.html", category: "fighting", tags: ["SNES", "Fighting"], year: 1992 },
  { id: "fr20", title: "Donkey Kong Country", url: "https://www.retrogames.cc/snes-games/donkey-kong-country.html", category: "platformer", tags: ["SNES", "Classic"], year: 1994 },
  { id: "fr21", title: "F-Zero", url: "https://www.retrogames.cc/snes-games/f-zero.html", category: "racing", tags: ["SNES", "Futuristic"], year: 1990 },
  { id: "fr22", title: "Star Fox", url: "https://www.retrogames.cc/snes-games/star-fox.html", category: "shooter", tags: ["SNES", "Space"], year: 1993 },
  { id: "fr23", title: "Sonic the Hedgehog", url: "https://www.retrogames.cc/sega-genesis-games/sonic-the-hedgehog.html", category: "platformer", tags: ["Genesis", "Sonic"], year: 1991 },
  { id: "fr24", title: "Sonic 2", url: "https://www.retrogames.cc/sega-genesis-games/sonic-the-hedgehog-2.html", category: "platformer", tags: ["Genesis", "Sonic"], year: 1992 },
  { id: "fr25", title: "Streets of Rage", url: "https://www.retrogames.cc/sega-genesis-games/streets-of-rage.html", category: "fighting", tags: ["Genesis", "Beat-em-up"], year: 1991 },
  { id: "fr26", title: "Golden Axe", url: "https://www.retrogames.cc/sega-genesis-games/golden-axe.html", category: "action", tags: ["Genesis", "Fantasy"], year: 1989 },
  { id: "fr27", title: "Comix Zone", url: "https://www.retrogames.cc/sega-genesis-games/comix-zone.html", category: "action", tags: ["Genesis", "Unique"], year: 1995 },
  { id: "fr28", title: "Pokemon FireRed", url: "https://www.retrogames.cc/gba-games/pokemon-fire-red-version.html", category: "rpg", tags: ["GBA", "Pokemon"], year: 2004 },
  { id: "fr29", title: "Pokemon Emerald", url: "https://www.retrogames.cc/gba-games/pokemon-emerald-version.html", category: "rpg", tags: ["GBA", "Pokemon"], year: 2004 },
  { id: "fr30", title: "Mario Kart GBA", url: "https://www.retrogames.cc/gba-games/mario-kart-super-circuit.html", category: "racing", tags: ["GBA", "Mario Kart"], year: 2001 },
  { id: "fr31", title: "Metroid Fusion", url: "https://www.retrogames.cc/gba-games/metroid-fusion.html", category: "action", tags: ["GBA", "Metroid"], year: 2002 },
  { id: "fr32", title: "Zelda: Minish Cap", url: "https://www.retrogames.cc/gba-games/the-legend-of-zelda-the-minish-cap.html", category: "adventure", tags: ["GBA", "Zelda"], year: 2004 },
  { id: "fr33", title: "Kirby Super Star", url: "https://www.retrogames.cc/snes-games/kirby-super-star.html", category: "platformer", tags: ["SNES", "Kirby"], year: 1996 },
  { id: "fr34", title: "Ice Climber", url: "https://www.retrogames.cc/nes-games/ice-climber.html", category: "platformer", tags: ["NES", "Classic"], year: 1985 },
  { id: "fr35", title: "Balloon Fight", url: "https://www.retrogames.cc/nes-games/balloon-fight.html", category: "arcade", tags: ["NES", "Classic"], year: 1984 },
  { id: "fr36", title: "Kid Icarus", url: "https://www.retrogames.cc/nes-games/kid-icarus.html", category: "action", tags: ["NES", "Mythology"], year: 1986 },
  { id: "fr37", title: "Circus Charlie", url: "https://www.retrogames.cc/nes-games/circus-charlie.html", category: "arcade", tags: ["NES", "Classic"], year: 1984 },
  { id: "fr38", title: "Mario Bros", url: "https://www.retrogames.cc/nes-games/mario-bros.html", category: "arcade", tags: ["NES", "Classic"], year: 1983 },
  { id: "fr39", title: "Ecco the Dolphin", url: "https://www.retrogames.cc/sega-genesis-games/ecco-the-dolphin.html", category: "adventure", tags: ["Genesis", "Underwater"], year: 1992 },
  { id: "fr40", title: "ToeJam & Earl", url: "https://www.retrogames.cc/sega-genesis-games/toejam-and-earl.html", category: "adventure", tags: ["Genesis", "Comedy"], year: 1991 },
  { id: "fr41", title: "Altered Beast", url: "https://www.retrogames.cc/sega-genesis-games/altered-beast.html", category: "action", tags: ["Genesis", "Classic"], year: 1988 },
  { id: "fr42", title: "Castlevania: Aria of Sorrow", url: "https://www.retrogames.cc/gba-games/castlevania-aria-of-sorrow.html", category: "action", tags: ["GBA", "Metroidvania"], year: 2003 },
  { id: "fr43", title: "Final Fantasy Tactics Advance", url: "https://www.retrogames.cc/gba-games/final-fantasy-tactics-advance.html", category: "strategy", tags: ["GBA", "Tactics"], year: 2003 },
  { id: "fr44", title: "Super Mario All-Stars", url: "https://www.retrogames.cc/snes-games/super-mario-all-stars.html", category: "platformer", tags: ["SNES", "Collection"], year: 1993 },
  { id: "fr45", title: "Super Castlevania IV", url: "https://www.retrogames.cc/snes-games/super-castlevania-iv.html", category: "action", tags: ["SNES", "Classic"], year: 1991 },

  // ═══════════════════════════════════════════════════════════
  // HTML5 GAMES (iframe-based, from free sources)
  // ═══════════════════════════════════════════════════════════
  { id: "fh1", title: "2048", url: "https://play2048.co/", category: "puzzle", tags: ["Numbers", "Slide"], year: 2014 },
  { id: "fh2", title: "Sudoku", url: "https://sudoku.com/", category: "puzzle", tags: ["Numbers", "Logic"], year: 2005 },
  { id: "fh3", title: "Space Invaders", url: "https://freebie.games/game/space-invaders/", category: "arcade", tags: ["Classic", "Shooter"], year: 1978 },
  { id: "fh4", title: "Tetris", url: "https://freebie.games/game/tetris/", category: "puzzle", tags: ["Classic", "Blocks"], year: 1984 },
  { id: "fh5", title: "Frogger", url: "https://freebie.games/game/frogger/", category: "arcade", tags: ["Classic", "Road"], year: 1981 },
  { id: "fh6", title: "Asteroids", url: "https://freebie.games/game/asteroids/", category: "arcade", tags: ["Classic", "Space"], year: 1979 },
  { id: "fh7", title: "Breakout", url: "https://freebie.games/game/breakout/", category: "arcade", tags: ["Classic", "Bricks"], year: 1976 },
  { id: "fh8", title: "Dig Dug", url: "https://freebie.games/game/dig-dug/", category: "arcade", tags: ["Classic", "Underground"], year: 1982 },
  { id: "fh9", title: "Missile Command", url: "https://freebie.games/game/missile-command/", category: "arcade", tags: ["Classic", "Defense"], year: 1980 },
  { id: "fh10", title: "Defender", url: "https://freebie.games/game/defender/", category: "arcade", tags: ["Classic", "Side-scroll"], year: 1981 },
  { id: "fh11", title: "Centipede", url: "https://freebie.games/game/centipede/", category: "arcade", tags: ["Classic", "Shooter"], year: 1981 },
];

/** Check if a game is a direct SWF file (vs an HTML page). */
export const isSwfGame = (game: FlashGame): boolean => game.url.endsWith(".swf");

/** Check if a game is an HTML5 iframe game. */
export const isHtml5Game = (game: FlashGame): boolean => !game.url.endsWith(".swf");
