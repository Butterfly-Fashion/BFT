const CATEGORY_SUFFIX: Record<string, string> = {
  "Boxing Gloves": "Boxing Gloves",
  "Caps": "Cap",
  "Bucket Hats": "Bucket Hat",
  "Car Flags": "Car Flag",
};

const STOP_WORDS = new Set([
  "flag",
  "souvenir",
  "mini",
  "boxing",
  "glove",
  "gloves",
  "car",
  "cap",
  "hat",
  "bucket",
  "3d",
  "embroidered",
]);

function titleCase(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractCountry(name: string): string {
  const result: string[] = [];

  for (const word of name.split(" ")) {
    if (STOP_WORDS.has(word.toLowerCase())) {
      break;
    }
    result.push(word);
  }

  return titleCase(result.join(" ") || name.split(" ")[0] || name);
}

export function getB2CDescription(name: string, category: string): string {
  const country = extractCountry(name);

  switch (category) {
    case "Boxing Gloves":
      return `Show your ${country} pride on game day. Lightweight souvenir gloves made for fans to hang, display, or gift.`;
    case "Caps":
      return `Rep ${country} all tournament long. An embroidered fan cap built for match days, watch parties, and everyday pride.`;
    case "Bucket Hats":
      return `${country} fan bucket hat made for game day. A structured brim, bold colours, and an easy fit for the stands.`;
    case "Car Flags":
      return `Fly your ${country} colours wherever you go. A durable car flag for parade days, tailgates, and the drive to the stadium.`;
    default:
      return `Official ${country} fan gear for FIFA World Cup 2026. Gear up, stand proud, and bring the match-day energy.`;
  }
}

export function getB2CName(name: string, category: string): string {
  const displayName = titleCase(name);
  const suffix = CATEGORY_SUFFIX[category];

  if (!suffix || displayName.toLowerCase().includes(suffix.toLowerCase())) {
    return displayName;
  }

  return `${displayName} ${suffix}`;
}
