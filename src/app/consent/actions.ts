"use server";

import { hydraAdmin } from "@/lib/hydra";
import { redirect } from "next/navigation";

export async function submitConsent(formData: FormData) {
  const challenge = formData.get("challenge") as string;
  const grantScope = formData.getAll("grant_scope") as string[];
  const remember = formData.get("remember") === "on";
  const email = formData.get("email") as string;

  if (!challenge) {
    throw new Error("Missing consent challenge");
  }

  if (email && !/^.+@(alumni\.|)shanghaitech\.edu\.cn$/.test(email)) {
    throw new Error("Email must end with @shanghaitech.edu.cn or @alumni.shanghaitech.edu.cn");
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

  // Fetch real user info from the internal API (always use localhost)
  const baseUrl = "http://localhost:3000";

  let userInfo;
  try {
    const response = await fetch(`${baseUrl}/api/auth/userinfo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Failed to fetch user info:", data.error);
      userInfo = {
        sid: subject,
        name: subject,
        email: email || "",
      };
    } else {
      userInfo = data.user_info;
      // Use form email if API didn't return one, or user manually entered one
      if (!userInfo.email && email) {
        userInfo.email = email;
      }
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    userInfo = {
      sid: subject,
      name: subject,
      email: email || "",
    };
  }

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
            sid: userInfo.sid,
            name: userInfo.name,
            email: userInfo.email,
          },
          access_token: {
             sid: userInfo.sid,
             email: userInfo.email,
          }
        },
      },
    });

    if (response.data.redirect_to) {
      redirect(response.data.redirect_to);
    }
  } catch (error: any) {
    // NEXT_REDIRECT is a special error thrown by redirect()
    if (error?.name === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Failed to accept consent request:", error);
    throw error;
  }
}
