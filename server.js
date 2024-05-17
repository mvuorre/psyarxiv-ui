const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/preprints', async (req, res) => {
    try {
        const response = await axios.get('https://api.osf.io/v2/preprints/?page[size]=10&sort=-date_created');
        console.log('Preprints API response:', response.data);
        const preprints = response.data.data;

        const preprintsWithContributors = await Promise.all(preprints.map(async preprint => {
            const contributorsResponse = await axios.get(preprint.relationships.contributors.links.related.href);
            preprint.contributors = contributorsResponse.data.data;
            return preprint;
        }));

        res.json(preprintsWithContributors);
    } catch (error) {
        console.error('Error in /api/preprints:', error);
        res.status(500).send(error.toString());
    }
});

app.get('/api/preprints/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://api.osf.io/v2/preprints/${req.params.id}/`);
        console.log('Preprint details API response:', response.data);
        const preprint = response.data.data;

        const contributorsResponse = await axios.get(preprint.relationships.contributors.links.related.href);
        preprint.contributors = contributorsResponse.data.data;

        const primaryFileLink = preprint.relationships.primary_file.links.related.href;
        const primaryFileResponse = await axios.get(primaryFileLink);
        preprint.primary_file = primaryFileResponse.data.data;

        res.json(preprint);
    } catch (error) {
        console.error('Error in /api/preprints/:id:', error);
        res.status(500).send(error.toString());
    }
});

// Serve the HTML files for the routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/preprint.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'preprint.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
