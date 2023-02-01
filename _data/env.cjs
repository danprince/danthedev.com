module.exports = process.env;
exports.DEV = process.env.NODE_ENV !== "production";
exports.PROD = process.env.NODE_ENV === "production";
