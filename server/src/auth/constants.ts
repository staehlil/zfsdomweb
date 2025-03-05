export const jwtConstants = {
  tokenSecret: process.env.JWT_TOKEN_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET
};
export const settingsConstants = {
  secret:process.env.SETTINGS_ENCRYPTION_KEY
}