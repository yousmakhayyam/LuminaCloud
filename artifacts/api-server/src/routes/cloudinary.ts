import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Readable } from "stream";

const router = Router();

// Keep files in memory (no disk I/O needed — we stream straight to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB hard cap
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

function configureCloudinary() {
  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const apiKey = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return cloudinary;
}

function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        // 6 MB chunks — well within Cloudinary's chunked upload minimum (5 MB)
        chunk_size: 6 * 1024 * 1024,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// POST /api/books/upload — accepts a PDF, streams it to Cloudinary in chunks
router.post(
  "/books/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No PDF file provided" });
        return;
      }

      configureCloudinary();

      const folder = (req.query["folder"] as string | undefined) ?? "lumina-books";
      const result = await uploadBufferToCloudinary(req.file.buffer, folder);

      res.json(result);
    } catch (err) {
      req.log.error({ err }, "Cloudinary upload failed");
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(500).json({ error: message });
    }
  }
);

// POST /api/cloudinary/delete — deletes a file by public_id
router.post("/cloudinary/delete", async (req, res) => {
  try {
    configureCloudinary();
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) {
      res.status(400).json({ error: "publicId is required" });
      return;
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Cloudinary delete failed");
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
