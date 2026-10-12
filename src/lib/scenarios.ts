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
    id: "aditi",
    name: "Aditi",
    age: 23,
    place: "Bengaluru",
    situation: "Grew up in Delhi, now a product analyst. The final clashes with her team's offsite dinner, so she sneaks looks at her phone under the table.",
    need: "The story in 20 seconds whenever she checks back in, in the Hinglish she texts in.",
    features: ["What did I miss? recaps", "Hinglish", "Notices when she's away"],
    profile: { team: "India", favourite: "Kohli", language: "hinglish", level: "casual" },
    joinAt: endOfOver(1, 10),
    joinText: "South Africa's chase, after 10 overs",
  },
  {
    id: "ritwik",
    name: "Ritwik",
    age: 22,
    place: "Kolkata",
    situation: "Final-year engineering student at Jadavpur, pulling an all-nighter on his project. He allows himself two-minute breaks, never a whole over.",
    need: "The numbers that matter, fast, and no spoilers when he looks away.",
    features: ["Die-hard mode", "Turning points", "Spoiler-safe AI"],
    profile: { team: "India", favourite: "Bumrah", language: "en", level: "diehard" },
    joinAt: endOfOver(1, 12),
    joinText: "South Africa's chase, after 12 overs",
  },
  {
    id: "sreeja",
    name: "Sreeja",
    age: 21,
    place: "Kolkata",
    situation: "A Mohun Bagan supporter who barely follows cricket. Her friends dragged her to a watch party at a Park Street café.",
    need: "To understand what's happening and why it matters, without the jargon.",
    features: ["New-to-cricket mode", "Ask the match", "Win chance in plain numbers"],
    profile: { team: "India", favourite: null, language: "en", level: "new" },
    joinAt: endOfOver(0, 20),
    joinText: "the innings break",
  },
  {
    id: "tapas",
    name: "Tapas",
    age: 54,
    place: "Kolkata",
    situation: "A friend's dad who has followed India since the 1983 World Cup. Tonight he's stuck at a wedding reception, without his reading glasses.",
    need: "Updates in Bengali that he can listen to, with the cricket detail he loves.",
    features: ["Bengali recaps", "Read aloud", "Die-hard detail"],
    profile: { team: "India", favourite: "Rohit", language: "bn", level: "diehard" },
    joinAt: endOfOver(1, 15),
    joinText: "South Africa's chase, after 15 overs",
  },
  {
    id: "raghavan",
    name: "Raghavan",
    age: 57,
    place: "Chennai",
    situation: "Another friend's dad and a lifelong CSK fan. Temple festival duties in Mylapore keep him away from the TV all evening.",
    need: "Tamil updates he can listen to between duties.",
    features: ["Tamil recaps", "Read aloud", "Notices when he's away"],
    profile: { team: "India", favourite: "Jadeja", language: "ta", level: "casual" },
    joinAt: endOfOver(1, 18),
    joinText: "South Africa's chase, after 18 overs",
  },
];

export const initials = (s: Scenario) => s.name.slice(0, 1).toUpperCase();
