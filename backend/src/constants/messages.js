const MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    UNAUTHORIZED: 'Authentication required',
    LOGOUT_SUCCESS: 'Logged out successfully'
  },
  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists'
  },
  SERVER: {
    INTERNAL_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found'
  }
};

export { MESSAGES };