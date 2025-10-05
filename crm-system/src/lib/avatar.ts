/**
 * Generate a consistent DiceBear avatar URL for a user/customer
 * Uses the customer ID as the seed to ensure the same avatar is shown everywhere
 */
export function getAvatarUrl(customerId: string, style: string = 'avataaars'): string {
  // Using DiceBear API v7
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(customerId)}`
}

/**
 * Generate avatar URL with additional options
 */
export function getAvatarUrlWithOptions(
  customerId: string,
  options: {
    style?: string;
    backgroundColor?: string;
    radius?: number;
  } = {}
): string {
  const {
    style = 'avataaars',
    backgroundColor,
    radius
  } = options;

  let url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(customerId)}`

  if (backgroundColor) {
    url += `&backgroundColor=${backgroundColor}`
  }

  if (radius !== undefined) {
    url += `&radius=${radius}`
  }

  return url
}

/**
 * Get initials from a name as fallback
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''

  if (!first && !last) return '?'

  return (first.charAt(0) + last.charAt(0)).toUpperCase() || first.charAt(0).toUpperCase()
}
