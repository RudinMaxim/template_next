const getNodeEnv = () => process.env.NODE_ENV;

const getHostname = (): string => (typeof window !== 'undefined' ? window.location.hostname : '');

const matchHostname = (patterns: Array<string | RegExp>): boolean => {
  const hostname = getHostname();
  if (!hostname) return false;

  return patterns.some((pattern) =>
    typeof pattern === 'string' ? hostname.includes(pattern) : pattern.test(hostname)
  );
};

export const isDevelopment = (): boolean => getNodeEnv() === 'development';

export const isLocalhost = (): boolean => {
  const localhostPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    /^192\.168\./,
    /^10\./,
    /\.local$/,
    /\.test$/,
  ];

  return matchHostname(localhostPatterns);
};

export const debugLog = (service: string, type: string, ...args: unknown[]): void => {
  if (isDevelopment()) {
    console.log(`[${service}] ${type}:`, ...args);
  }
};

export const isTestEnvironment = (): boolean => {
  const testPatterns = ['staging.', 'dev.', 'test.', 'qa.'];

  return matchHostname(testPatterns);
};

export const isProduction = (): boolean => getNodeEnv() === 'production' && !isTestEnvironment();

export const logEnvironmentInfo = (): void => {
  if (isDevelopment()) {
    console.log('[Environment]', {
      isDevelopment: isDevelopment(),
      isLocalhost: isLocalhost(),
      isTestEnvironment: isTestEnvironment(),
      isProduction: isProduction(),
      nodeEnv: getNodeEnv(),
      hostname: getHostname() || 'server',
    });
  }
};
