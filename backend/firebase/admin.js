require("dotenv").config();
const admin = require("firebase-admin");

const serviceAccount = {
    type: "service_account",
    project_id: "zara-boutiques",
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_URL,
    client_x509_cert_url: process.env.CLIENT_URL,
    universe_domain: "googleapis.com",
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
