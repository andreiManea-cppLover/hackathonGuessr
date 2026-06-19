import { NextResponse } from "next/server";

interface LeaderboardEntry {
  name: string;
  score: number;
  title: string;
  date: string;
}

// Tabela de scoruri în memorie la nivel de server
let globalLeaderboard: LeaderboardEntry[] = [
  { name: "EINSTEIN_A", score: 24150, title: "Stăpânul Absolut al Timpului (Chrono-King)", date: "1921-11-09" },
  { name: "MARTY_M", score: 21890, title: "Navigator Temporal de Elită", date: "1985-10-26" },
  { name: "DR_BROWN", score: 19820, title: "Navigator Temporal de Elită", date: "1955-11-12" },
  { name: "WELLS_HG", score: 15400, title: "Călător de Duminică", date: "1895-05-15" },
  { name: "TIMENOVICE", score: 5800, title: "Eroare în Matricea Temporală (Novice)", date: "2026-06-19" },
];

export async function GET() {
  return NextResponse.json(globalLeaderboard);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, score, title } = body;

    if (!name || typeof score !== "number") {
      return NextResponse.json({ error: "Nume sau scor invalid" }, { status: 400 });
    }

    const newEntry: LeaderboardEntry = {
      name: name.substring(0, 12).toUpperCase().trim(),
      score,
      title: title || "Călător Temporal",
      date: new Date().toISOString().split("T")[0],
    };

    globalLeaderboard.push(newEntry);
    
    // Sortează descrescător după scor și salvează doar primele 10
    globalLeaderboard = globalLeaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({ success: true, leaderboard: globalLeaderboard });
  } catch (error) {
    return NextResponse.json({ error: "Eroare la procesarea scorului" }, { status: 500 });
  }
}
