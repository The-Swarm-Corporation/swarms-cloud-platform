/**
 * Name given to the API key that is auto-provisioned the first time a user
 * with no keys hits the platform. Client-safe (no server imports) so the
 * onboarding wizard can distinguish the auto-created key from ones the user
 * made themselves.
 */
export const AUTO_CREATED_KEY_NAME = 'Default';
