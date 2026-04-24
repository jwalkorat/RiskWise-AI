"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/Client";

/**
 * useSessionGuard
 *
 * Rules enforced:
 *  1. ONE person per browser at a time.
 *     → If a different user logs in (any role), this tab is redirected to /login.
 *  2. Same person, multiple tabs → ✅ allowed. All tabs stay on their dashboard.
 *  3. Any sign-out → ALL tabs immediately redirect to /login.
 */
export function useSessionGuard(
  expectedRole: "STUDENT" | "TEACHER" | "MENTOR" | "COORDINATOR"
) {
  const router = useRouter();
  // Store the user ID that was active when this dashboard mounted
  const originalUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Capture the current user ID immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        originalUserIdRef.current = session.user.id;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // ── Rule 3: Any sign-out → send this tab to login ────────────────
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
        return;
      }

      if (event === "SIGNED_IN") {
        const newUserId = session.user.id;

        // ── Rule 2: Same person opened another tab → do nothing ──────────
        if (
          originalUserIdRef.current &&
          newUserId === originalUserIdRef.current
        ) {
          return;
        }

        // ── Rule 1: Different person logged in → kick this tab to login ──
        // The new person's login already succeeded; this tab just needs
        // to reflect that its user is no longer active.
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);
}

