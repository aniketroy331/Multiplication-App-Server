module.exports = {
    mongoURI: 'mongodb://localhost:27017/auth_system',
    jwtSecret: '0bea859d8c39f5a954d6fa57dca1ded0c07a845e345a6c58e57e18f17634d6fa67a83ae74ab66b270b36591fd91c198e7bf094067c99933d1e3c88effe353764',
    jwtExpire: '24h',
    resetPasswordExpire: 3600000 // 1 hour
  };