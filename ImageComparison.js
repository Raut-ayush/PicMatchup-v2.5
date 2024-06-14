import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const ImageComparison = () => {
    const [images, setImages] = useState([]);
    const [currentPair, setCurrentPair] = useState([null, null]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRankings, setShowRankings] = useState(false);
    const [eloRankings, setEloRankings] = useState([]);

    useEffect(() => {
        fetchImages();
        fetchEloRankings();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/images');
            const imageFiles = response.data.images;
            if (Array.isArray(imageFiles)) {
                setImages(imageFiles);
                setCurrentPair([imageFiles[0], imageFiles[1]]);
            } else {
                setError('Not enough images to display');
            }
            setLoading(false);
        } catch (error) {
            setError('Error fetching images: ' + error.message);
            setLoading(false);
        }
    };

    const fetchEloRankings = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/elo-rankings');
            setEloRankings(response.data);
        } catch (error) {
            console.error('Error fetching ELO rankings:', error);
        }
    };

    const handleChoice = async (chosenImage) => {
        try {
            await axios.post('http://localhost:3000/api/choice', { chosenImage });
            const remainingImages = images.filter(img => img !== chosenImage);
            if (remainingImages.length >= 2) {
                setImages(remainingImages);
                setCurrentPair([remainingImages[0], remainingImages[1]]);
            } else {
                setCurrentPair([null, null]);
            }
        } catch (error) {
            setError('Error handling choice: ' + error.message);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="main-content">
            {!showRankings ? (
                <div className="image-comparison-container">
                    <div className="image-container">
                        {currentPair[0] && (
                            <img
                                src={`http://localhost:3000/images/${currentPair[0]}`}
                                alt="Option 1"
                                onClick={() => handleChoice(currentPair[0])}
                            />
                        )}
                    </div>
                    <div className="image-container">
                        {currentPair[1] && (
                            <img
                                src={`http://localhost:3000/images/${currentPair[1]}`}
                                alt="Option 2"
                                onClick={() => handleChoice(currentPair[1])}
                            />
                        )}
                    </div>
                    <div className="button-container">
                        <button id="elo-ranking-button" onClick={() => setShowRankings(true)}>Show ELO Rankings</button>
                        <button id="reset-elo-button" onClick={() => setEloRankings([])}>Reset ELO Scores</button>
                    </div>
                </div>
            ) : (
                <div className="elo-rankings-container">
                    <h2>ELO Rankings</h2>
                    <ul>
                        {eloRankings.map((ranking, index) => (
                            <li key={index}>{ranking}</li>
                        ))}
                    </ul>
                    <button onClick={() => setShowRankings(false)}>Back to Comparison</button>
                </div>
            )}
        </div>
    );
};

export default ImageComparison;
