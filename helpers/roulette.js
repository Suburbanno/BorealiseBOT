import { pickRandom } from "./random.js";
import { getWaitlist } from "./waitlist.js";

export const ROULETTE_DURATION_MS = 60_000;
export const rouletteState = {
  open: false,
  participants: new Map(),
  timeoutId: null,
};

export async function closeRoulette(bot, api) {
  if (!rouletteState.open) return;
  rouletteState.open = false;
  if (rouletteState.timeoutId) clearTimeout(rouletteState.timeoutId);
  rouletteState.timeoutId = null;

  const entries = [...rouletteState.participants.entries()];
  rouletteState.participants.clear();

  if (!bot) return;
  if (entries.length === 0) {
    await bot.sendChat("Roulette encerrada: sem participantes.");
    return;
  }

  if (!api) {
    await bot.sendChat("Roulette encerrada: API indisponivel.");
    return;
  }

  let waitlist = [];
  try {
    waitlist = await getWaitlist(api, bot.cfg.room);
  } catch (err) {
    await bot.sendChat(
      `Roulette encerrada: erro ao ler a fila (${err.message}).`,
    );
    return;
  }

  if (!waitlist.length) {
    await bot.sendChat("Roulette encerrada: fila vazia.");
    return;
  }

  const waitlistIds = new Set(
    waitlist
      .map((u) => String(u.id ?? u.userId ?? u.user_id ?? ""))
      .filter(Boolean),
  );
  const eligible = entries.filter(([id]) => waitlistIds.has(String(id)));

  if (!eligible.length) {
    await bot.sendChat("Roulette encerrada: nenhum participante na fila.");
    return;
  }

  const [winnerId, winnerName] = pickRandom(eligible) ?? [];
  if (!winnerId) {
    await bot.sendChat("Roulette encerrada: sem vencedor valido.");
    return;
  }

  const pos = Math.floor(Math.random() * waitlist.length) + 1;
  const apiPos = pos - 1;

  await bot.sendChat(
    `Roulette encerrada. Vencedor: ${winnerName}. Movendo para a posicao ${pos}.`,
  );

  setTimeout(() => {
    void (async () => {
      try {
        await api.room.moveInWaitlist(bot.cfg.room, Number(winnerId), apiPos);
      } catch (err) {
        await bot.sendChat(
          `Falha ao mover ${winnerName}: ${err.message ?? "erro desconhecido"}.`,
        );
      }
    })();
  }, 1000);
}
