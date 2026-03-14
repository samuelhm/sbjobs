const isProduction = (process.env.NODE_ENV || 'production') === 'production';

const cookieOptions = {
  httpOnly: true,
  path: '/',
  maxAge: 24 * 60 * 60,
  ...(isProduction
    ? {
        secure: true,
        sameSite: 'strict'
      }
    : {
        secure: false,
        sameSite: 'lax'
      })
};

export { cookieOptions };