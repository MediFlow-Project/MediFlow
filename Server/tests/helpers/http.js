function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { auth };
