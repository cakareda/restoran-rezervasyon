const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svgPath = path.join(__dirname, "..", "app", "icon.svg");
const outIco = path.join(__dirname, "..", "app", "favicon.ico");

async function main() {
  const pngBuffer = await sharp(svgPath, { density: 384 })
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Minimal ICO container wrapping a single 256x256 PNG-format image
  // (widely supported by browsers/OS since Vista+/all modern browsers)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count: 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // width: 0 = 256
  entry.writeUInt8(0, 1); // height: 0 = 256
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // image data size
  entry.writeUInt32LE(header.length + entry.length, 12); // offset

  const ico = Buffer.concat([header, entry, pngBuffer]);
  fs.writeFileSync(outIco, ico);
  console.log("wrote", outIco, ico.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
