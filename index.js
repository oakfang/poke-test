import { LiveChat } from "youtube-chat";
import { chromium } from "playwright";
import { setTimeout } from "node:timers/promises";
import pokemon from "./pokemon.json" assert { type: "json" };

const QUIZ_URL = "https://pkmnquiz.com/";
const CHAT_ID = "9TMslV0kvcM";
const POKEMON_SET = new Set(pokemon.map((p) => p.toLowerCase()));

const liveChat = new LiveChat({ liveId: CHAT_ID });
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto(QUIZ_URL);
await setTimeout(3000);
await page.click("#gen0");
const pokemonInput = page.locator("#pokemon");

// Emit at receive chat.
// chat: ChatItem
liveChat.on("chat", async ({ message }) => {
  const text = message
    .map((m) => m.text)
    .filter(Boolean)
    .join(" ");
  if (!text) return;
  const pokemonInMessage = text.toLowerCase()
    .split(/\s+/)
    .map((word, idx, words) =>
      POKEMON_SET.has(word)
        ? word
        : POKEMON_SET.has(word + " " + words[idx + 1])
        ? word + " " + words[idx + 1]
        : null
    )
    .filter(Boolean);
  for (let name of pokemonInMessage) {
    await pokemonInput.fill(name);
    await pokemonInput.press("Enter");
  }
});

// Emit when an error occurs
// err: Error or any
liveChat.on("error", (err) => {
  console.error(err);
  liveChat.stop();
});

const ok = await liveChat.start();
if (!ok) {
  console.log("Failed to start, check emitted error");
}
