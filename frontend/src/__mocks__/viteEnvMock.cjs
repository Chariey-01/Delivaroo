// Jest stand-in for src/api/viteEnv.js, which is the only module allowed to read
// import.meta. Values match the development defaults.
module.exports = {
  API_BASE_URL: '',
  GOOGLE_MAPS_API_KEY: '',
  MAP_DEFAULT_CENTER: { lat: -1.2921, lng: 36.8219 },
};
