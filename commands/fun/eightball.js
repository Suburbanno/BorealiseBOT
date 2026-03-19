import { pickRandom } from "../../helpers/random.js";
export default {
    name: "8ball",
    aliases: ["ask"],
    description: "Responde uma pergunta com uma resposta aleatoria.",
    usage: "!8ball <pergunta>",
    cooldown: 5000,
    async execute(ctx) {
        const { rawArgs, reply, t } = ctx;
        const question = String(rawArgs ?? "").trim();
        if (!question) {
            await reply(t("cmd.eightball.usage"));
            return;
        }
        const answers = t("cmd.eightball.answers");
        const answer = pickRandom(answers);
        await reply(t("cmd.eightball.answer", { question, answer }));
    },
};
