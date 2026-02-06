// import type { Context, SimpleStreamOptions, AssistantMessage } from "@mariozechner/pi-ai";
// import { AssistantMessageEventStream } from "@mariozechner/pi-ai/dist/utils/event-stream.js";
// import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
// import type { AIMessageChunk } from "@langchain/core/messages";
// import { getAzureOpenAIModelInstance } from "./azure-openai-runtime.js";

// /**
//  * Converts Pi tool definitions to LangChain tool format
//  * LangChain's bindTools expects tools in OpenAI function calling format
//  */
// function convertPiToolsToLangChain(tools: any[]): any[] {
//   if (!tools || tools.length === 0) return [];

//   return tools.map((tool) => ({
//     type: "function" as const,
//     function: {
//       name: tool.name,
//       description: tool.description || "",
//       parameters: tool.input_schema || tool.parameters || {},
//     },
//   }));
// }

// /**
//  * Custom stream adapter for Azure OpenAI with Managed Identity.
//  * Converts Pi library Context to LangChain format and streams responses.
//  * NOW WITH TOOL SUPPORT!
//  */
// export function streamAzureOpenAIManagedIdentity(
//   context: Context,
//   options?: SimpleStreamOptions,
// ): AssistantMessageEventStream {
//   const eventStream = new AssistantMessageEventStream();

//   // Start the streaming process asynchronously
//   (async () => {
//     try {
//       // Get our configured Azure OpenAI client
//       const model = await getAzureOpenAIModelInstance();

//       // Convert Pi context to LangChain messages
//       const messages = [];

//       // Add system prompt if present
//       if (context.systemPrompt) {
//         messages.push(new SystemMessage(context.systemPrompt));
//       }

//       // Convert context messages
//       for (const msg of context.messages) {
//         if (msg.role === "user") {
//           if (typeof msg.content === "string") {
//             messages.push(new HumanMessage(msg.content));
//           } else {
//             // Handle image content
//             const textParts = msg.content.filter((c) => c.type === "text");
//             const text = textParts.map((c) => (c.type === "text" ? c.text : "")).join("\n");
//             messages.push(new HumanMessage(text));
//           }
//         } else if (msg.role === "assistant") {
//           const textContent = msg.content
//             .filter((c) => c.type === "text")
//             .map((c) => (c.type === "text" ? c.text : ""))
//             .join("\n");

//           // Check if this assistant message has tool calls
//           const toolCalls = msg.content
//             .filter((c) => c.type === "toolCall")
//             .map((c) => ({
//               id: c.id,
//               name: c.name,
//               args: typeof c.arguments === "string" ? JSON.parse(c.arguments) : c.arguments,
//               type: "tool_call" as const,
//             }));

//           messages.push(
//             new AIMessage({
//               content: textContent,
//               tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
//             }),
//           );
//         } else if (msg.role === "toolResult") {
//           const textContent = msg.content
//             .filter((c) => c.type === "text")
//             .map((c) => (c.type === "text" ? c.text : ""))
//             .join("\n");
//           messages.push(
//             new ToolMessage({
//               content: textContent,
//               tool_call_id: msg.toolCallId,
//             }),
//           );
//         }
//       }

//       // Configure model with options
//       if (options?.temperature !== undefined) {
//         model.temperature = options.temperature;
//       }
//       if (options?.maxTokens !== undefined) {
//         model.maxTokens = options.maxTokens;
//       }

//       // Bind tools to the model if present in context
//       let stream;
//       if (context.tools && context.tools.length > 0) {
//         const langchainTools = convertPiToolsToLangChain(context.tools);
//         console.log(
//           `[Azure OpenAI Stream Adapter] Binding ${langchainTools.length} tools to model`,
//         );
//         console.log(
//           "[Azure OpenAI Stream Adapter] Tool names:",
//           langchainTools.map((t) => t.function.name),
//         );
//         console.log(
//           "[Azure OpenAI Stream Adapter] Full tool definitions:",
//           JSON.stringify(langchainTools, null, 2),
//         );

