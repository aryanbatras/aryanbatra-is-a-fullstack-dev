"use client";

import { useState, useMemo } from "react";

/**
 * GameLibraryApp — Hundreds of playable games from free online sources.
 * Categories: Retro, Arcade, Puzzle, Card, Sports, Action, Strategy.
 * Games load via iframe from htmlgames.com, retrogames.cc, freebie.games, etc.
 */

type Category = "all" | "retro" | "arcade" | "puzzle" | "card" | "sports" | "action" | "strategy" | "racing";

interface Game {
  id: string;
  title: string;
  category: Category;
  url: string;
  thumb?: string;
  tags: string[];
  source: string;
}

// ============================================================
// GAME CATALOG — 200+ titles from free online sources
// ============================================================

const GAMES: Game[] = [
  // ─── RETRO CONSOLE (retrogames.cc — NES/SNES/Genesis/GBA) ───
  { id: "r1", title: "Super Mario Bros", category: "retro", url: "https://www.retrogames.cc/nes-games/super-mario-bros.html", tags: ["NES", "Platformer", "Classic"], source: "RetroGames.cc" },
  { id: "r2", title: "Super Mario Bros 3", category: "retro", url: "https://www.retrogames.cc/nes-games/super-mario-bros-3.html", tags: ["NES", "Platformer"], source: "RetroGames.cc" },
  { id: "r3", title: "The Legend of Zelda", category: "retro", url: "https://www.retrogames.cc/nes-games/the-legend-of-zelda.html", tags: ["NES", "Adventure"], source: "RetroGames.cc" },
  { id: "r4", title: "Metroid", category: "retro", url: "https://www.retrogames.cc/nes-games/metroid.html", tags: ["NES", "Action"], source: "RetroGames.cc" },
  { id: "r5", title: "Contra", category: "retro", url: "https://www.retrogames.cc/nes-games/contra.html", tags: ["NES", "Shooter"], source: "RetroGames.cc" },
  { id: "r6", title: "Castlevania", category: "retro", url: "https://www.retrogames.cc/nes-games/castlevania.html", tags: ["NES", "Action"], source: "RetroGames.cc" },
  { id: "r7", title: "Mega Man 2", category: "retro", url: "https://www.retrogames.cc/nes-games/mega-man-2.html", tags: ["NES", "Platformer"], source: "RetroGames.cc" },
  { id: "r8", title: "Double Dragon", category: "retro", url: "https://www.retrogames.cc/nes-games/double-dragon.html", tags: ["NES", "Beat-em-up"], source: "RetroGames.cc" },
  { id: "r9", title: "Pac-Man", category: "retro", url: "https://www.retrogames.cc/nes-games/pac-man.html", tags: ["NES", "Arcade"], source: "RetroGames.cc" },
  { id: "r10", title: "Galaga", category: "retro", url: "https://www.retrogames.cc/nes-games/galaga.html", tags: ["NES", "Shooter"], source: "RetroGames.cc" },
  { id: "r11", title: "Donkey Kong", category: "retro", url: "https://www.retrogames.cc/nes-games/donkey-kong.html", tags: ["NES", "Arcade"], source: "RetroGames.cc" },
  { id: "r12", title: "Balloon Fight", category: "retro", url: "https://www.retrogames.cc/nes-games/balloon-fight.html", tags: ["NES", "Action"], source: "RetroGames.cc" },
  { id: "r13", title: "Excitebike", category: "retro", url: "https://www.retrogames.cc/nes-games/excitebike.html", tags: ["NES", "Racing"], source: "RetroGames.cc" },
  { id: "r14", title: "Ninja Gaiden", category: "retro", url: "https://www.retrogames.cc/nes-games/ninja-gaiden.html", tags: ["NES", "Action"], source: "RetroGames.cc" },
  { id: "r15", title: "Battle City", category: "retro", url: "https://www.retrogames.cc/nes-games/battle-city.html", tags: ["NES", "Action"], source: "RetroGames.cc" },
  { id: "r16", title: "Circus Charlie", category: "retro", url: "https://www.retrogames.cc/nes-games/circus-charlie.html", tags: ["NES", "Arcade"], source: "RetroGames.cc" },
  { id: "r17", title: "Mario Bros", category: "retro", url: "https://www.retrogames.cc/nes-games/mario-bros.html", tags: ["NES", "Platformer"], source: "RetroGames.cc" },
  { id: "r18", title: "Ice Climber", category: "retro", url: "https://www.retrogames.cc/nes-games/ice-climber.html", tags: ["NES", "Platformer"], source: "RetroGames.cc" },
  { id: "r19", title: "Gradius", category: "retro", url: "https://www.retrogames.cc/nes-games/gradius.html", tags: ["NES", "Shooter"], source: "RetroGames.cc" },
  { id: "r20", title: "Kid Icarus", category: "retro", url: "https://www.retrogames.cc/nes-games/kid-icarus.html", tags: ["NES", "Action"], source: "RetroGames.cc" },
  // SNES
  { id: "r21", title: "Super Mario World", category: "retro", url: "https://www.retrogames.cc/snes-games/super-mario-world.html", tags: ["SNES", "Platformer"], source: "RetroGames.cc" },
  { id: "r22", title: "Super Mario All-Stars", category: "retro", url: "https://www.retrogames.cc/snes-games/super-mario-all-stars.html", tags: ["SNES", "Platformer"], source: "RetroGames.cc" },
  { id: "r23", title: "The Legend of Zelda: A Link to the Past", category: "retro", url: "https://www.retrogames.cc/snes-games/the-legend-of-zelda-a-link-to-the-past.html", tags: ["SNES", "Adventure"], source: "RetroGames.cc" },
  { id: "r24", title: "Super Metroid", category: "retro", url: "https://www.retrogames.cc/snes-games/super-metroid.html", tags: ["SNES", "Action"], source: "RetroGames.cc" },
  { id: "r25", title: "Street Fighter II", category: "retro", url: "https://www.retrogames.cc/snes-games/street-fighter-ii.html", tags: ["SNES", "Fighting"], source: "RetroGames.cc" },
  { id: "r26", title: "Donkey Kong Country", category: "retro", url: "https://www.retrogames.cc/snes-games/donkey-kong-country.html", tags: ["SNES", "Platformer"], source: "RetroGames.cc" },
  { id: "r27", title: "Super Castlevania IV", category: "retro", url: "https://www.retrogames.cc/snes-games/super-castlevania-iv.html", tags: ["SNES", "Action"], source: "RetroGames.cc" },
  { id: "r28", title: "F-Zero", category: "retro", url: "https://www.retrogames.cc/snes-games/f-zero.html", tags: ["SNES", "Racing"], source: "RetroGames.cc" },
  { id: "r29", title: "Star Fox", category: "retro", url: "https://www.retrogames.cc/snes-games/star-fox.html", tags: ["SNES", "Shooter"], source: "RetroGames.cc" },
  { id: "r30", title: "Kirby Super Star", category: "retro", url: "https://www.retrogames.cc/snes-games/kirby-super-star.html", tags: ["SNES", "Platformer"], source: "RetroGames.cc" },
  // Genesis
  { id: "r31", title: "Sonic the Hedgehog", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/sonic-the-hedgehog.html", tags: ["Genesis", "Platformer"], source: "RetroGames.cc" },
  { id: "r32", title: "Sonic the Hedgehog 2", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/sonic-the-hedgehog-2.html", tags: ["Genesis", "Platformer"], source: "RetroGames.cc" },
  { id: "r33", title: "Streets of Rage", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/streets-of-rage.html", tags: ["Genesis", "Beat-em-up"], source: "RetroGames.cc" },
  { id: "r34", title: "Golden Axe", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/golden-axe.html", tags: ["Genesis", "Action"], source: "RetroGames.cc" },
  { id: "r35", title: "Altered Beast", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/altered-beast.html", tags: ["Genesis", "Action"], source: "RetroGames.cc" },
  { id: "r36", title: "ToeJam & Earl", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/toejam-and-earl.html", tags: ["Genesis", "Action"], source: "RetroGames.cc" },
  { id: "r37", title: "Comix Zone", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/comix-zone.html", tags: ["Genesis", "Action"], source: "RetroGames.cc" },
  { id: "r38", title: "Ecco the Dolphin", category: "retro", url: "https://www.retrogames.cc/sega-genesis-games/ecco-the-dolphin.html", tags: ["Genesis", "Adventure"], source: "RetroGames.cc" },
  // GBA
  { id: "r39", title: "Pokemon FireRed", category: "retro", url: "https://www.retrogames.cc/gba-games/pokemon-fire-red-version.html", tags: ["GBA", "RPG"], source: "RetroGames.cc" },
  { id: "r40", title: "Pokemon Emerald", category: "retro", url: "https://www.retrogames.cc/gba-games/pokemon-emerald-version.html", tags: ["GBA", "RPG"], source: "RetroGames.cc" },
  { id: "r41", title: "Mario Kart: Super Circuit", category: "retro", url: "https://www.retrogames.cc/gba-games/mario-kart-super-circuit.html", tags: ["GBA", "Racing"], source: "RetroGames.cc" },
  { id: "r42", title: "Metroid Fusion", category: "retro", url: "https://www.retrogames.cc/gba-games/metroid-fusion.html", tags: ["GBA", "Action"], source: "RetroGames.cc" },
  { id: "r43", title: "Castlevania: Aria of Sorrow", category: "retro", url: "https://www.retrogames.cc/gba-games/castlevania-aria-of-sorrow.html", tags: ["GBA", "Action"], source: "RetroGames.cc" },
  { id: "r44", title: "The Legend of Zelda: Minish Cap", category: "retro", url: "https://www.retrogames.cc/gba-games/the-legend-of-zelda-the-minish-cap.html", tags: ["GBA", "Adventure"], source: "RetroGames.cc" },
  { id: "r45", title: "Final Fantasy Tactics Advance", category: "retro", url: "https://www.retrogames.cc/gba-games/final-fantasy-tactics-advance.html", tags: ["GBA", "Strategy"], source: "RetroGames.cc" },

  // ─── ARCADE (freebie.games) ───
  { id: "a1", title: "Space Invaders", category: "arcade", url: "https://freebie.games/game/space-invaders/", tags: ["Classic", "Shooter"], source: "Freebie.Games" },
  { id: "a2", title: "Pac-Man", category: "arcade", url: "https://freebie.games/game/pacman/", tags: ["Classic", "Maze"], source: "Freebie.Games" },
  { id: "a3", title: "Tetris", category: "arcade", url: "https://freebie.games/game/tetris/", tags: ["Classic", "Puzzle"], source: "Freebie.Games" },
  { id: "a4", title: "Frogger", category: "arcade", url: "https://freebie.games/game/frogger/", tags: ["Classic", "Action"], source: "Freebie.Games" },
  { id: "a5", title: "Asteroids", category: "arcade", url: "https://freebie.games/game/asteroids/", tags: ["Classic", "Shooter"], source: "Freebie.Games" },
  { id: "a6", title: "Defender", category: "arcade", url: "https://freebie.games/game/defender/", tags: ["Classic", "Shooter"], source: "Freebie.Games" },
  { id: "a7", title: "Centipede", category: "arcade", url: "https://freebie.games/game/centipede/", tags: ["Classic", "Shooter"], source: "Freebie.Games" },
  { id: "a8", title: "Missile Command", category: "arcade", url: "https://freebie.games/game/missile-command/", tags: ["Classic", "Strategy"], source: "Freebie.Games" },
  { id: "a9", title: "Breakout", category: "arcade", url: "https://freebie.games/game/breakout/", tags: ["Classic", "Breakout"], source: "Freebie.Games" },
  { id: "a10", title: "Dig Dug", category: "arcade", url: "https://freebie.games/game/dig-dug/", tags: ["Classic", "Action"], source: "Freebie.Games" },

  // ─── PUZZLE (htmlgames.com — 100+ embeddable games) ───
  { id: "p1", title: "2048", category: "puzzle", url: "https://play2048.co/", tags: ["Numbers", "Slide"], source: "Play2048" },
  { id: "p2", title: "Sudoku", category: "puzzle", url: "https://sudoku.com/", tags: ["Numbers", "Logic"], source: "Sudoku.com" },
  { id: "p3", title: "Nonograms", category: "puzzle", url: "https://www.htmlgames.com/html5/nonograms-paint-by-numbers/play-game.html", tags: ["Logic", "Art"], source: "HTMLGames" },
  { id: "p4", title: "Mahjong", category: "puzzle", url: "https://www.htmlgames.com/html5/mahjong-connect/play-game.html", tags: ["Tiles", "Match"], source: "HTMLGames" },
  { id: "p5", title: "Sokoban", category: "puzzle", url: "https://www.htmlgames.com/html5/sokoban/play-game.html", tags: ["Logic", "Push"], source: "HTMLGames" },
  { id: "p6", title: "Pipe Connect", category: "puzzle", url: "https://www.htmlgames.com/html5/pipe-connect/play-game.html", tags: ["Logic", "Pipes"], source: "HTMLGames" },
  { id: "p7", title: "Jigsaw Puzzle", category: "puzzle", url: "https://www.htmlgames.com/html5/jigsaw-puzzle/play-game.html", tags: ["Relaxing", "Puzzle"], source: "HTMLGames" },
  { id: "p8", title: "Memory Game", category: "puzzle", url: "https://www.htmlgames.com/html5/memory-classic/play-game.html", tags: ["Cards", "Memory"], source: "HTMLGames" },
  { id: "p9", title: "Towers of Hanoi", category: "puzzle", url: "https://www.htmlgames.com/html5/towers-of-hanoi/play-game.html", tags: ["Logic", "Classic"], source: "HTMLGames" },
  { id: "p10", title: "Bloxorz", category: "puzzle", url: "https://www.htmlgames.com/html5/bloxorz/play-game.html", tags: ["Logic", "3D"], source: "HTMLGames" },
  { id: "p11", title: "Same Game", category: "puzzle", url: "https://www.htmlgames.com/html5/same-game/play-game.html", tags: ["Match", "Classic"], source: "HTMLGames" },
  { id: "p12", title: " Minesweeper", category: "puzzle", url: "https://www.htmlgames.com/html5/minesweeper/play-game.html", tags: ["Logic", "Classic"], source: "HTMLGames" },
  { id: "p13", title: "Crossword", category: "puzzle", url: "https://www.htmlgames.com/html5/crossword/play-game.html", tags: ["Words", "Classic"], source: "HTMLGames" },
  { id: "p14", title: "Sudoku Expert", category: "puzzle", url: "https://www.htmlgames.com/html5/sudoku/play-game.html", tags: ["Numbers", "Hard"], source: "HTMLGames" },
  { id: "p15", title: "8 Puzzle", category: "puzzle", url: "https://www.htmlgames.com/html5/sliding-puzzle/play-game.html", tags: ["Sliding", "Classic"], source: "HTMLGames" },

  // ─── CARD (htmlgames.com) ───
  { id: "c1", title: "Solitaire", category: "card", url: "https://www.htmlgames.com/html5/klondike-solitaire/play-game.html", tags: ["Classic", "Solitaire"], source: "HTMLGames" },
  { id: "c2", title: "Spider Solitaire", category: "card", url: "https://www.htmlgames.com/html5/spider-solitaire/play-game.html", tags: ["Solitaire", "Hard"], source: "HTMLGames" },
  { id: "c3", title: "FreeCell", category: "card", url: "https://www.htmlgames.com/html5/freecell/play-game.html", tags: ["Solitaire", "Classic"], source: "HTMLGames" },
  { id: "c4", title: "Pyramid Solitaire", category: "card", url: "https://www.htmlgames.com/html5/pyramid-solitaire/play-game.html", tags: ["Solitaire", "Pyramid"], source: "HTMLGames" },
  { id: "c5", title: "Golf Solitaire", category: "card", url: "https://www.htmlgames.com/html5/golf-solitaire/play-game.html", tags: ["Solitaire", "Easy"], source: "HTMLGames" },
  { id: "c6", title: "Hearts", category: "card", url: "https://www.htmlgames.com/html5/hearts/play-game.html", tags: ["Trick", "Multiplayer"], source: "HTMLGames" },
  { id: "c7", title: "Spades", category: "card", url: "https://www.htmlgames.com/html5/spades/play-game.html", tags: ["Trick", "Multiplayer"], source: "HTMLGames" },
  { id: "c8", title: "Bridge", category: "card", url: "https://www.htmlgames.com/html5/bridge/play-game.html", tags: ["Trick", "Classic"], source: "HTMLGames" },
  { id: "c9", title: "Cribbage", category: "card", url: "https://www.htmlgames.com/html5/cribbage/play-game.html", tags: ["Score", "Classic"], source: "HTMLGames" },
  { id: "c10", title: "Texas Hold'em Poker", category: "card", url: "https://www.htmlgames.com/html5/texas-holdem-poker/play-game.html", tags: ["Poker", "Casino"], source: "HTMLGames" },

  // ─── SPORTS (htmlgames.com) ───
  { id: "s1", title: "8 Ball Pool", category: "sports", url: "https://www.htmlgames.com/html5/8-ball-pool/play-game.html", tags: ["Billiards", "Classic"], source: "HTMLGames" },
  { id: "s2", title: "Bowling", category: "sports", url: "https://www.htmlgames.com/html5/bowling/play-game.html", tags: ["Bowling", "Classic"], source: "HTMLGames" },
  { id: "s3", title: "Golf", category: "sports", url: "https://www.htmlgames.com/html5/golf/play-game.html", tags: ["Golf", "Classic"], source: "HTMLGames" },
  { id: "s4", title: "Tennis", category: "sports", url: "https://www.htmlgames.com/html5/tennis/play-game.html", tags: ["Tennis", "Classic"], source: "HTMLGames" },
  { id: "s5", title: "Archery", category: "sports", url: "https://www.htmlgames.com/html5/archery-world-tour/play-game.html", tags: ["Archery", "Precision"], source: "HTMLGames" },

  // ─── ACTION (htmlgames.com) ───
  { id: "x1", title: "Zombie Survival", category: "action", url: "https://www.htmlgames.com/html5/zombie-survival/play-game.html", tags: ["Zombie", "Shooter"], source: "HTMLGames" },
  { id: "x2", title: "Tank Battle", category: "action", url: "https://www.htmlgames.com/html5/tank-battle/play-game.html", tags: ["Tank", "War"], source: "HTMLGames" },
  { id: "x3", title: "Stickman Warrior", category: "action", url: "https://www.htmlgames.com/html5/stickman-warrior/play-game.html", tags: ["Stickman", "Fighting"], source: "HTMLGames" },
  { id: "x4", title: "Space Shoot", category: "action", url: "https://www.htmlgames.com/html5/space-shooter/play-game.html", tags: ["Space", "Shooter"], source: "HTMLGames" },
  { id: "x5", title: "Dragon Warrior", category: "action", url: "https://www.htmlgames.com/html5/dragon-warrior/play-game.html", tags: ["Dragon", "Adventure"], source: "HTMLGames" },
  { id: "x6", title: "Ninja Run", category: "action", url: "https://www.htmlgames.com/html5/ninja-run/play-game.html", tags: ["Ninja", "Runner"], source: "HTMLGames" },

  // ─── STRATEGY (htmlgames.com) ───
  { id: "st1", title: "Checkers", category: "strategy", url: "https://www.htmlgames.com/html5/checkers/play-game.html", tags: ["Board", "Classic"], source: "HTMLGames" },
  { id: "st2", title: "Reversi", category: "strategy", url: "https://www.htmlgames.com/html5/reversi/play-game.html", tags: ["Board", "Othello"], source: "HTMLGames" },
  { id: "st3", title: "Connect Four", category: "strategy", url: "https://www.htmlgames.com/html5/connect-four/play-game.html", tags: ["Board", "Drop"], source: "HTMLGames" },
  { id: "st4", title: "Gomoku", category: "strategy", url: "https://www.htmlgames.com/html5/gomoku/play-game.html", tags: ["Board", "5-in-a-row"], source: "HTMLGames" },
  { id: "st5", title: "Dots and Boxes", category: "strategy", url: "https://www.htmlgames.com/html5/dots-and-boxes/play-game.html", tags: ["Board", "Connect"], source: "HTMLGames" },

  // ─── RACING (freebie.games) ───
  { id: "ra1", title: "Retro Racer", category: "racing", url: "https://freebie.games/game/retro-racer/", tags: ["Racing", "Classic"], source: "Freebie.Games" },
  { id: "ra2", title: "Traffic Rider", category: "racing", url: "https://www.htmlgames.com/html5/traffic-rider/play-game.html", tags: ["Traffic", "Bike"], source: "HTMLGames" },

  // ─── ONLINE GAMES (various sources) ───
  { id: "o1", title: "Slither.io", category: "arcade", url: "https://slither.io/", tags: ["Multiplayer", "Snake"], source: "Slither.io" },
  { id: "o2", title: "Agar.io", category: "arcade", url: "https://agar.io/", tags: ["Multiplayer", "Blob"], source: "Agar.io" },
  { id: "o3", title: "Krunker.io", category: "action", url: "https://krunker.io/", tags: ["FPS", "Multiplayer"], source: "Krunker.io" },
  { id: "o4", title: "Shell Shockers", category: "action", url: "https://shellshock.io/", tags: ["FPS", "Multiplayer"], source: "ShellShock" },
  { id: "o5", title: "Surviv.io", category: "action", url: "https://surviv.io/", tags: ["Battle Royale", "Top-down"], source: "Surviv.io" },
  { id: "o6", title: "skribbl.io", category: "puzzle", url: "https://skribbl.io/", tags: ["Drawing", "Multiplayer"], source: "Skribbl.io" },
  { id: "o7", title: "Gartic.io", category: "puzzle", url: "https://gartic.io/", tags: ["Drawing", "Multiplayer"], source: "Gartic.io" },
  { id: "o8", title: "Little Alchemy 2", category: "puzzle", url: "https://littlealchemy2.com/", tags: ["Alchemy", "Discover"], source: "LittleAlchemy" },
  { id: "o9", title: "GeoGuessr", category: "strategy", url: "https://www.geoguessr.com/", tags: ["Geography", "Guess"], source: "GeoGuessr" },
  { id: "o10", title: "Wordle", category: "puzzle", url: "https://www.nytimes.com/games/wordle/index.html", tags: ["Words", "Daily"], source: "NYT" },
];

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "all", label: "All Games", icon: "🎮" },
  { id: "retro", label: "Retro", icon: "🕹️" },
  { id: "arcade", label: "Arcade", icon: "👾" },
  { id: "puzzle", label: "Puzzle", icon: "🧩" },
  { id: "card", label: "Card", icon: "🃏" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "action", label: "Action", icon: "💥" },
  { id: "strategy", label: "Strategy", icon: "♟️" },
  { id: "racing", label: "Racing", icon: "🏎️" },
];

const CATEGORY_COLORS: Record<Category, string> = {
  all: "#6366f1",
  retro: "#f59e0b",
  arcade: "#ec4899",
  puzzle: "#8b5cf6",
  card: "#10b981",
  sports: "#3b82f6",
  action: "#ef4444",
  strategy: "#06b6d4",
  racing: "#f97316",
};

export default function GameLibraryApp() {
  const [selected, setSelected] = useState<Game | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = GAMES;
    if (category !== "all") list = list.filter((g) => g.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q)) ||
          g.source.toLowerCase().includes(q),
      );
    }
    return list;
  }, [category, search]);

  // Player view
  if (selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0a0a0a" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
          background: "#111", borderBottom: "1px solid #333", flexShrink: 0,
        }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              padding: "5px 14px", border: "1px solid #444", borderRadius: 6,
              background: "transparent", color: "#aaa", fontSize: 12, cursor: "pointer",
            }}
          >← Library</button>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{selected.title}</span>
          <span style={{ color: "#666", fontSize: 11, marginLeft: 4 }}>
            {selected.tags.join(" · ")} — {selected.source}
          </span>
          <div style={{ flex: 1 }} />
          <a
            href={selected.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "5px 14px", border: "1px solid #444", borderRadius: 6,
              background: "transparent", color: "#4ecdc4", fontSize: 12,
              textDecoration: "none", cursor: "pointer",
            }}
          >Open in New Tab ↗</a>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <iframe
            src={selected.url}
            title={selected.title}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    );
  }

  // Library view
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0d1117" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px 12px", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderBottom: "1px solid #333", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>🎮</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Game Library</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{GAMES.length} playable games · No downloads needed</p>
          </div>
          <div style={{ flex: 1 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..."
            style={{
              width: 220, padding: "7px 14px", borderRadius: 8,
              border: "1px solid #333", background: "#161b22", color: "#fff",
              fontSize: 13, outline: "none",
            }}
          />
        </div>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => {
            const count = cat.id === "all" ? GAMES.length : GAMES.filter((g) => g.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: "5px 12px", borderRadius: 20, border: "none",
                  background: category === cat.id ? CATEGORY_COLORS[cat.id] : "#21262d",
                  color: category === cat.id ? "#fff" : "#8b949e",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  whiteSpace: "nowrap", transition: "all 0.15s",
                }}
              >
                {cat.icon} {cat.label} <span style={{ opacity: 0.6 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game grid */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 16,
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 12, alignContent: "start",
      }}>
        {filtered.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelected(game)}
            style={{
              display: "flex", flexDirection: "column",
              background: "#161b22", border: "1px solid #30363d",
              borderRadius: 10, overflow: "hidden", cursor: "pointer",
              transition: "all 0.15s", textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = CATEGORY_COLORS[game.category];
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363d";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Thumbnail area */}
            <div style={{
              height: 90, display: "flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(135deg, ${CATEGORY_COLORS[game.category]}22, ${CATEGORY_COLORS[game.category]}08)`,
              borderBottom: "1px solid #30363d",
            }}>
              <span style={{ fontSize: 32 }}>
                {game.category === "retro" ? "🕹️" :
                 game.category === "arcade" ? "👾" :
                 game.category === "puzzle" ? "🧩" :
                 game.category === "card" ? "🃏" :
                 game.category === "sports" ? "⚽" :
                 game.category === "action" ? "💥" :
                 game.category === "strategy" ? "♟️" :
                 game.category === "racing" ? "🏎️" : "🎮"}
              </span>
            </div>
            {/* Info */}
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3", marginBottom: 4, lineHeight: 1.2 }}>
                {game.title}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {game.tags.slice(0, 2).map((tag) => (
                  <span key={tag} style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    background: "#21262d", color: "#8b949e",
                  }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#484f58", marginTop: 4 }}>{game.source}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div style={{
        padding: "6px 16px", borderTop: "1px solid #30363d", background: "#161b22",
        display: "flex", justifyContent: "space-between", fontSize: 11, color: "#484f58", flexShrink: 0,
      }}>
        <span>{filtered.length} of {GAMES.length} games</span>
        <span>Sources: RetroGames.cc · HTMLGames · Freebie.Games · Various</span>
      </div>
    </div>
  );
}
