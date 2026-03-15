import { pickRandom } from "../../helpers/random.js";

const EIGHT_BALL = [
  "Sim.",
  "Nao.",
  "Talvez.",
  "Sem chance.",
  "Pergunte de novo.",
  "Provavel.",
  "Improvavel.",
  "Com certeza.",
];

export default {
  name: "8ball",
  aliases: ["ask"],
  description: "Responde uma pergunta com uma resposta aleatoria.",
  usage: "!8ball <pergunta>",
  cooldown: 5000,

  async execute(ctx) {
    const question = String(ctx.rawArgs ?? "").trim();
    if (!question) {
      await ctx.reply("Uso: !8ball <pergunta>");
      return;
    }
    const answer = pickRandom(EIGHT_BALL);
    await ctx.reply(`Pergunta: ${question} | Resposta: ${answer}`);
  },
};
