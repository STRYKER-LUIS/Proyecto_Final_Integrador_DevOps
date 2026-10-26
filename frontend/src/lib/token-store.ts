let accessToken: string | null = null;

/**
 * El access token se conserva únicamente en memoria para reducir el riesgo
 * de exposición ante XSS. El refresh token vive en una cookie HttpOnly.
 */
export const tokenStore = {
  get(): string | null {
    return accessToken;
  },

  set(token: string | null): void {
    accessToken = token;
  },

  clear(): void {
    accessToken = null;
  },
};
