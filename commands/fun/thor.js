import { pickRandom } from "../../helpers/random.js";

const THOR_LINES = [
  "Thor diz ola.",
  "O martelo esta pronto.",
  "Trovoes a caminho.",
];

export default {
  name: "thor",
  description: "Resposta divertida do Thor.",
  usage: "!thor",
  cooldown: 10_000,

  async execute(ctx) {
    await ctx.reply(pickRandom(THOR_LINES));
  },
};
