import { QuizResults, User, MatchResult } from "@/types";

export function calculateCompatibility(
  myPrefs: QuizResults | undefined | null,
  theirPrefs: QuizResults | undefined | null,
): { score: number; matchingTraits: string[] } {
  let score = 0;
  const matchingTraits: string[] = [];

  if (!myPrefs?.personalityType || !theirPrefs?.personalityType) {
    return { score: 0, matchingTraits: [] };
  }

  // 1. Personality Match (max 60 points)
  let personalityScore = 0;
  const myType = myPrefs.personalityType as string;
  const theirType = theirPrefs.personalityType as string;
  
  for (let i = 0; i < 4; i++) {
    if (myType[i] && theirType[i] && myType[i] === theirType[i]) {
      personalityScore += 15; // 15 points per matching character
      matchingTraits.push(`Cùng tính cách ${myType[i]}`);
    }
  }
  score += personalityScore;

  // 2. Lifestyle Match (max 40 points)
  let lifestyleScore = 0;
  const myTags = (myPrefs.lifestyleTags || []) as string[];
  const theirTags = (theirPrefs.lifestyleTags || []) as string[];

  if (myTags.length > 0 && theirTags.length > 0) {
    const sharedTags = myTags.filter(tag => theirTags.includes(tag));
    lifestyleScore = Math.round((sharedTags.length / myTags.length) * 40);
    score += lifestyleScore;
    // Add some shared tags to matchingTraits
    sharedTags.slice(0, 3).forEach(tag => matchingTraits.push(tag));
  }

  return { 
    score, 
    matchingTraits: Array.from(new Set(matchingTraits)).slice(0, 4) 
  };
}

export function findMatches(
  userPrefs: QuizResults | undefined | null,
  users: User[],
  currentUserId?: string,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const user of users) {
    if (user.id === currentUserId) continue;
    // Ensure preferences object exists
    if (!user.preferences) continue;

    const { score, matchingTraits } = calculateCompatibility(
      userPrefs,
      user.preferences,
    );
    results.push({ user, score, matchingTraits });
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function getMatchLevel(
  score: number,
): "high" | "good" | "average" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "low";
}
