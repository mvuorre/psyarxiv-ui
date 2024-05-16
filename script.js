// script.js
const PROXY_URL = 'http://localhost:3000';
const OSF_API_URL = `${PROXY_URL}/preprints`;

async function fetchLatestPreprints() {
    const response = await fetch(OSF_API_URL);
    const data = await response.json();
    return data.data;
}

async function displayLatestPreprints() {
    const preprints = await fetchLatestPreprints();
    const preprintsList = document.getElementById('preprints-list');

    preprints.forEach(preprint => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `preprint.html?id=${preprint.id}`;
        a.textContent = preprint.attributes.title;
        li.appendChild(a);
        preprintsList.appendChild(li);
    });
}

async function fetchPreprintDetails(id) {
    const response = await fetch(`${PROXY_URL}/preprints/${id}`);
    const data = await response.json();
    return data.data;
}

async function displayPreprintDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const preprintId = urlParams.get('id');
    const preprint = await fetchPreprintDetails(preprintId);

    document.getElementById('preprint-title').textContent = preprint.attributes.title;
    document.getElementById('preprint-authors').textContent = 'Authors: ' + preprint.attributes.contributors.map(c => c.embeds.users.data.attributes.full_name).join(', ');
    document.getElementById('preprint-keywords').textContent = 'Keywords: ' + preprint.attributes.tags.join(', ');
    document.getElementById('preprint-categories').textContent = 'Categories: ' + preprint.attributes.subjects.map(s => s.text).join(', ');
    document.getElementById('preprint-abstract').textContent = preprint.attributes.description;
    document.getElementById('preprint-download').href = preprint.attributes.original_publication;
    document.getElementById('preprint-osf-link').href = `https://osf.io/preprints/psyarxiv/${preprintId}`;
}

if (window.location.pathname.endsWith('preprint.html')) {
    displayPreprintDetails();
} else {
    displayLatestPreprints();
}