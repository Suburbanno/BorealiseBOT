import { createAuthCalls } from "./auth.js";
import { createUserCalls } from "./user.js";
import { createRoomCalls } from "./room.js";
import { createChatCalls } from "./chat.js";
import { createPlaylistCalls } from "./playlist.js";
import { createSourceCalls } from "./source.js";
import { createShopCalls } from "./shop.js";
import { createSubscriptionCalls } from "./subscription.js";
import { createFriendCalls } from "./friend.js";
import { createAdminCalls } from "./admin.js";

export function createApiCalls(api) {
  return {
    auth: createAuthCalls(api),
    user: createUserCalls(api),
    room: createRoomCalls(api),
    chat: createChatCalls(api),
    playlist: createPlaylistCalls(api),
    source: createSourceCalls(api),
    shop: createShopCalls(api),
    subscription: createSubscriptionCalls(api),
    friend: createFriendCalls(api),
    admin: createAdminCalls(api),
  };
}

export {
  createAuthCalls,
  createUserCalls,
  createRoomCalls,
  createChatCalls,
  createPlaylistCalls,
  createSourceCalls,
  createShopCalls,
  createSubscriptionCalls,
  createFriendCalls,
  createAdminCalls,
};
