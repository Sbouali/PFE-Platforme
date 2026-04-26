const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key:process.env.cloudApiKey,
  api_secret: process.env.cloudApiSecret
});

module.exports = cloudinary;