/**
 * Detects JAV Studio / Maker from movie code prefix
 */

const STUDIO_PREFIX_MAP: Record<string, string> = {
  // S1 No.1 Style
  SSIS: 'S1 No.1 Style',
  SSNI: 'S1 No.1 Style',
  SNIS: 'S1 No.1 Style',
  OFJE: 'S1 No.1 Style',
  SOE: 'S1 No.1 Style',

  // MOODYZ
  MIAA: 'MOODYZ',
  MIDE: 'MOODYZ',
  MIDV: 'MOODYZ Diva',
  MIMK: 'MOODYZ Mokkori',
  MIAD: 'MOODYZ',
  MIGD: 'MOODYZ Gachi',

  // FALENO
  FNS: 'FALENO star',
  FSDSS: 'FALENO star',
  FCDSS: 'FALENO star',
  FLNS: 'FALENO',

  // IdeaPocket
  IPX: 'Idea Pocket',
  IPZ: 'Idea Pocket',
  IPZZ: 'Idea Pocket',
  IPT: 'Idea Pocket',

  // SOD (Soft On Demand)
  STARS: 'SOD Create',
  SDDE: 'SOD Create',
  SDMU: 'SOD Create',
  KMHR: 'SOD Create',
  DLDSS: 'DAHLIA',

  // PRESTIGE
  ABW: 'PRESTIGE',
  ABF: 'PRESTIGE',
  ABP: 'PRESTIGE',
  CHN: 'PRESTIGE',

  // ATTACKERS
  ATID: 'Attackers',
  SHKD: 'Attackers',
  RBD: 'Attackers',
  ADN: 'Attackers',

  // MADONNA (Jukujo)
  JUL: 'Madonna',
  JUC: 'Madonna',
  JUQ: 'Madonna',
  JUX: 'Madonna',

  // E-BODY
  EBOD: 'E-BODY',
  EYAN: 'E-BODY',

  // WANZA / WAAA
  WAAA: 'WANZ FACTORY',
  WANZ: 'WANZ FACTORY',

  // PREMIUM
  PRED: 'PREMIUM',
  PBD: 'PREMIUM',
  PGD: 'PREMIUM',

  // KAWAII*
  CAWD: 'kawaii*',
  KWBD: 'kawaii*',

  // DAS!
  DASD: 'DAS!',

  // ROOKIE
  RKI: 'Rookie',

  // HONNAKA
  HND: 'Honnaka',
  HNDS: 'Honnaka',
};

export function detectStudio(movieCode: string): string | null {
  if (!movieCode) return null;
  const upper = movieCode.toUpperCase();
  const match = upper.match(/^([A-Z]+)/);
  if (!match) return null;
  const prefix = match[1];

  // Try exact match first
  if (STUDIO_PREFIX_MAP[prefix]) {
    return STUDIO_PREFIX_MAP[prefix];
  }

  // Try prefix matching
  for (const [key, studio] of Object.entries(STUDIO_PREFIX_MAP)) {
    if (prefix.startsWith(key)) {
      return studio;
    }
  }

  return null;
}
