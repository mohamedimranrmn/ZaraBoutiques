const admin = require("../firebase/admin");

exports.verifyFirebasePhone = async (req, res) => {
    try {
        const decoded = await admin.auth().verifyIdToken(req.body.idToken);
        res.json({ phone: decoded.phone_number });
    } catch (err) {
        return res.status(401).json({ message: "Invalid Firebase Token" });
    }
};
