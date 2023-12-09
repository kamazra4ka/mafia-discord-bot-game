import {
    config
} from 'dotenv';
import OpenAI from 'openai';

await config();
const openaiApiKey = process.env.OPENAI_API_KEY;


const openai = new OpenAI({
    apiKey: openaiApiKey,
});

export const generateVoiceLine = async (topic) => {
    const systemMessage = {
        role: "system",
        content: "Hello. Your task is to generate a voice line for a discord bot with Mafia styled (Werewolf) game. Respond ONLY with the voice line (text), without anything else. Your limit: 2 sentences (190 characters) and please mention the word Mafia in it. Topic: " + topic + "."
    };

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [systemMessage],
        });

        console.log(chatCompletion);
        console.log(chatCompletion.choices[0].message.content);
        return chatCompletion.choices[0].message.content.toString();
    } catch (error) {
        console.error("Error in API request:", error);
    }
};