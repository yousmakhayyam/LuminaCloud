import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function initCloudinary() {
  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const apiKey = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

// POST /api/cloudinary/upload — streams file to Cloudinary using the SDK (no size limit)
router.post(
  "/cloudinary/upload",
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    try {
      const cl = initCloudinary();

      const uploadStream = cl.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "lumina-books",
          use_filename: true,
          unique_filename: true,
          chunk_size: 6 * 1024 * 1024, // 6 MB chunks
        },
        (error, result) => {
          if (error || !result) {
            req.log.error({ error }, "Cloudinary upload failed");
            res.status(500).json({ error: error?.message ?? "Upload failed" });
            return;
          }
          res.json({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (err) {
      req.log.error({ err }, "Cloudinary upload error");
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// POST /api/cloudinary/delete — deletes a file by public_id
router.post("/cloudinary/delete", async (req, res) => {
  try {
    const cl = initCloudinary();
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) {
      res.status(400).json({ error: "publicId is required" });
      return;
    }
    await cl.uploader.destroy(publicId, { resource_type: "raw" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Cloudinary delete failed");
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
