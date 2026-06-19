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

export function getTemporalTitle(totalScore: number): string {
  if (totalScore >= 23000) return "Stăpânul Absolut al Timpului (Chrono-King)";
  if (totalScore >= 18000) return "Navigator Temporal de Elită";
  if (totalScore >= 12000) return "Călător de Duminică";
  if (totalScore >= 6000) return "Rătăcit în Spațiu-Timp";
  return "Eroare în Matricea Temporală (Novice)";
}