//         // WORKAROUND: Pass tools directly in stream options instead of bindTools
//         // bindTools doesn't properly configure function calling for Azure OpenAI
//         stream = await model.stream(messages, {
//           tools: langchainTools,
//           tool_choice: "auto" as any,
//         });
//       } else {
//         stream = await model.stream(messages);
//       }

//       // Convert LangChain stream to Pi AssistantMessageEventStream format
//       let accumulatedText = "";
//       let contentIndex = 0;
//       const toolCalls: any[] = [];

//       // Emit start event
//       eventStream.push({
//         type: "start" as const,
//         partial: {
//           role: "assistant" as const,
//           content: [],
//           api: "openai-completions" as const,
//           provider: "azureopenai",
//           model: "gpt-5.2",
//           usage: {
//             input: 0,
//             output: 0,
//             cacheRead: 0,
//             cacheWrite: 0,
//             totalTokens: 0,
//             cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//           },
//           stopReason: "stop" as const,
//           timestamp: Date.now(),
//         },
//       });

//       // Stream the content
//       for await (const chunk of stream) {
//         const aiChunk = chunk as AIMessageChunk;

//         // DEBUG: Log raw chunk to diagnose tool parameter issue
//         if (aiChunk.tool_calls && aiChunk.tool_calls.length > 0) {
//           console.log(
//             "[Azure OpenAI Stream Adapter] RAW aiChunk with tool_calls:",
//             JSON.stringify(
//               {
//                 content: aiChunk.content,
//                 tool_calls: aiChunk.tool_calls,
//                 additional_kwargs: aiChunk.additional_kwargs,
//                 response_metadata: aiChunk.response_metadata,
//               },
//               null,
//               2,
//             ),
//           );
//         }

//         // Handle text content
//         if (aiChunk.content && typeof aiChunk.content === "string") {
//           const delta = aiChunk.content;

//           // Emit text_start event on first text chunk
//           if (accumulatedText === "") {
//             eventStream.push({
//               type: "text_start" as const,
//               contentIndex,
//               partial: {
//                 role: "assistant" as const,
//                 content: [{ type: "text" as const, text: "" }],
//                 api: "openai-completions" as const,
//                 provider: "azureopenai",
//                 model: "gpt-5.2",
//                 usage: {
//                   input: 0,
//                   output: 0,
//                   cacheRead: 0,
//                   cacheWrite: 0,
//                   totalTokens: 0,
//                   cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//                 },
//                 stopReason: "stop" as const,
//                 timestamp: Date.now(),
//               },
//             });
//           }

//           if (delta) {
//             accumulatedText += delta;
//             eventStream.push({
//               type: "text_delta" as const,
//               contentIndex,
//               delta,
//               partial: {
//                 role: "assistant" as const,
//                 content: [{ type: "text" as const, text: accumulatedText }],
//                 api: "openai-completions" as const,
//                 provider: "azureopenai",
//                 model: "gpt-5.2",
//                 usage: {
//                   input: 0,
//                   output: 0,
//                   cacheRead: 0,
//                   cacheWrite: 0,
//                   totalTokens: 0,
//                   cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//                 },
//                 stopReason: "stop" as const,
//                 timestamp: Date.now(),
//               },
//             });
//           }
//         }

//         // Handle tool calls
//         if (aiChunk.tool_calls && aiChunk.tool_calls.length > 0) {
//           for (const toolCall of aiChunk.tool_calls) {
//             const toolCallIndex = toolCalls.length;

//             console.log(
//               "[Azure OpenAI Stream Adapter] Tool call detected:",
//               JSON.stringify(toolCall, null, 2),
//             );

//             // Create tool call content item
//             const toolCallContent = {
//               type: "toolCall" as const,
//               id: toolCall.id || `tool_${toolCallIndex}`,
//               name: toolCall.name,
//               arguments: JSON.stringify(toolCall.args || {}) || {},
//             };

//             console.log(
//               "[Azure OpenAI Stream Adapter] Converted to toolCallContent:",
//               JSON.stringify(toolCallContent, null, 2),
//             );

//             toolCalls.push(toolCallContent);

