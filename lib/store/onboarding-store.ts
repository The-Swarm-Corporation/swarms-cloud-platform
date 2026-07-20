import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Fired by the API keys page after a key is successfully created so the
 * onboarding wizard can advance without polling.
 */
export const API_KEY_CREATED_EVENT = 'swarms:api-key-created';

/**
 * - 'unseen'    → eligibility not yet decided; the wizard checks whether the
 *                 account has zero API keys and zero agents before starting.
 * - 'active'    → the guided flow is running (`step` tracks progress).
 * - 'completed' → finished the tour, or was never eligible (existing user).
 * - 'dismissed' → explicitly skipped; never shown again.
 */
export type OnboardingStatus = 'unseen' | 'active' | 'completed' | 'dismissed';

/**
 * 1 = create an API key, 2 = find your models, 3 = try the playground,
 * 4 = final "keep exploring" modal.
 */
export type OnboardingStep = 1 | 2 | 3 | 4;

interface OnboardingStore {
  status: OnboardingStatus;
  step: OnboardingStep;
  /** The intro modal has been acknowledged; show the compact step card instead. */
  welcomeSeen: boolean;
  /** Supabase user id the persisted state belongs to. */
  userId: string | null;

  /**
   * Bind the store to the signed-in user. Switching accounts (even without a
   * clean sign-out that wipes localStorage) resets the wizard so one user's
   * progress never applies to another.
   */
  syncUser: (userId: string) => void;
  start: () => void;
  /** Re-run the tour from the beginning (settings → "Restart tour"). */
  restart: () => void;
  /** Advance forward only - late signals can never move the flow backwards. */
  advance: (step: OnboardingStep) => void;
  markWelcomeSeen: () => void;
  dismiss: () => void;
  complete: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      status: 'unseen',
      step: 1,
      welcomeSeen: false,
      userId: null,

      syncUser: (userId) =>
        set((state) =>
          state.userId === userId
            ? state
            : { userId, status: 'unseen', step: 1, welcomeSeen: false },
        ),

      start: () => set({ status: 'active', step: 1, welcomeSeen: false }),

      restart: () => set({ status: 'active', step: 1, welcomeSeen: false }),

      advance: (step) =>
        set((state) => (step > state.step ? { step } : state)),

      markWelcomeSeen: () => set({ welcomeSeen: true }),

      dismiss: () => set({ status: 'dismissed' }),

      complete: () => set({ status: 'completed' }),
    }),
    {
      name: 'onboarding-store',
      version: 1,
    }
  )
);
