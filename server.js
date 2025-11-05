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


// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/preprints', async (req, res) => {
    const { search, next } = req.query;
    
    // Handle search requests
    if (search) {
        try {
            // Search across multiple fields using OR logic by making multiple requests
            const searchPromises = [
                // Search in title
                axios.get('https://psyarxivdb.vuorre.com/preprints/preprints.json', {
                    params: {
                        'title__contains': search,
                        '_sort_desc': 'date_created',
                        '_size': 50,
                        '_shape': 'objects'
                    }
                }),
                // Search in contributors
                axios.get('https://psyarxivdb.vuorre.com/preprints/preprints.json', {
                    params: {
                        'contributors__contains': search,
                        '_sort_desc': 'date_created',
                        '_size': 50,
                        '_shape': 'objects'
                    }
                }),
                // Search in description
                axios.get('https://psyarxivdb.vuorre.com/preprints/preprints.json', {
                    params: {
                        'description__contains': search,
                        '_sort_desc': 'date_created',
                        '_size': 50,
                        '_shape': 'objects'
                    }
                })
            ];
            
            const responses = await Promise.all(searchPromises);
            
            // Combine and deduplicate results
            const allResults = [];
            const seenIds = new Set();
            
            responses.forEach(response => {
                response.data.rows.forEach(preprint => {
                    if (!seenIds.has(preprint.id)) {
                        seenIds.add(preprint.id);
                        allResults.push(preprint);
                    }
                });
            });
            
            // Sort by date_created descending
            allResults.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
            
            return res.json({ data: allResults });
        } catch (error) {
            console.error('Error in search:', error);
            return res.status(500).json({ error: 'Failed to search preprints. Please try again later.' });
        }
    }
    
    // Handle regular browsing with pagination
    try {
        const params = {
            '_sort_desc': 'date_created',
            '_size': CONFIG.PAGE_SIZE,
            '_shape': 'objects'
        };
        
        // Use Datasette's _next token for pagination
        if (next) {
            params['_next'] = next;
        }

        const response = await axios.get('https://psyarxivdb.vuorre.com/preprints/preprints.json', { params });
        const preprints = response.data.rows;
        
        // Datasette pagination uses next_url
        const hasMore = !!response.data.next;
        const nextToken = response.data.next;
        
        res.json({ 
            data: preprints,
            pagination: {
                hasMore,
                nextToken
            }
        });
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
        const response = await axios.get('https://psyarxivdb.vuorre.com/preprints/preprints.json', {
            params: {
                'id__exact': id,
                '_shape': 'objects'
            }
        });
        
        const preprints = response.data.rows;
        if (preprints.length === 0) {
            return res.status(404).json({ error: 'Preprint not found' });
        }

        res.json(preprints[0]);
    } catch (error) {
        console.error('Error in /api/preprints/:id:', error);
        res.status(500).json({ error: 'Failed to fetch preprint details. Please try again later.' });
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
