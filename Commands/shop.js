import {sendShopEmbed} from "./Shop/sendShopEmbed.js";
import {checkUserInDatabaseItems} from "./Handlers/DatabaseHandlers.js";

export const shop = async (interaction, client) => {

    console.log(interaction.user.id)

    await checkUserInDatabaseItems(interaction.user.id);
    await sendShopEmbed(interaction, client)
};