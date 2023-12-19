import {sendShopEmbed} from "./Shop/sendShopEmbed.js";
import {checkUserInDatabaseItems} from "./Handlers/DatabaseHandlers.js";

export const shop = async (interaction, client) => {
    await checkUserInDatabaseItems(interaction.user.id);
    await sendShopEmbed(interaction, client)
};