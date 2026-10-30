/**
 * KAZAJOB — Système d'avatar DiceBear Avataaars
 * Style cartoon/comic avec contours noirs, représentatif de la diversité 974.
 * Génération 100 % locale (aucun appel HTTP) et déterministe : le même config
 * donne toujours le même SVG, côté serveur comme côté client.
 */
import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'

export interface AvatarConfig {
  skinColor:    string
  top:          string    // coiffure
  hairColor:    string
  eyes:         string
  eyebrow:      string
  mouth:        string
  clothes:      string
  clothesColor: string
  accessories:  string
  facialHair:   string
}

type Option = { id: string; label: string }

// ── Palette peaux — représentative de La Réunion ──────────────────
export const SKIN_COLORS: Option[] = [
  { id: 'fae3d0', label: 'Très clair'  },
  { id: 'f8d25c', label: 'Beige doré'  },
  { id: 'fd9841', label: 'Hâlé'        },
  { id: 'edb98a', label: 'Caramel'     },
  { id: 'd08b5b', label: 'Brun chaud'  },
  { id: 'ae5d29', label: 'Chocolat'    },
  { id: '614335', label: 'Ébène'       },
]

// ── Coiffures ─────────────────────────────────────────────────────
// IDs = valeurs exactes DiceBear avataaars v9 (validées via le schéma du package)
export const HAIR_STYLES: Option[] = [
  { id: 'fro',               label: 'Afro'           },
  { id: 'froBand',           label: 'Afro bandeau'   },
  { id: 'dreads01',          label: 'Locs courts'    },
  { id: 'dreads02',          label: 'Locs longs'     },
  { id: 'curly',             label: 'Bouclé'         },
  { id: 'curvy',             label: 'Ondulé long'    },
  { id: 'frizzle',           label: 'Frisé'          },
  { id: 'bigHair',           label: 'Grand volume'   },
  { id: 'shortCurly',        label: 'Court bouclé'   },
  { id: 'shortFlat',         label: 'Court plat'     },
  { id: 'shortWaved',        label: 'Court ondulé'   },
  { id: 'theCaesar',         label: 'César'          },
  { id: 'shavedSides',       label: 'Dégradé côtés'  },
  { id: 'shaggy',            label: 'Décoiffé'       },
  { id: 'straight01',        label: 'Lisse'          },
  { id: 'straight02',        label: 'Lisse long'     },
  { id: 'longButNotTooLong', label: 'Mi-long'        },
  { id: 'miaWallace',        label: 'Carré long'     },
  { id: 'bob',               label: 'Bob'            },
  { id: 'bun',               label: 'Chignon'        },
  { id: 'hijab',             label: 'Hijab'          },
  { id: 'turban',            label: 'Turban'         },
  { id: 'hat',               label: 'Chapeau'        },
  { id: 'winterHat1',        label: 'Bonnet'         },
]

// Couvre-chefs : DiceBear les colore via `hatColor` (on reprend la couleur de tenue)
const HEADWEAR = new Set(['hijab', 'turban', 'hat', 'winterHat1'])

// ── Couleurs de cheveux ───────────────────────────────────────────
export const HAIR_COLORS: Option[] = [
  { id: '2c1b18', label: 'Noir'        },
  { id: '4a312c', label: 'Brun très foncé' },
  { id: '724133', label: 'Brun foncé'  },
  { id: 'b58143', label: 'Châtain'     },
  { id: 'a55728', label: 'Auburn'      },
  { id: 'c1a36b', label: 'Blond'       },
  { id: 'b86060', label: 'Roux'        },
  { id: 'e8e1e1', label: 'Platine'     },
  { id: '929598', label: 'Gris'        },
  { id: 'f59797', label: 'Rose'        },
]

// ── Yeux ──────────────────────────────────────────────────────────
export const EYES_STYLES: Option[] = [
  { id: 'happy',     label: 'Joyeux'      },
  { id: 'default',   label: 'Naturel'     },
  { id: 'wink',      label: 'Clin d\'œil' },
  { id: 'surprised', label: 'Surpris'     },
  { id: 'squint',    label: 'Plissé'      },
  { id: 'side',      label: 'De côté'     },
  { id: 'hearts',    label: 'Amoureux'    },
]

// ── Sourcils ─────────────────────────────────────────────────────
export const EYEBROW_STYLES: Option[] = [
  { id: 'defaultNatural',       label: 'Naturel'    },
  { id: 'default',              label: 'Fins'       },
  { id: 'raisedExcitedNatural', label: 'Haussés'    },
  { id: 'flatNatural',          label: 'Droits'     },
  { id: 'upDownNatural',        label: 'Dubitatif'  },
  { id: 'sadConcernedNatural',  label: 'Inquiet'    },
]

// ── Bouche ────────────────────────────────────────────────────────
export const MOUTH_STYLES: Option[] = [
  { id: 'smile',    label: 'Sourire'  },
  { id: 'default',  label: 'Neutre'   },
  { id: 'twinkle',  label: 'Malicieux' },
  { id: 'tongue',   label: 'Langue'   },
  { id: 'serious',  label: 'Sérieux'  },
]

