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
        const preprints = response.data.data;

        // Fetch contributors for each preprint
        const preprintsWithContributors = await Promise.all(preprints.map(async preprint => {
            const contributorsResponse = await axios.get(preprint.relationships.contributors.links.related.href);
            preprint.contributors = contributorsResponse.data.data;
            return preprint;
        }));

        res.json(preprintsWithContributors);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

// Proxy endpoint for fetching preprint details
app.get('/preprints/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://api.osf.io/v2/preprints/${req.params.id}/`);
        const preprint = response.data.data;

        // Fetch contributors for the preprint
        const contributorsResponse = await axios.get(preprint.relationships.contributors.links.related.href);
        preprint.contributors = contributorsResponse.data.data;

        // Fetch primary file link
        const primaryFileLink = preprint.relationships.primary_file.links.related.href;
        const primaryFileResponse = await axios.get(primaryFileLink);
        preprint.primary_file = primaryFileResponse.data.data;

        res.json(preprint);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
