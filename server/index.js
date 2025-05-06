const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const response = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'assistants'
    });

    // Example: Pass to assistant thread / classification logic
    res.json({ success: true, fileId: response.id });

    // Clean up
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload and classify PDF' });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));