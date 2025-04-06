export const config = {
  packQueryType: process.env.PACK_QUERY_TYPE as 'users' | 'gallery' | 'both',
  tuneType: process.env.NEXT_PUBLIC_TUNE_TYPE as 'packs' | 'tune',
  stripeEnabled: process.env.NEXT_PUBLIC_STRIPE_IS_ENABLED === 'true',
  deploymentUrl: process.env.DEPLOYMENT_URL,
  deploymentProvider: process.env.DEPLOYMENT_PROVIDER || 'cloudflare',
} as const;

function isPreviewUrl(url: string): boolean {
  // 检查Vercel预览URL
  if (url.includes('.vercel.app') && 
     (url.includes('-git-') || 
      url.match(/-[a-f0-9]{8,}\.vercel\.app/i) !== null)) {
    return true;
  }
  
  // 检查Cloudflare Pages预览URL
  if (url.includes('.pages.dev') && 
     (url.includes('-preview-') || 
      url.match(/-[a-f0-9]{7,}\.pages\.dev/i) !== null)) {
    return true;
  }
  
  return false;
}

export function validateConfig() {
  const validPackQueryTypes = ['users', 'gallery', 'both'];
  const validTuneTypes = ['packs', 'tune'];
  const validDeploymentProviders = ['vercel', 'cloudflare'];

  if (!validPackQueryTypes.includes(config.packQueryType)) {
    throw new Error(`Invalid PACK_QUERY_TYPE: ${config.packQueryType}`);
  }

  if (!validTuneTypes.includes(config.tuneType)) {
    throw new Error(`Invalid NEXT_PUBLIC_TUNE_TYPE: ${config.tuneType}`);
  }

  if (typeof config.stripeEnabled !== 'boolean') {
    throw new Error('Invalid NEXT_PUBLIC_STRIPE_IS_ENABLED value');
  }
  
  if (!validDeploymentProviders.includes(config.deploymentProvider as string)) {
    throw new Error(`Invalid DEPLOYMENT_PROVIDER: ${config.deploymentProvider}`);
  }

  // URL验证，支持多平台
  if (config.deploymentUrl && isPreviewUrl(config.deploymentUrl)) {
    throw new Error(
      'Invalid DEPLOYMENT_URL: Preview URLs cannot be used for webhooks.\n' +
      'Please use either:\n' +
      '1. Your production domain (e.g., your-app.com)\n' +
      '2. For local development, use ngrok (e.g., your-tunnel.ngrok.io)'
    );
  }
}


