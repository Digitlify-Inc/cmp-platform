/**
 * URL utilities for clean URLs
 * Hides default-channel from URLs while maintaining multi-channel support
 */

const DEFAULT_CHANNEL = 'default-channel';

/**
 * Generate a clean URL, removing default-channel from the path
 * @param channel - The channel slug
 * @param path - The path after the channel (e.g., '/marketplace')
 * @returns Clean URL string
 */
export function channelUrl(channel: string, path: string = ''): string {
  if (channel === DEFAULT_CHANNEL) {
    return path || '/';
  }
  return `/${channel}${path}`;
}

/**
 * Check if a channel is the default channel
 */
export function isDefaultChannel(channel: string): boolean {
  return channel === DEFAULT_CHANNEL;
}
