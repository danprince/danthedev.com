module.exports = process.env;
module.exports.DEV = process.env.NODE_ENV !== "production";
module.exports.PROD = process.env.NODE_ENV === "production";