//             // Emit toolcall_start event
//             eventStream.push({
//               type: "toolcall_start" as const,
//               contentIndex: toolCallIndex + (accumulatedText ? 1 : 0),
//               partial: {
//                 role: "assistant" as const,
//                 content: accumulatedText
//                   ? [{ type: "text" as const, text: accumulatedText }, toolCallContent]
//                   : [toolCallContent],
//                 api: "openai-completions" as const,
//                 provider: "azureopenai",
//                 model: "gpt-5.2",
//                 usage: {
//                   input: 0,
//                   output: 0,
//                   cacheRead: 0,
//                   cacheWrite: 0,
//                   totalTokens: 0,
//                   cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//                 },
//                 stopReason: "toolUse" as const,
//                 timestamp: Date.now(),
//               },
//             });

//             // Emit toolcall_end event
//             eventStream.push({
//               type: "toolcall_end" as const,
//               contentIndex: toolCallIndex + (accumulatedText ? 1 : 0),
//               toolCall: toolCallContent,
//               partial: {
//                 role: "assistant" as const,
//                 content: accumulatedText
//                   ? [{ type: "text" as const, text: accumulatedText }, toolCallContent]
//                   : [toolCallContent],
//                 api: "openai-completions" as const,
//                 provider: "azureopenai",
//                 model: "gpt-5.2",
//                 usage: {
//                   input: 0,
//                   output: 0,
//                   cacheRead: 0,
//                   cacheWrite: 0,
//                   totalTokens: 0,
//                   cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//                 },
//                 stopReason: "toolUse" as const,
//                 timestamp: Date.now(),
//               },
//             });
//           }
//         }
//       }

//       // Emit text_end event if there was any text
//       if (accumulatedText) {
//         eventStream.push({
//           type: "text_end" as const,
//           contentIndex: 0,
//           content: accumulatedText,
//           partial: {
//             role: "assistant" as const,
//             content: [{ type: "text" as const, text: accumulatedText }, ...toolCalls],
//             api: "openai-completions" as const,
//             provider: "azureopenai",
//             model: "gpt-5.2",
//             usage: {
//               input: 0,
//               output: 0,
//               cacheRead: 0,
//               cacheWrite: 0,
//               totalTokens: 0,
//               cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//             },
//             stopReason: toolCalls.length > 0 ? ("toolUse" as const) : ("stop" as const),
//             timestamp: Date.now(),
//           },
//         });
//       }

//       // Build final content array
//       const finalContent = [];
//       if (accumulatedText) {
//         finalContent.push({ type: "text" as const, text: accumulatedText });
//       }
//       finalContent.push(...toolCalls);

//       // Create final message
//       const finalMessage: AssistantMessage = {
//         role: "assistant" as const,
//         content: finalContent,
//         api: "openai-completions" as const,
//         provider: "azureopenai",
//         model: "gpt-5.2",
//         usage: {
//           input: 0,
//           output: 0,
//           cacheRead: 0,
//           cacheWrite: 0,
//           totalTokens: 0,
//           cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//         },
//         stopReason: toolCalls.length > 0 ? ("toolUse" as const) : ("stop" as const),
//         timestamp: Date.now(),
//       };

//       // Emit done event
//       eventStream.push({
//         type: "done" as const,
//         reason: toolCalls.length > 0 ? ("toolUse" as const) : ("stop" as const),
//         message: finalMessage,
//       });

//       // End the stream with the final message
//       eventStream.end(finalMessage);
//     } catch (error) {
//       console.error(
//         "[Azure OpenAI Stream Adapter] Error: - azure-openai-stream-adapter.ts:375",
//         error,
//       );
//       // On error, end the stream with a default error message
//       const errorMessage: AssistantMessage = {
//         role: "assistant" as const,
//         content: [
//           {
//             type: "text" as const,
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`,
//           },
//         ],
//         api: "openai-completions" as const,
//         provider: "azureopenai",
//         model: "gpt-5.2",
//         usage: {
//           input: 0,
//           output: 0,
//           cacheRead: 0,
//           cacheWrite: 0,
//           totalTokens: 0,
//           cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
//         },
//         stopReason: "error" as const,
//         errorMessage: error instanceof Error ? error.message : String(error),
//         timestamp: Date.now(),
//       };
//       eventStream.end(errorMessage);
//     }
//   })();

//   return eventStream;
// }
