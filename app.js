// backend/app.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Root route to serve a simple message
app.get('/', (req, res) => {
  res.send('Welcome to the Image Comparison App Backend');
});

// Endpoint to fetch images
app.get('/api/images', (req, res) => {
  const imageDirectory = path.join(__dirname, 'images'); // Adjust the path to your images folder

  fs.readdir(imageDirectory, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }
    // Filter and map to image URLs
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)).map(file => `/images/${file}`);

    // Select two random images
    const getRandomImages = () => {
      let img1, img2;
      if (imageFiles.length >= 2) {
        img1 = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        do {
          img2 = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        } while (img1 === img2);
      }
      return [img1, img2];
    };

    res.json(getRandomImages());
  });
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
