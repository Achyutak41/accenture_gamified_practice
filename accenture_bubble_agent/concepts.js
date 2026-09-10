/*
  Replace your old gamified concept list with this list.

  IMPORTANT:
  Remove the old registrations for:
    patternRecognition
    sequential
    reasoning
    memory
    agent

  Keep only bubbleAgent for this requested change.
*/

export const GAMIFIED_CONCEPTS = [
  {
    id: "bubble-agent",
    name: "Bubble Agent",
    description: "Clickable bubble comparison and numerical-selection games.",
    route: "/practice/bubble-agent",
    questionLimit: null,
    minimumQuestions: 50,
    durationMinutes: 15,
    free: true
  }
];
