"use server";

import { createCompletions } from "@/openai";
import base64js from "base64-js";

export type Listing = {
	id: string;
};

export type Result<T> = { items: T[]; count: number };
export async function getListings(
	page: number,
	limit: number
): Promise<Result<Listing[]>> {
	const res = await fetch(
		"https://bws24-br.beta-api.morphdb.io/v0/data-api/record/query",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": "JrpZ62pkD6t7H4YOObgKgNXfPSmocC7F1A5YIGW7",
			},
			body: JSON.stringify({
				select: ["id", "desc", "tagline", "title", "url"],
				limit: limit,
				skip: page * limit,
			}),
		}
	);
	return res.json();
}
export type ChatFormState = {
	messages: {
		content: string;
		role: "user" | "assistant";
		spaces?: ChatSpace[];
	}[];
};
export type ChatFormPayload = {
	message: string;
};
export async function onFormPostAction(
	state: ChatFormState,
	payload: ChatFormPayload
): Promise<ChatFormState> {
	const messages = state.messages.slice();
	messages.push({ role: "user", content: payload.message });
	const result = await createCompletions(messages);
	const spaces = await Promise.all(
		result.type === "success" ? result.spaces.map(getImage) : []
	);
	messages.push({
		role: "assistant",
		content: result.type === "error" ? "Failed. Sorry." : result.message!,
		spaces: spaces.flatMap((res) =>
			res.type === "success" ? [res.result] : []
		),
	});

	return {
		...state,
		messages,
	};
}

export type ChatSpace = {
	space: string;
	image: { mime: string; data: string };
	title: string;
	tagline: string;
};

type ImageResponse = { type: "error" } | { type: "success"; result: ChatSpace };

async function getImage(space: string): Promise<ImageResponse> {
	const spaceResponse = await fetch(
		"https://www.instabase.jp/space/" + space
	);
	const spaceHtml = await spaceResponse.text();
	const spaceImageMatch =
		/<meta content='([^\n]+)' property='og:image'>/.exec(spaceHtml);
	const spaceTitleMatch =
		/<meta content='([^\n]+)' property='og:title'>/.exec(spaceHtml);
	const spaceTaglineMatch =
		/<meta content='([^\n]+)' property='og:description'>/.exec(spaceHtml);
	// console.log({spaceImageMatch, spaceTitleMatch,spaceTaglineMatch})
	if (
		spaceImageMatch === null ||
		spaceTitleMatch === null ||
		spaceTaglineMatch === null
	) {
		return {
			type: "error",
		};
	}
	const spaceImageResponse = await fetch(spaceImageMatch[1]);
	// TODO: Process image
	const img = await spaceImageResponse.blob();
	return {
		type: "success",
		result: {
			space,
			image: {
				mime: img.type,
				data: base64js.fromByteArray(
					new Uint8Array(await img.arrayBuffer())
				),
			},
			title: spaceTitleMatch[1],
			tagline: spaceTaglineMatch[1],
		},
	};
}
