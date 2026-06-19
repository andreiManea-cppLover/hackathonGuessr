export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raza Pământului în km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function calculateScore(distanceKm: number, yearDiff: number): { distanceScore: number; yearScore: number; totalScore: number } {
  const maxScoreComponent = 2500;
  
  // Distanță: scădere exponențială.
  // Decay factor de 2000 km: la 2000 km distanță, scorul scade la ~36% din valoarea maximă.
  const decayKm = 2000;
  const distanceScore = Math.round(maxScoreComponent * Math.exp(-distanceKm / decayKm));
  
  // An: scădere exponențială.
  // Decay factor de 25 ani: la 25 ani eroare, scorul scade la ~36% din valoarea maximă.
  const decayYears = 25;
  const yearScore = Math.round(maxScoreComponent * Math.exp(-yearDiff / decayYears));
  
  return {
    distanceScore,
    yearScore,
    totalScore: distanceScore + yearScore
  };
}

export function getSarcasticRemark(score: number, distanceKm: number, yearDiff: number): string {
  if (score >= 4800) {
    return "Impresionant! Ești sigur că nu ai trișat folosind o mașină a timpului reală? Aproape perfect!";
  }
  if (score >= 4000) {
    return "O aterizare extrem de precisă! Mașina timpului nu a suferit nicio daună. Ai nimerit și zona, și epoca destul de bine.";
  }
  if (score >= 3000) {
    return `Destul de bine... totuși ești la ${distanceKm} km distanță și cu ${yearDiff} ani în plus/minus. Cel puțin nu ai aterizat în era dinozaurilor.`;
  }
  if (score >= 1500) {
    return `Mda... ai ratat destul de mult. ${distanceKm} km și ${yearDiff} ani diferență. AI-ul navei zice că puteam ateriza direct în ocean. Fii mai atent!`;
  }
  if (score >= 500) {
    return `Dezastruos! ${distanceKm} km depărtare și cu ${yearDiff} ani eroare. Cred că ai apăsat pe butoane cu ochii închiși. Încearcă să nu ne autodistrugi în trecut.`;
  }
  return `Felicitări, tocmai ai creat un paradox temporal! ${distanceKm} km distanță și ${yearDiff} ani decalaj. Sincer, nici nu știu cum ai reușit să fii atât de pe lângă.`;
}

// Display a year with an era suffix; negative years are BC (î.Hr.).
export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} î.Hr.` : `${year}`;
}

// Minor English words that should stay lowercase inside a title (unless first).
const TITLE_MINOR_WORDS = new Set([
  "of", "the", "and", "in", "on", "at", "to", "a", "an", "for", "vs", "with", "by",
]);

// Detect a (case-insensitive) Roman numeral so "Xvi" → "XVI", "Vii" → "VII".
function isRomanNumeral(word: string): boolean {
  return /^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i.test(word) && word.length > 0;
}

/**
 * Clean up a raw, machine-humanized title (e.g. "Execution Of Louis Xvi")
 * into a properly cased display string ("Execution of Louis XVI").
 * Lowercases minor words, uppercases Roman numerals, capitalizes the rest.
 */
export function formatHistoricalTitle(title: string): string {
  const words = title.trim().split(/\s+/);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (isRomanNumeral(word)) return word.toUpperCase();
      if (i !== 0 && TITLE_MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Romanian display title for a historical event. Prefers an explicit `titleRo`,
 * otherwise cleans up the raw (often English) `title`.
 */
export function getRomanianTitle(loc: { title: string; titleRo?: string }): string {
  return loc.titleRo?.trim() || formatHistoricalTitle(loc.title);
}

/**
 * Wikipedia URL for an event. Uses an explicit `wikiUrl` when provided,
 * otherwise builds a Romanian-Wikipedia search link from the display title.
 */
export function getWikipediaUrl(loc: { title: string; titleRo?: string; wikiUrl?: string }): string {
  if (loc.wikiUrl) return loc.wikiUrl;
  const query = encodeURIComponent(getRomanianTitle(loc));
  return `https://ro.wikipedia.org/wiki/Special:Search?search=${query}`;
}

export function getTemporalTitle(totalScore: number): string {
  if (totalScore >= 23000) return "Stăpânul Absolut al Timpului (Chrono-King)";
  if (totalScore >= 18000) return "Navigator Temporal de Elită";
  if (totalScore >= 12000) return "Călător de Duminică";
  if (totalScore >= 6000) return "Rătăcit în Spațiu-Timp";
  return "Novice Temporal";
}
