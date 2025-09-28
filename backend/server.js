const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // <-- Loads environment variables from .env file

const app = express();
const port = 3001;

// Load the encryption key securely from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// A check to ensure the server exits if the key is missing
if (!ENCRYPTION_KEY) {
    console.error("FATAL ERROR: ENCRYPTION_KEY is not defined in the environment. Please check your .env file.");
    process.exit(1);
}

const PYTHON_EXECUTABLE = 'python3';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir + '/' });

app.use(cors());
app.use(express.json());

const executePythonScript = (scriptPath, args, res, isBinaryOutput = false) => {
    const allArgs = [...args, ENCRYPTION_KEY];
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [scriptPath, ...allArgs]);
    
    const chunks = [];
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        chunks.push(data);
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error(`Python Script Error: ${errorData}`);
    });

    pythonProcess.on('close', (code) => {
        args.forEach(filePath => fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
        }));

        if (code === 0 && chunks.length > 0) {
            const outputBuffer = Buffer.concat(chunks);
            if (isBinaryOutput) {
                 res.setHeader('Content-Disposition', 'attachment; filename=coding_questions.encrypted.json');
                 res.setHeader('Content-Type', 'application/octet-stream');
                 res.send(outputBuffer);
            } else {
                 res.setHeader('Content-Type', 'text/plain');
                 res.send(outputBuffer.toString());
            }
        } else {
            res.status(500).json({
                message: "Failed to process files.",
                error: errorData || "The script finished with an error and produced no output."
            });
        }
    });
};

app.post('/api/process/create', upload.fields([
    { name: 'luaFile', maxCount: 1 },
    { name: 'testcasesFile', maxCount: 1 }
]), (req, res) => {
    if (!req.files.luaFile || !req.files.testcasesFile) {
        return res.status(400).send('Missing required files.');
    }
    const luaPath = req.files.luaFile[0].path;
    const testcasesPath = req.files.testcasesFile[0].path;
    const scriptPath = path.join(__dirname, 'scripts', 'create_cq.py');
    executePythonScript(scriptPath, [luaPath, testcasesPath], res, true);
});

app.post('/api/process/update', upload.fields([
    { name: 'existingJson', maxCount: 1 },
    { name: 'luaFile', maxCount: 1 },
    { name: 'testcasesFile', maxCount: 1 }
]), (req, res) => {
    if (!req.files.existingJson || !req.files.luaFile || !req.files.testcasesFile) {
        return res.status(400).send('Missing required files.');
    }
    const existingJsonPath = req.files.existingJson[0].path;
    const luaPath = req.files.luaFile[0].path;
    const testcasesPath = req.files.testcasesFile[0].path;
    const scriptPath = path.join(__dirname, 'scripts', 'update_cq.py');
    executePythonScript(scriptPath, [existingJsonPath, luaPath, testcasesPath], res, true);
});

app.post('/api/process/merge', upload.fields([
    { name: 'cppFile', maxCount: 1 },
    { name: 'pyFile', maxCount: 1 },
    { name: 'javaFile', maxCount: 1 }
]), (req, res) => {
    if (!req.files.cppFile || !req.files.pyFile || !req.files.javaFile) {
        return res.status(400).send('Missing required files for merging.');
    }
    const cppPath = req.files.cppFile[0].path;
    const pyPath = req.files.pyFile[0].path;
    const javaPath = req.files.javaFile[0].path;
    const scriptPath = path.join(__dirname, 'scripts', 'merge_solutions.py');
    
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [scriptPath, cppPath, pyPath, javaPath]);
    
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => { outputData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });
    pythonProcess.on('close', (code) => {
        [cppPath, pyPath, javaPath].forEach(fp => fs.unlink(fp, () => {}));
        if (code === 0) {
            res.setHeader('Content-Type', 'text/plain');
            res.send(outputData);
        } else {
            res.status(500).send(errorData);
        }
    });
});

app.listen(port, () => {
    console.log(`🚀 Coding Question Factory server listening at http://localhost:${port}`);
});