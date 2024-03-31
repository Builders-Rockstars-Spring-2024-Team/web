import { OpenAI } from "openai";
import { ChatCompletionAssistantMessageParam } from "openai/resources/index.mjs";

export type CompletionResult =
    | { type: "error" }
    | { type: "success"; message: string; spaces: string[] };
type Message = { content: string; role: "user" | "assistant" };
export const createCompletions = async (
    messages: readonly Readonly<Message>[]
): Promise<CompletionResult> => {
    const openai = new OpenAI({
        apiKey: "NOT_NEEDED",
        baseURL: "http://chatbot-test.rebase-project.beta.xpressai.cloud",
    });
    try {
        const response = await openai.chat.completions.create({
            model: "Your Room Finder",
            messages: messages.map(
                (msg: Message): ChatCompletionAssistantMessageParam =>
                    ({
                        role: msg.role,
                        content: msg.content,
                    }) as ChatCompletionAssistantMessageParam
            ),
        });

        const message = response.choices?.[0]?.message?.content;
        if (message === null || message === undefined) {
            return { type: "error" };
        }

        const spaces: string[] = [];
        let match;
        const re = /\(https:\/\/www\.instabase\.jp\/space\/(\d+)\)/g;
        while (null !== (match = re.exec(message))) {
            const [, space] = match;
            if (!spaces.includes(space)) {
                spaces.push(space);
            }
        }

        return {
            type: "success",
            message,
            spaces,
        };
    } catch (e) {
        console.error(e);
        return { type: "error" };
    }
};
