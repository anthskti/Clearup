import { createAuthClient } from "better-auth/react";
import { captureSessionRetryAt } from "@/lib/auth-retry";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    onResponse: ({ request, response }) => captureSessionRetryAt(request.url, response),
  },
});
