import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions,
    ) => {
      try {
        // @ts-ignore
        const { createLovableAuth } = await import("@lovable.dev/cloud-auth-js");
        const lovableAuth = createLovableAuth();
        const result = await lovableAuth.signInWithOAuth(provider, {
          redirect_uri: opts?.redirect_uri,
          extraParams: {
            ...opts?.extraParams,
          },
        });

        if (result.redirected || result.error) {
          return result;
        }

        try {
          if (result.tokens) {
            await supabase.auth.setSession(result.tokens);
          }
        } catch (e) {
          return { error: e instanceof Error ? e : new Error(String(e)) };
        }
        return result;
      } catch (err) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
  },
};
