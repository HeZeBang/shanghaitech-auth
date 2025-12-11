"use server";

import { hydraAdmin } from "@/lib/hydra";
import { redirect } from "next/navigation";

export async function submitConsent(formData: FormData) {
  const challenge = formData.get("challenge") as string;
  const grantScope = formData.getAll("grant_scope") as string[];
  const remember = formData.get("remember") === "on";

  if (!challenge) {
    throw new Error("Missing consent challenge");
  }

  // In a real app, you would fetch user info based on the subject from the consent request
  // For now, we'll mock it.
  // We need to fetch the consent request again to get the subject if we don't pass it in the form
  // But usually the consent page has already fetched it.
  
  // Let's fetch the request to be sure about the subject
  const { data: consentRequest } = await hydraAdmin.getOAuth2ConsentRequest({
    consentChallenge: challenge,
  });

  const subject = consentRequest.subject;

  // Mock user info fetching
  const userInfo = {
    email: "user@example.com",
    name: "Zhang San",
    picture: "https://github.com/shadcn.png",
  };

  try {
    const response = await hydraAdmin.acceptOAuth2ConsentRequest({
      consentChallenge: challenge,
      acceptOAuth2ConsentRequest: {
        grant_scope: grantScope,
        grant_access_token_audience: consentRequest.requested_access_token_audience,
        remember: remember,
        remember_for: 3600,
        session: {
          id_token: {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            // Add other claims as needed
          },
          access_token: {
             // Add extra claims to access token if needed
             role: "user",
          }
        },
      },
    });

    if (response.data.redirect_to) {
      redirect(response.data.redirect_to);
    }
  } catch (error) {
    console.error("Failed to accept consent request:", error);
    throw error;
  }
}