// ── Tenues ────────────────────────────────────────────────────────
export const CLOTHES_STYLES: Option[] = [
  { id: 'blazerAndShirt',   label: 'Costume'     },
  { id: 'blazerAndSweater', label: 'Blazer'      },
  { id: 'collarAndSweater', label: 'Col roulé'   },
  { id: 'hoodie',           label: 'Hoodie'      },
  { id: 'shirtCrewNeck',    label: 'T-shirt'     },
  { id: 'shirtVNeck',       label: 'Col V'       },
  { id: 'shirtScoopNeck',   label: 'Col rond'    },
  { id: 'overall',          label: 'Salopette'   },
]

// ── Couleurs de tenue ─────────────────────────────────────────────
export const CLOTHES_COLORS: Option[] = [
  { id: '3c4f5c', label: 'Marine'     },
  { id: '262e33', label: 'Noir'       },
  { id: '65c9ff', label: 'Bleu ciel'  },
  { id: '5199e4', label: 'Bleu'       },
  { id: 'ff5c5c', label: 'Rouge'      },
  { id: 'ff488e', label: 'Rose'       },
  { id: 'ffafb9', label: 'Rose pâle'  },
  { id: 'ffffb1', label: 'Jaune'      },
  { id: 'a7ffc4', label: 'Vert mint'  },
  { id: '929598', label: 'Gris'       },
  { id: 'ffdeb5', label: 'Crème'      },
  { id: 'ffffff', label: 'Blanc'      },
]

// ── Accessoires ───────────────────────────────────────────────────
export const ACCESSORIES: Option[] = [
  { id: 'blank',          label: 'Aucun'            },
  { id: 'prescription01', label: 'Lunettes fines'   },
  { id: 'prescription02', label: 'Lunettes rondes'  },
  { id: 'round',          label: 'Lunettes rétro'   },
  { id: 'kurt',           label: 'Petites lunettes' },
  { id: 'wayfarers',      label: 'Wayfarer'         },
  { id: 'sunglasses',     label: 'Lunettes soleil'  },
]

// ── Pilosité faciale ──────────────────────────────────────────────
export const FACIAL_HAIR: Option[] = [
  { id: 'blank',           label: 'Aucune'          },
  { id: 'beardLight',      label: 'Barbe légère'    },
  { id: 'beardMedium',     label: 'Barbe'           },
  { id: 'beardMajestic',   label: 'Grande barbe'    },
  { id: 'moustacheFancy',  label: 'Moustache'       },
  { id: 'moustacheMagnum', label: 'Grosse moustache' },
]

// ── Avatar par défaut ─────────────────────────────────────────────
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinColor:    'edb98a',
  top:          'shortCurly',
  hairColor:    '2c1b18',
  eyes:         'happy',
  eyebrow:      'defaultNatural',
  mouth:        'smile',
  clothes:      'blazerAndShirt',
  clothesColor: '3c4f5c',
  accessories:  'blank',
  facialHair:   'blank',
}

const OPTIONS: Record<keyof AvatarConfig, Option[]> = {
  skinColor:    SKIN_COLORS,
  top:          HAIR_STYLES,
  hairColor:    HAIR_COLORS,
  eyes:         EYES_STYLES,
  eyebrow:      EYEBROW_STYLES,
  mouth:        MOUTH_STYLES,
  clothes:      CLOTHES_STYLES,
  clothesColor: CLOTHES_COLORS,
  accessories:  ACCESSORIES,
  facialHair:   FACIAL_HAIR,
}

const COLOR_KEYS = new Set<keyof AvatarConfig>(['skinColor', 'hairColor', 'clothesColor'])
const HEX = /^[0-9a-f]{6}$/i

/**
 * Normalise un config venant de la base ou du client : clé inconnue ou valeur
 * hors liste → valeur par défaut. Protège aussi le rendu SVG (injecté en HTML)
 * contre toute valeur arbitraire stockée.
 */
export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out = { ...DEFAULT_AVATAR_CONFIG }
  for (const key of Object.keys(OPTIONS) as (keyof AvatarConfig)[]) {
    const v = src[key]
    if (typeof v !== 'string') continue
    if (OPTIONS[key].some((o) => o.id === v) || (COLOR_KEYS.has(key) && HEX.test(v))) {
      out[key] = COLOR_KEYS.has(key) ? v.toLowerCase() : v
    }
  }
  return out
}

/** Vrai si l'objet stocké ressemble à un avatar configuré (pas un objet vide). */
export function hasAvatarConfig(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && typeof (raw as Record<string, unknown>).top === 'string'
}

export function randomAvatarConfig(): AvatarConfig {
  const pick = (arr: Option[]) => arr[Math.floor(Math.random() * arr.length)].id
  return {
    skinColor:    pick(SKIN_COLORS),
    top:          pick(HAIR_STYLES),
    hairColor:    pick(HAIR_COLORS.slice(0, 7)),
    eyes:         pick(EYES_STYLES),
    eyebrow:      pick(EYEBROW_STYLES),
    mouth:        pick(MOUTH_STYLES.slice(0, 3)),
    clothes:      pick(CLOTHES_STYLES),
    clothesColor: pick(CLOTHES_COLORS),
    accessories:  Math.random() < 0.3 ? pick(ACCESSORIES.slice(1)) : 'blank',
    facialHair:   'blank',
  }
}

