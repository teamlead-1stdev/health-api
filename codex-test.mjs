import { Codex } from "@openai/codex-sdk";

const codex = new Codex();
const thread = codex.startThread();

const result = await thread.run("Ответь одним словом: OK");
console.log(result);
