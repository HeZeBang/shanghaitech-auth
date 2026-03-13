"use server";

import { hydraAdmin } from "@/lib/hydra";
import { redirect } from "next/navigation";

export async function submitLogin(formData: FormData) {
  const challenge = formData.get("challenge") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";

  if (!challenge) {
    throw new Error("Missing login challenge");
  }

  // Call the internal Next.js API route to authenticate
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Authentication failed");
    }

    const subject = data.subject;

    // If validation succeeds, accept the login request
    const hydraResponse = await hydraAdmin.acceptOAuth2LoginRequest({
      loginChallenge: challenge,
      acceptOAuth2LoginRequest: {
        subject: subject,
        remember: remember,
        remember_for: 3600,
      },
    });

    if (hydraResponse.data.redirect_to) {
      redirect(hydraResponse.data.redirect_to);
    }
  } catch (error) {
    console.error("Failed to accept login request:", error);
    throw error;
  }
}
