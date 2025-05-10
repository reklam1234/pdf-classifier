const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

// Import the pdfProcessor
const { analyzePdf } = require('./src/utils/pdfProcessor');

const app = express();
const port = 5050;

// Enhanced CORS configuration
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());

// Configure multer with limits
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 32 * 1024 * 1024 // 32MB limit
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log("📥 Upload route hit");

        // Check if file was provided
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        console.log(`Processing file: ${filePath}`);

        // First, analyze the PDF using our local processor
        console.log("🔍 Analyzing PDF with local processor...");
        let pdfAnalysis;
        try {
            pdfAnalysis = await analyzePdf(filePath);
            console.log("PDF Analysis Result:", 
                typeof pdfAnalysis === 'string' ? pdfAnalysis : {
                    metadataKeys: Object.keys(pdfAnalysis.metadata),
                    textLength: pdfAnalysis.text?.length || 0,
                    textPreview: pdfAnalysis.text?.substring(0, 200) + '...'
                }
            );
        } catch (pdfError) {
            console.error("PDF Analysis Error:", pdfError);
            pdfAnalysis = `Error analyzing PDF: ${pdfError.message}`;
        }

        // Continue with OpenAI processing
        // Read file and convert to base64
        const fileData = fs.readFileSync(filePath);
        const base64File = fileData.toString('base64');
        const mimeType = req.file.mimetype || 'application/pdf';
        const fileDataUri = `data:${mimeType};base64,${base64File}`;

        const systemPrompt =
            'Du är en dokument-klassificerare för dokument relaterade till privata hus. Användaren laddar upp olika dokument, och du ska klassificera dem i lämpliga kategorier som: contract, manual, prospect, eller protocol. Svara med dokumenttyp (docType), kategori (docCategory), en mening som beskriver innehållet och en lista på parter (organisationer, individer) som hittas i dokumentet. Om du inte med säkerhet kan klassificera dokumenttyp enligt givna värden, svara med docType="unknown". \
            Svara i JSON format enligt följande struktur.  \
            { \
                docType: "contract"|"reciept"|"invoice" |"proposal" |"manual"|"specification"| "prospect"|"protocol"|"unknown", \
                docCategory: "technical" | "financial" | "other", \
                documentTitle:"The title or header of the document text",\
                summary : "One sentence summarizing the document",\
                parties : ["an array of party names"]\
            } ';

        // Use the OpenAI responses API directly
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": systemPrompt
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": ""
                        },
                        {
                            "type": "file",
                            "file": {
                                "file_data": fileDataUri,
                                "filename": req.file.originalname
                            }
                        }
                    ]
                }
            ],
            response_format: {
                "type": "json_object"
            },
            temperature: 0,
            max_completion_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            store: false
        });

        console.log('OpenAI response:', response);

        // Extract classification result
        let classification = 'No response from classification system';

        if (response && response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
            classification = response.choices[0].message.content || '<No content text>';
        } else {
            classification = "<no response content found>";
        }

        // Return classification results along with PDF analysis
        res.json({
            success: true,
            classification: classification,
            pdfAnalysis: typeof pdfAnalysis === 'string' ? { message: pdfAnalysis } : {
                metadata: pdfAnalysis.metadata,
                textPreview: pdfAnalysis.text?.substring(0, 300) + '...',
                textLength: pdfAnalysis.text?.length || 0
            }
        });

        // Clean up
        fs.unlinkSync(filePath);
    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json({
            error: 'Failed to upload and classify PDF',
            details: err.message
        });
    }
});

// Error handling middleware for multer file size errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'Filstorlek för stor',
                details: 'Filen är för stor. Maximal filstorlek är 32MB.'
            });
        }
    }
    next(err);
});

// Add a simple test endpoint
app.get('/ping', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));