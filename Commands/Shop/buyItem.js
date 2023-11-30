import {addItemToUser, takeCoinsFromDatabase} from "../Handlers/DatabaseHandlers.js";
import {editShopEmbed} from "./sendShopEmbed.js";

export const buyItem = async (interaction, item) => {

    await takeCoinsFromDatabase(interaction.user.id, item);
    await addItemToUser(interaction.user.id, item);

        let itemName;
        // switch case to add emojis
        switch (item) {
            case 'activerole':
                itemName = '💎 Active role';
                break;
            case 'fakedocuments':
                itemName = '🔎 Fake documents';
                break;
            case 'knife':
                itemName = '🔪 Knife';
                break;
            default:
                itemName = 'Error';
        }
        await interaction.reply({ content: `You bought **${itemName}**!`, ephemeral: true });

        setTimeout(async () => {
            await interaction.deleteReply();
        }, 2500);
}