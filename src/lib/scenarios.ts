// Illustrative fan scenarios (hypothetical people) that show who the app is for and
// which feature meets which need. Each one is also a one-tap demo preset.

import { endOfOver } from "./match";
import type { Profile } from "./profile";

export type Scenario = {
  id: string;
  name: string;
  age: number;
  place: string;
  situation: string;
  need: string;
  features: string[];
  profile: Profile;
  joinAt: number;
  joinText: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "priya",
    name: "Priya",
    age: 28,
    place: "Bengaluru",
    situation: "The final clashes with her cousin's sangeet. She sneaks looks at her phone between dances.",
    need: "The story in 20 seconds whenever she checks back in, in the Hinglish she texts in.",
    features: ["What did I miss? recaps", "Hinglish", "Notices when she's away"],
    profile: { team: "India", favourite: "Kohli", language: "hinglish", level: "casual" },
    joinAt: endOfOver(1, 10),
    joinText: "South Africa's chase, after 10 overs",
  },
  {
    id: "subrata",
    name: "Subrata",
    age: 71,
    place: "Kolkata",
    situation: "Has followed India since 1983. The grandkids have the TV, and small English text is hard on his eyes.",
    need: "Updates in Bengali that he can listen to, with the real cricket detail he loves.",
    features: ["Bengali recaps", "Read aloud", "Die-hard detail"],
    profile: { team: "India", favourite: "Bumrah", language: "bn", level: "diehard" },
    joinAt: endOfOver(1, 15),
    joinText: "South Africa's chase, after 15 overs",
  },
  {
    id: "sam",
    name: "Sam",
    age: 31,
    place: "London",
    situation: "New to cricket. Her South African flatmate talked her into following the final.",
    need: "To understand what's happening and why it matters, without the jargon.",
    features: ["New-to-cricket mode", "Ask the match", "Win chance in plain numbers"],
    profile: { team: "South Africa", favourite: null, language: "en", level: "new" },
    joinAt: endOfOver(0, 20),
    joinText: "the innings break",
  },
  {
    id: "thabo",
    name: "Thabo",
    age: 35,
    place: "Johannesburg",
    situation: "Proteas die-hard working a hospital shift. He gets two-minute breaks, never a whole over.",
    need: "The numbers that matter, fast, and no spoilers when he looks away.",
    features: ["Die-hard mode", "Turning points", "Spoiler-safe AI"],
    profile: { team: "South Africa", favourite: "Klaasen", language: "en", level: "diehard" },
    joinAt: endOfOver(1, 12),
    joinText: "South Africa's chase, after 12 overs",
  },
];

export const initials = (s: Scenario) => s.name.slice(0, 1).toUpperCase();
