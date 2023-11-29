import {sendShopEmbed} from "./Shop/sendShopEmbed.js";

export const shop = async (interaction, client) => {
    await sendShopEmbed(interaction, client)
};