export function generateAvatarSvg(input: AvatarConfig | Record<string, unknown>): string {
  const config = sanitizeAvatarConfig(input)
  return createAvatar(avataaars, {
    seed:                   'kazajob-avatar',
    skinColor:              [config.skinColor],
    top:                    [config.top] as never,
    topProbability:         100,
    hairColor:              [config.hairColor],
    hatColor:               [HEADWEAR.has(config.top) ? config.clothesColor : config.hairColor],
    eyes:                   [config.eyes] as never,
    eyebrows:               [config.eyebrow] as never,
    mouth:                  [config.mouth] as never,
    clothing:               [config.clothes] as never,
    clothesColor:           [config.clothesColor],
    // Par défaut DiceBear n'affiche accessoires/barbe que 10 % du temps :
    // on force 100 % (ou 0 %) pour que le choix de l'utilisateur soit respecté.
    accessories:            config.accessories === 'blank' ? undefined : [config.accessories] as never,
    accessoriesProbability: config.accessories === 'blank' ? 0 : 100,
    accessoriesColor:       ['262e33'],
    facialHair:             config.facialHair === 'blank' ? undefined : [config.facialHair] as never,
    facialHairProbability:  config.facialHair === 'blank' ? 0 : 100,
    facialHairColor:        [config.hairColor],
    clothingGraphic:        ['bear'] as never,
  }).toString()
}

// ── Personnage « métier » ─────────────────────────────────────────
// DiceBear n'ayant pas de tenues métier dédiées, le domaine est évoqué via tenue + couleur.
export const CHARACTER_GENDERS = [
  { id: 'femme', label: 'Femme',  top: 'longButNotTooLong' },
  { id: 'homme', label: 'Homme',  top: 'shortCurly'        },
  { id: 'autre', label: 'Autre',  top: 'curly'             },
]

export interface CharacterDomain {
  id: string
  label: string
  emoji: string
  clothes: string
  clothesColor: string
  accessories?: string
}

export const CHARACTER_DOMAINS: CharacterDomain[] = [
  { id: 'sante',          label: 'Santé & Social',        emoji: '🩺', clothes: 'shirtVNeck',       clothesColor: 'a7ffc4' },
  { id: 'btp',            label: 'BTP & Artisanat',       emoji: '👷', clothes: 'overall',          clothesColor: 'ffffb1' },
  { id: 'tech',           label: 'Tech & Numérique',      emoji: '💻', clothes: 'hoodie',           clothesColor: '3c4f5c' },
  { id: 'commerce',       label: 'Commerce & Vente',      emoji: '🛍️', clothes: 'blazerAndShirt',   clothesColor: 'ff488e' },
  { id: 'restauration',   label: 'Hôtellerie & Resto',    emoji: '🍽️', clothes: 'collarAndSweater', clothesColor: 'ffffff' },
  { id: 'tourisme',       label: 'Tourisme & Loisirs',    emoji: '🌴', clothes: 'shirtScoopNeck',   clothesColor: '65c9ff' },
  { id: 'transport',      label: 'Transport & Logistique',emoji: '🚚', clothes: 'hoodie',           clothesColor: '929598' },
  { id: 'education',      label: 'Éducation & Formation',  emoji: '📚', clothes: 'blazerAndSweater', clothesColor: '5199e4' },
  { id: 'administration', label: 'Administration & Gestion',emoji: '📊', clothes: 'blazerAndShirt',  clothesColor: '262e33' },
  { id: 'agriculture',    label: 'Agriculture & Environnement', emoji: '🌱', clothes: 'overall',     clothesColor: 'a7ffc4' },
  { id: 'autre',          label: 'Autre domaine',         emoji: '✨', clothes: 'shirtCrewNeck',    clothesColor: '65c9ff' },
]

/**
 * Applique un preset genre/domaine SUR le config existant : seules la coiffure
 * (genre) et la tenue (domaine) changent — peau, yeux, couleurs… sont conservés.
 */
export function applyCharacterPreset(
  base: AvatarConfig | null | undefined,
  change: { domainId?: string; genderId?: string },
): AvatarConfig {
  const config = { ...(base ?? DEFAULT_AVATAR_CONFIG) }
  if (change.genderId) {
    const gender = CHARACTER_GENDERS.find((g) => g.id === change.genderId)
    if (gender) config.top = gender.top
  }
  if (change.domainId) {
    const domain = CHARACTER_DOMAINS.find((d) => d.id === change.domainId)
    if (domain) {
      config.clothes = domain.clothes
      config.clothesColor = domain.clothesColor
      if (domain.accessories) config.accessories = domain.accessories
    }
  }
  return config
}

export function buildCharacterConfig(domainId: string, genderId: string): AvatarConfig {
  return applyCharacterPreset(DEFAULT_AVATAR_CONFIG, { domainId, genderId })
}
