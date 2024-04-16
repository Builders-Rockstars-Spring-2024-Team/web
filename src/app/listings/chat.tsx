"use client";

import {
  LegacyRef,
  PropsWithRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import markdown from "remark-parse";
import html from "rehype-stringify";
import remark2rehype from "remark-rehype";
import classnames from "remark-class-names";
import base64js from 'base64-js'

import {
  ChatFormState,
  onFormPostAction,
  ChatSpace as TChatSpace,
} from "./actions";
import { unified } from "unified";

const PaperAirplane = (props: any) => (
  <svg {...props} viewBox="0 -0.5 17 17">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <path
        d="M17,1.042 L11.436,14.954 L7.958,11.477 L8.653,13.563 L7.03,14.958 L7.03,11.563 L14.984,3.375 L6.047,9.969 L1,8.694 L17,1.042 Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

const classname_opts = {
  classMap: {
    paragraph: "text-gray-500 dark:text-gray-400 my-2",
    "paragraph:first-child": "mt-0",
    "paragraph:last-child": "mb-0",
    link: "font-medium text-blue-600 dark:text-blue-500 hover:underline",
    "list[ordered=true]": "ps-1",
    "list[ordered=true] > listItem": "my-4",
    "list[ordered=true] > listItem:first-child": "mt-0",
    "list[ordered=true] > listItem:last-child": "mb-0",
  },
};

const processor = unified()
  .use(markdown, { commonmark: true })
  .use(classnames, classname_opts)
  .use(remark2rehype)
  .use(html);

export function Chat() {
  const [state, setState] = useState<ChatFormState>({
    messages: [],
  });
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState<null | string>(null);
  const ref = useRef<null | HTMLLIElement>(null);
  //"I am having a birthday party. Where can I find a venue for 30 guests?",
  useEffect(
    () => ref.current?.scrollIntoView({ behavior: "auto" }),
    [ref.current]
  );

  return (
    <div className="bg-light-gray max-w-lg p-2 flex flex-col gap-2">
      <ul className="flex flex-col gap-2 text-sm max-h-128 overflow-scroll">
        {state.messages.map((msg, key, all) => (
          <ChatMessage
            key={key}
            role={msg.role}
            content={msg.content}
            spaces={msg.spaces}
            ref={key + 1 === all.length ? ref : void 0}
          />
        ))}
        {pendingMessage !== null ? (
          <>
            <ChatMessage role="user" content={pendingMessage} ref={ref} />
            <li key={"loader"}>
              <span className="p-1 text-gray">Please wait a moment...</span>
            </li>
          </>
        ) : null}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPendingMessage(message);
          setMessage("");

          onFormPostAction(state, {
            message,
          }).then((state) => {
            setState(state);
            setPendingMessage(null);
            setTimeout(
              () =>
                ref.current === document.activeElement
                  ? ref.current!.scrollIntoView({})
                  : void 0,
              100
            );
          });
        }}
        className="flex center-items justify-center gap-1"
      >
        <input
          type="text"
          disabled={message === null}
          name="message"
          className="border-gray border rounded w-full p-1"
          style={{ display: "inline-block" }}
          placeholder="What are you searching for?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={message === null}
          className="bg-blue hover:bg-blue-dark focus:bg-blue-dark rounded-full flex center-items h-6 w-6"
        >
          <PaperAirplane className="text-[white] w-6 h-6 p-1" />
        </button>
      </form>
    </div>
  );
}

const ChatMessage = forwardRef(function ChatMessage(
  {
    role,
    content,
    spaces,
  }: {
    role: "user" | "assistant";
    content: string;
    spaces?: TChatSpace[] | undefined;
  },
  ref?: LegacyRef<HTMLLIElement> | undefined
) {
  return (
    <>
      <li className="shadow border-[#333] p-1 bg-gray-light rounded" ref={ref}>
        {role === "user" ? (
          content
        ) : (
          <>
            <div
              dangerouslySetInnerHTML={{
                __html: processor.processSync(content).toString(),
              }}
            />
          </>
        )}
      </li>
      {spaces?.map((space) => <ChatSpace {...space} />) ?? null}
    </>
  );
});

function ChatSpace(space: TChatSpace) {
	return (
		<li className="flex gap-1 shadow bg-gray-light">
			<a
				href={"https://www.instabase.jp/space/" + space.space}
				style={{ display: "contents" }}
			>
				<img
					className="w-[128px] h-[128px] rounded p-1"
					src={URL.createObjectURL(
						new Blob([base64js.toByteArray(space.media.data)], {
							type: space.media.mime,
						}),
					)}
				/>
				<div className="flex flex-col p-1">
					<span className="text-base">{space.title}</span>
					<span className="text-sm text-gray-dark">{space.tagline}</span>
				</div>
			</a>
		</li>
	);
}
