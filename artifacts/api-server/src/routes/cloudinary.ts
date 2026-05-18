import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

function getCloudinary() {
  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const apiKey = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

// GET /api/cloudinary/sign — returns a signed upload params object
router.get("/cloudinary/sign", (req, res) => {
  try {
    const cl = getCloudinary();
    const folder = (req.query["folder"] as string) || "lumina-books";
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };
    const signature = cl.utils.api_sign_request(paramsToSign, process.env["CLOUDINARY_API_SECRET"]!);

    res.json({
      signature,
      timestamp,
      folder,
      api_key: process.env["CLOUDINARY_API_KEY"],
      cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to sign Cloudinary request");
    res.status(500).json({ error: "Failed to generate upload signature" });
  }
});

// POST /api/cloudinary/delete — deletes a file by public_id
router.post("/cloudinary/delete", async (req, res) => {
  try {
    const cl = getCloudinary();
    const { publicId } = req.body as { publicId?: string };

    if (!publicId) {
      res.status(400).json({ error: "publicId is required" });
      return;
    }

    await cl.uploader.destroy(publicId, { resource_type: "raw" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete Cloudinary asset");
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
