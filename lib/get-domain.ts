/**
 * Get the correct domain for API calls based on environment
 * Render automatically sets RENDER_EXTERNAL_URL in production
 */
export function getDomain() {
  // Production on Render - use automatically provided URL
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }

  // Custom domain if provided
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Local development
  return 'http://localhost:10000';
}
