export interface HistoricalLocation {
  id: string;
  title: string;
  /** Optional Romanian display title. Falls back to a formatted `title`. */
  titleRo?: string;
  year: number;
  lat: number;
  lng: number;
  imageUrl: string;
  description: string;
  clues: string[];
  is360?: boolean;
  /** Optional explicit Wikipedia article URL (ro or en). */
  wikiUrl?: string;
}

export const historicalLocations: HistoricalLocation[] = [
  {
    id: "1",
    title: "Construcția Turnului Eiffel",
    year: 1888,
    lat: 48.8584,
    lng: 2.2945,
    imageUrl: "/images/poza2.jpeg",
    is360: true,
    description: "Turnul Eiffel a fost construit între 1887 și 1889 ca arc de intrare pentru Expoziția Universală din 1889, care a marcat centenarul Revoluției Franceze.",
    clues: [
      "Se află în capitala modei și a dragostei.",
      "A fost construit pentru Expoziția Universală de la sfârșitul secolului al XIX-lea.",
      "Structura este realizată integral din oțel pudlat."
    ]
  },
  {
    id: "2",
    title: "Căderea Zidului Berlinului",
    year: 1989,
    lat: 52.5074,
    lng: 13.3759,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/West_and_East_Germans_at_the_Brandenburg_Gate_in_1989.jpg",
    description: "La 9 noiembrie 1989, după săptămâni de proteste civile, guvernul Germaniei de Est a anunțat că toți cetățenii săi pot vizita Germania de Vest. Oamenii au asaltat zidul, dărâmându-l bucată cu bucată.",
    clues: [
      "Acest eveniment a marcat sfârșitul Războiului Rece în Europa.",
      "Se întâmplă în Germania, chiar la Poarta Brandenburg.",
      "Anul coincide cu revoluțiile anticomuniste din Europa de Est, inclusiv cea din România."
    ]
  },
  {
    id: "3",
    title: "Marea Unire de la Alba Iulia",
    year: 1918,
    lat: 46.0689,
    lng: 23.5716,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Samoila_Marza_-_Adunarea_de_la_Alba_Iulia%2C_1_decembrie_1918.jpg",
    description: "Rezoluția Adunării Naționale de la Alba Iulia a proclamat unirea Transilvaniei, Banatului, Crișanei și Maramureșului cu Regatul României, finalizând procesul Marii Uniri.",
    clues: [
      "Este cel mai important moment din istoria modernă a României.",
      "Se desfășoară în interiorul unei celebre cetăți de tip Vauban.",
      "Anul este imediat următor încheierii luptelor Primului Război Mondial."
    ]
  },
  {
    id: "4",
    title: "Lansarea misiunii Apollo 11",
    year: 1969,
    lat: 28.6082,
    lng: -80.6041,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/93/Apollo_11_launch.jpg",
    description: "Racheta Saturn V decolează de la Centrul Spațial Kennedy (Cape Canaveral, Florida) pentru a duce primii oameni pe Lună: Neil Armstrong, Buzz Aldrin și Michael Collins.",
    clues: [
      "Este rampa de lansare istorică LC-39A din Florida, SUA.",
      "Un mic pas pentru om, un salt uriaș pentru omenire.",
      "Evenimentul a avut loc la sfârșitul tumultosului deceniu al anilor '60."
    ]
  },
  {
    id: "5",
    title: "Inaugurarea Podului Golden Gate",
    year: 1937,
    lat: 37.8199,
    lng: -122.4783,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Golden_Gate_Bridge_opening_1937.jpg",
    description: "Mii de pietoni traversează podul proaspăt inaugurat, care leagă San Francisco de Marin County. Cu culoarea sa portocalie 'International Orange', podul a devenit un simbol global.",
    clues: [
      "Un pod suspendat celebru pentru ceața care îl acoperă des.",
      "Se află pe coasta de vest a Statelor Unite.",
      "A fost deschis în timpul Marii Depresiuni Economice."
    ]
  },
  {
    id: "6",
    title: "Semnarea Declarației de Independență a SUA",
    year: 1776,
    lat: 39.9489,
    lng: -75.15,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Declaration_of_independence.jpg",
    description: "Congresul Continental adoptă oficial Declarația de Independență în Independence Hall din Philadelphia, separând coloniile americane de Regatul Unit.",
    clues: [
      "Orașul este Philadelphia, prima capitală de facto a SUA.",
      "Este actul de naștere al celei mai mari puteri democratice actuale.",
      "Secolul este cel al Iluminismului și al Revoluției Franceze."
    ]
  },
  {
    id: "7",
    title: "Redescoperirea orașului Machu Picchu",
    year: 1911,
    lat: -13.1631,
    lng: -72.545,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Machu_Picchu_1911.jpg",
    description: "Exploratorul american Hiram Bingham ajunge la ruinele din vârful munților Anzi, aducând în atenția lumii întregi uimitorul oraș fortificat al imperiului Incaș.",
    clues: [
      "Orașul sacru se află în munții Anzi, la peste 2.400 de metri altitudine.",
      "Se află în Peru.",
      "Evenimentul s-a petrecut cu 3 ani înaintea izbucnirii Primului Război Mondial."
    ]
  },
  {
    id: "8",
    title: "Inaugurarea Statuii Libertății",
    year: 1886,
    lat: 40.6892,
    lng: -74.0445,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Unveiling_of_the_Statue_of_Liberty_1886.jpg",
    description: "Președintele Grover Cleveland prezidează ceremonia de dezvelire a Statuii Libertății în portul New York, un cadou simbolic din partea poporului francez.",
    clues: [
      "Este amplasată pe Liberty Island, la intrarea în portul New York.",
      "A fost proiectată de Frédéric Auguste Bartholdi și structura metalică de Gustave Eiffel.",
      "Anul este la doar câțiva ani distanță de finalizarea Turnului Eiffel."
    ]
  },
  {
    id: "9",
    title: "Prima fotografie a Piramidelor din Giza",
    year: 1850,
    lat: 29.9792,
    lng: 31.1342,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Great_Sphinx_Giza_1850.jpg",
    description: "Una dintre primele imagini realizate prin tehnica dagherotipiei (de către Maxime Du Camp), înfățișând Sfinxul parțial îngropat în nisip și Piramidele din Giza.",
    clues: [
      "Fotografia arată singura minune supraviețuitoare a lumii antice.",
      "Se află în apropiere de Cairo, Egipt.",
      "Mijlocul secolului al XIX-lea, la scurt timp după inventarea fotografiei."
    ]
  },
  {
    id: "10",
    title: "Plecarea în larg a Titanicului",
    year: 1912,
    lat: 50.8972,
    lng: -1.3972,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fd/RMS_Titanic_3.jpg",
    description: "Cel mai mare pachebot din lume, RMS Titanic, părăsește portul Southampton, Anglia, pentru călătoria sa inaugurală spre New York, care se va termina tragic 5 zile mai târziu.",
    clues: [
      "Portul de plecare este în sudul Angliei (Southampton).",
      "Nava era considerată 'de nescufundat'.",
      "Tragedia a avut loc în primăvara anului 1912."
    ]
  },
  {
    id: "11",
    title: "Încoronarea Reginei Elisabeta a II-a",
    year: 1953,
    lat: 51.4993,
    lng: -0.1273,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Coronation_of_Queen_Elizabeth_II_Westminster_Abbey.jpg",
    description: "Ceremonia solemnă de încoronare a Reginei Elisabeta a II-a la Westminster Abbey din Londra. A fost primul eveniment regal major transmis în direct la televiziune.",
    clues: [
      "Locul încoronării regilor britanici din 1066 încoace.",
      "Se află pe malul Tamisei, în Londra.",
      "Anul este la opt ani de la încheierea celui de-al Doilea Război Mondial."
    ]
  },
  {
    id: "12",
    title: "Inaugurarea Canalului Suez",
    year: 1869,
    lat: 30.5852,
    lng: 32.2654,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/L%27inauguration_du_canal_de_Suez_en_1869.jpg",
    description: "O ceremonie fastuoasă marchează deschiderea canalului navigabil Suez de către împărăteasa Eugénie a Franței, scurtând drastic drumul maritim dintre Europa și Asia.",
    clues: [
      "Canalul leagă Marea Mediterană de Marea Roșie.",
      "Se află în Egipt.",
      "Același an în care Dmitri Mendeleev a publicat Tabelul Periodic al Elementelor."
    ]
  },
  {
    id: "13",
    title: "Marele Incendiu din Londra",
    year: 1666,
    lat: 51.5101,
    lng: -0.086,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Great_Fire_of_London_painting.jpg",
    description: "Un incendiu devastator izbucnește în brutăria lui Thomas Farriner de pe Pudding Lane, arzând 80% din orașul medieval Londra și ducând la reconstrucția sa.",
    clues: [
      "A distrus peste 13.000 de case și vechea Catedrală St. Paul.",
      "Orașul distrus este Londra.",
      "Anul conține o cifră biblică controversată repetată de trei ori."
    ]
  },
  {
    id: "14",
    title: "Inaugurarea Turnului de Televiziune (Fernsehturm)",
    year: 1969,
    lat: 52.5208,
    lng: 13.4094,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Fernsehturm_DDR_1969.jpg",
    description: "Guvernul Republicii Democrate Germane (DDR) inaugurează impunătorul turn din Alexanderplatz ca un simbol al superiorității tehnologice socialiste.",
    clues: [
      "Se află în Berlinul de Est, în piața Alexanderplatz.",
      "Este cel mai înalt turn din Germania (368m).",
      "Deschiderea a avut loc în același an cu aselenizarea Apollo 11."
    ]
  },
  {
    id: "15",
    title: "Finalizarea statuii Hristos Mântuitorul",
    year: 1931,
    lat: -22.9519,
    lng: -43.2105,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Cristo_Redentor_under_construction.jpg",
    description: "Statuia monumentală a lui Iisus Hristos de pe muntele Corcovado este sfințită și deschisă publicului, devenind cel mai recunoscut simbol al Braziliei.",
    clues: [
      "Statuia veghează golful orașului Rio de Janeiro.",
      "Capul și mâinile au fost realizate de sculptorul român Gheorghe Leonida.",
      "Anul coincide cu apogeul Marii Depresiuni Economice globale."
    ]
  }
];
