const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;

// Configuration constants
const CONFIG = {
    PAGE_SIZE: 20,
    MIN_EDIT_DAYS: 3
};

// Helper function to fetch contributors for a preprint
async function fetchContributors(preprint) {
    try {
        const contributorsResponse = await axios.get(preprint.relationships.contributors.links.related.href);
        return contributorsResponse.data.data;
    } catch (error) {
        console.error(`Error fetching contributors for preprint ${preprint.id}:`, error.message);
        return [];
    }
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/preprints', async (req, res) => {
    const { startDate, endDate, filterType } = req.query;
    
    // Basic input validation
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    const dateField = filterType === 'date_modified' ? 'date_modified' : 'date_created';
    
    try {
        const response = await axios.get('https://api.osf.io/v2/preprints/', {
            params: {
                [`filter[${dateField}][gte]`]: startDate,
                [`filter[${dateField}][lte]`]: endDate,
                'page[size]': CONFIG.PAGE_SIZE,
                'sort': `-${dateField}`
            }
        });
        let preprints = response.data.data;

        if (filterType === 'date_modified') {
            preprints = preprints.filter(preprint => {
                const createdDate = new Date(preprint.attributes.date_created);
                const modifiedDate = new Date(preprint.attributes.date_modified);
                return (modifiedDate - createdDate) > CONFIG.MIN_EDIT_DAYS * 24 * 60 * 60 * 1000;
            });
        }

        const preprintsWithContributors = await Promise.all(
            preprints.map(async preprint => {
                preprint.contributors = await fetchContributors(preprint);
                return preprint;
            })
        );

        res.json({ data: preprintsWithContributors });
    } catch (error) {
        console.error('Error in /api/preprints:', error);
        res.status(500).json({ error: 'Failed to fetch preprints. Please try again later.' });
    }
});

app.get('/api/preprints/:id', async (req, res) => {
    const { id } = req.params;
    
    // Basic input validation
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Valid preprint ID is required' });
    }
    
    try {
        const response = await axios.get(`https://api.osf.io/v2/preprints/${id}/`);
        const preprint = response.data.data;

        preprint.contributors = await fetchContributors(preprint);

        const primaryFileLink = preprint.relationships.primary_file.links.related.href;
        const primaryFileResponse = await axios.get(primaryFileLink);
        preprint.primary_file = primaryFileResponse.data.data;

        res.json(preprint);
    } catch (error) {
        console.error('Error in /api/preprints/:id:', error);
        if (error.response?.status === 404) {
            res.status(404).json({ error: 'Preprint not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch preprint details. Please try again later.' });
        }
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
