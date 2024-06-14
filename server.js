const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const NodeCache = require('node-cache');
const termsAndConditions = require('./terms');

const app = express();
const PORT = 3000;
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

app.use(cors());
app.use(express.json());

const imageDirectory = path.join(__dirname, 'images');
const choicesFile = path.join(__dirname, 'choices.json');
const eloFile = path.join(__dirname, 'elo.json');
const usersFile = path.join(__dirname, 'users.json');

let shownPairs = new Set();

// Ensure choices.json file exists
if (!fs.existsSync(choicesFile)) {
    fs.writeFileSync(choicesFile, '[]', 'utf8');
}

// Ensure elo.json file exists
if (!fs.existsSync(eloFile)) {
    fs.writeFileSync(eloFile, '{}', 'utf8');
}

// Ensure users.json file exists
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]', 'utf8');
}

// Load ELO data into memory
let eloData = JSON.parse(fs.readFileSync(eloFile, 'utf8'));

// Serve the terms and conditions file
// app.use('/terms', express.static(path.join(__dirname, 'TermsAndConditions.txt')));

// Example route to read and return the contents of the terms file
// Serve static CSS file
app.use('/terms.css', express.static(path.join(__dirname, 'terms.css')));

// Serve the terms and conditions content
app.get('/terms', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(termsAndConditions);
});

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageDirectory);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Helper functions
const readUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]');
const writeUsers = (users) => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

// Calculate ELO rating
const calculateElo = (rating1, rating2, result, kFactor = 32) => {
    const expected1 = 1 / (1 + 10 ** ((rating2 - rating1) / 400));
    const expected2 = 1 / (1 + 10 ** ((rating1 - rating2) / 400));
    const newRating1 = rating1 + kFactor * (result - expected1);
    const newRating2 = rating2 + kFactor * ((1 - result) - expected2);
    return [newRating1, newRating2];
};

// Registration route
app.post('/api/register', upload.single('image'), async (req, res) => {
    const { email, password, yearOfBirth, phoneNumber } = req.body;
    const users = readUsers();

    if (users.find(user => user.email === email)) {
        return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        email,
        password: hashedPassword,
        yearOfBirth,
        phoneNumber,
        image: req.file ? req.file.filename : null
    };

    users.push(newUser);
    writeUsers(users);
    res.status(201).send('User registered');
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(user => user.email === email);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.email }, 'secretkey');
        res.json({ token });
    } else {
        res.status(400).send('Invalid credentials');
    }
});

// Endpoint to get two random images or show preferences if all pairs have been shown
app.get('/api/images', (req, res) => {
    fs.readdir(imageDirectory, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));
        if (imageFiles.length < 2) {
            return res.status(400).send('Not enough images in the folder');
        }

        // Calculate total possible pairs
        const totalPairs = (imageFiles.length * (imageFiles.length - 1)) / 2;

        // Check if all pairs have been shown
        if (shownPairs.size >= totalPairs) {
            return showPreferences(res);
        }

        let pair;
        do {
            const randomIndex1 = Math.floor(Math.random() * imageFiles.length);
            const randomIndex2 = (randomIndex1 + Math.floor(Math.random() * (imageFiles.length - 1)) + 1) % imageFiles.length;
            pair = [imageFiles[randomIndex1], imageFiles[randomIndex2]];
            pair.sort();
        } while (shownPairs.has(pair.toString()) && shownPairs.size < totalPairs);

        shownPairs.add(pair.toString());
        res.json({ images: pair });
    });
});

// Helper function to show preferences
function showPreferences(res) {
    fs.readFile(choicesFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read choices file' });
        }
        const choices = JSON.parse(data);

        const preferenceCount = {};
        choices.forEach(choice => {
            if (!preferenceCount[choice.choice]) preferenceCount[choice.choice] = 0;
            if (!preferenceCount[choice.other]) preferenceCount[choice.other] = 0;
            preferenceCount[choice.choice] += 1;
        });

        const sortedPreferences = Object.entries(preferenceCount)
            .sort((a, b) => b[1] - a[1])
            .map(([image, count]) => ({ image, count }));

        res.json({ message: 'All comparisons done', preferences: sortedPreferences });
    });
}

// Endpoint to record user choice
app.post('/api/choice', (req, res) => {
    const { choice, other } = req.body;

    fs.readFile(choicesFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read choices file' });
        }
        const choices = JSON.parse(data);
        choices.push({ choice, other });

        const defaultElo = 1200;
        const choiceElo = eloData[choice] || defaultElo;
        const otherElo = eloData[other] || defaultElo;

        const [newChoiceElo, newOtherElo] = calculateElo(choiceElo, otherElo, 1);

        eloData[choice] = newChoiceElo;
        eloData[other] = newOtherElo;

        fs.writeFile(choicesFile, JSON.stringify(choices, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write to choices file' });
            }
            // Persist ELO data
            fs.writeFile(eloFile, JSON.stringify(eloData, null, 2), 'utf8', (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to write to ELO file' });
                }
                // Invalidate the cache
                cache.del('eloList');
                res.json({ message: 'Choice recorded and ELO updated' });
            });
        });
    });
});

// Endpoint to reset state
app.post('/api/reset', (req, res) => {
    shownPairs.clear();
    fs.writeFile(choicesFile, '[]', 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to reset choices file' });
        }
        res.json({ message: 'State reset' });
    });
});

// Endpoint to reset ELO scores
app.post('/api/reset-elo', (req, res) => {
    eloData = {}; // Clear the ELO data
    fs.writeFile(eloFile, JSON.stringify(eloData, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to reset ELO file' });
        }
        // Invalidate the cache
        cache.del('eloList');
        res.json({ message: 'ELO scores reset' });
    });
});

// Endpoint to get ELO rankings
app.get('/api/elo', (req, res) => {
    const cachedEloList = cache.get('eloList');
    if (cachedEloList) {
        return res.json(cachedEloList);
    }

    const eloList = Object.entries(eloData)
        .map(([image, elo]) => ({ image, elo }))
        .sort((a, b) => b.elo - a.elo);

    cache.set('eloList', eloList);
    res.json(eloList);
});

// Serve images statically
app.use('/images', express.static(imageDirectory));

// Error handling middleware
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', err);
    res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
