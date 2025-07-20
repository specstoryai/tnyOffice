const isProd = process.env.NODE_ENV === 'production'

export const log = {
  info: (...args: any[]) => {
    if (!isProd) console.info('[INFO]', ...args)
  },
  warn: (...args: any[]) => {
    if (!isProd) console.warn('[WARN]', ...args)
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },
  debug: (...args: any[]) => {
    if (!isProd) console.debug('[DEBUG]', ...args)
  },
}