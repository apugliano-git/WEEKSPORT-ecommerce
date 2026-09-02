export function isCronRequestAuthorized(authorizationHeader: string | null, secret: string | undefined): boolean {
  return Boolean(secret) && authorizationHeader === `Bearer ${secret}`
}
