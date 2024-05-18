const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/preprints', async (req, res) => {
    const { startDate, endDate, filterType } = req.query;
    const dateField = filterType === 'date_modified' ? 'date_modified' : 'date_created';
    try {
        const response = await axios.get('https://api.osf.io/v2/preprints/', {
            params: {
                [`filter[${dateField}][gte]`]: startDate,
                [`filter[${dateField}][lte]`]: endDate,
                'page[size]': 100, // Adjust the number of results per page as needed
                'sort': `-${dateField}`
            }
        });
        let preprints = response.data.data;

        if (filterType === 'date_modified') {
            preprints = preprints.filter(preprint => {
                const createdDate = new Date(preprint.attributes.date_created);
                const modifiedDate = new Date(preprint.attributes.date_modified);
                return (modifiedDate - createdDate) > 3 * 24 * 60 * 60 * 1000; // At least 3 days difference
            });
        }

        const preprintsWithContributors = await Promise.all(preprints.map(async preprint => {
            const contributorsResponse = await axios.get(preprint.relationships.contributors.links.related.href);
            preprint.contributors = contributorsResponse.data.data;
            return preprint;
        }));

        res.json({ data: preprintsWithContributors });
    } catch (error) {
        console.error('Error in /api/preprints:', error);
        res.status(500).send(error.toString());
    }
});

app.get('/api/preprints/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://api.osf.io/v2/preprints/${req.params.id}/`);
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
