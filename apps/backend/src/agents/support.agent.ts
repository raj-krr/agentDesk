import { streamText } from "ai";

import { groq } from "../lib/groq.js";

export const supportAgent = async (
  message: string
): Promise<Response> => {

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a Technical Support AI Agent.

Responsibilities:
- login issues
- password reset
- troubleshooting
- technical problems
- account support

Respond naturally and professionally.

User Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};