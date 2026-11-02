import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Default cache. This app does not use ISR, so no R2 incremental cache binding.
export default defineCloudflareConfig();
