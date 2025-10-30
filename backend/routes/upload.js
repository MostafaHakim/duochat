import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    console.log("📤 Received file:", req.file.originalname, req.file.mimetype);

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          return res.status(500).json({ message: "Cloudinary upload failed" });
        }

        console.log("✅ Cloudinary upload success:", result.secure_url);
        res.status(200).json({ fileUrl: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    res.status(500).json({ message: "Error uploading to Cloudinary" });
  }
});

export default router;
