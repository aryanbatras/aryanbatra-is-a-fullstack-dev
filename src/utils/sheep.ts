/**
 * eSheep — the classic desktop sheep, ported from daedalOS (which uses
 * Adrianotiger's web-esheep). Loads eSheep.js once, then spawns a random
 * pet that walks around the desktop and collides with windows and the Dock.
 * The animation XMLs (eSheep, neko, fox, pingus…) are served locally from
 * /aryan/apps/esheep so everything works offline.
 */

type SheepOptions = {
  allowPopup: string;
  collisionsWith: string[];
  footerMargin: number;
  spawnContainer: HTMLElement;
};

declare global {
  interface Window {
    Sheep?: new (options: SheepOptions) => {
      Start: (animationXmlUrl: string) => void;
    };
  }
}

const PETS: Record<string, [string, number]> = {
  eSheep: ["/aryan/apps/esheep/eSheep.xml", 12],
  fox: ["/aryan/apps/esheep/fox.xml", 4],
  mimiko: ["/aryan/apps/esheep/mimiko.xml", 4],
  neko: ["/aryan/apps/esheep/neko.xml", 10],
  pingus: ["/aryan/apps/esheep/pingus.xml", 10],
};

/** The DOCK_HEIGHT from our MacDesktop — pets rest above it. */
const DOCK_HEIGHT = 84;

let oneSheepLaunched = false;

const pickRandomPet = (): string => {
  const petNames = Object.keys(PETS).flatMap((pet) => {
    const [, probability] = PETS[pet];
    return Array.from({ length: probability }).fill(pet) as string[];
  });
  const randomPet = Math.floor(Math.random() * petNames.length);
  const [petPath] = PETS[petNames[randomPet]];
  return petPath;
};

export const spawnSheep = (pickRandom?: boolean): Promise<void> =>
  new Promise((resolve, reject) => {
    const existing = document.getElementById("aryanos-esheep-js");
    const run = () => {
      if (window.Sheep) {
        // The desktop root is our wallpaper container (find by role since
        // CSS-module class names are hashed); windows use role="dialog".
        const spawnContainer =
          document.querySelector<HTMLElement>('[role="application"]') ??
          document.body;
        const sheep = new window.Sheep({
          allowPopup: "no",
          collisionsWith: [
            "[data-dock]", // our Dock
            '[role="dialog"]', // windows
          ],
          footerMargin: DOCK_HEIGHT,
          spawnContainer,
        });
        if (oneSheepLaunched || pickRandom) {
          sheep.Start(pickRandomPet());
        } else {
          oneSheepLaunched = true;
          sheep.Start("/aryan/apps/esheep/eSheep.xml");
        }
        resolve();
      } else {
        reject(new Error("eSheep failed to load"));
      }
    };
    if (existing) {
      // Script already loaded (another sheep was spawned) — just spawn.
      run();
      return;
    }
    const script = document.createElement("script");
    script.id = "aryanos-esheep-js";
    script.src = "/aryan/apps/esheep/eSheep.js";
    script.onload = run;
    script.onerror = () => reject(new Error("eSheep failed to load"));
    document.body.appendChild(script);
  });

/** Kill the first sheep (daedalOS killSheep). */
export const killSheep = (): void => {
  const firstSheep = document.querySelector(
    '[role="application"] img[src^="data:image"]',
  );
  firstSheep?.parentElement?.remove();
};

export const countSheep = (): number =>
  document.querySelectorAll(
    '[role="application"] img[src^="data:image"]',
  ).length;
