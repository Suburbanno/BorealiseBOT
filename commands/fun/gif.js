import { fetchTenorGif } from "../../helpers/tenor.js";

export default {
  name: "gif",
  aliases: ["giphy"],
  description: "Envia um GIF aleatorio (com termo opcional).",
  usage: "!gif [termo]",
  cooldown: 5000,

  async execute(ctx) {
    const query = String(ctx.rawArgs ?? "").trim();
    try {
      const url = await fetchTenorGif(query);
      if (!url) {
        await ctx.reply("Nenhum GIF encontrado.");
        return;
      }
      await ctx.reply(`${url}`);
    } catch (err) {
      await ctx.reply(`Erro ao buscar GIF: ${err.message}`);
    }
  },
};
