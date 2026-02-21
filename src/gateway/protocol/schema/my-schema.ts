import { Type } from "@sinclair/typebox";

export const MyMethodParametersSchema = Type.Object({
  param1: Type.String(),
  param2: Type.Optional(Type.Number()),
});

export const MyResponseSchema = Type.Object({
  result: Type.String(),
  timestamp: Type.Number(),
});
