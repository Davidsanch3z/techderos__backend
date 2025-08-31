const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../clients/s3");
const mime = require("mime-types");

function getUniqueFileName(filename) {
  const ext = filename.includes(".")
    ? filename.substring(filename.lastIndexOf("."))
    : "";
  return `${uuidv4()}${ext}`;
}

function getContentType(filename) {
  return mime.lookup(filename) || "application/octet-stream";
}

async function saveInS3(buffer, objectName) {
  const res = await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: objectName,
      Body: buffer,
      ContentType: getContentType(objectName),
    })
  );
  return res;
}

module.exports = {
  saveInS3,
  getUniqueFileName,
};
