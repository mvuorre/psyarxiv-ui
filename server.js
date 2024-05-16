const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Proxy endpoint for fetching preprints
app.get('/preprints', async (req, res) => {
    try {
        const response = await axios.get('https://api.osf.io/v2/preprints/?page[size]=10&sort=-date_created');
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Proxy endpoint for fetching preprint details
app.get('/preprints/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://api.osf.io/v2/preprints/${req.params.id}/`);
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
