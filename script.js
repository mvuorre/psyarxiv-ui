const PROXY_URL = 'http://localhost:3000';
const OSF_API_URL = `${PROXY_URL}/preprints`;

async function fetchLatestPreprints() {
    const response = await fetch(OSF_API_URL);
    const data = await response.json();
    return data;
}

async function displayLatestPreprints() {
    const preprints = await fetchLatestPreprints();
    const preprintsList = document.getElementById('preprints-list');

    preprints.forEach(preprint => {
        const li = document.createElement('li');

        const title = document.createElement('a');
        title.href = `preprint.html?id=${preprint.id}`;
        title.textContent = preprint.attributes.title;
        title.className = 'preprint-link';

        const contributors = document.createElement('span');
        contributors.className = 'contributors';
        contributors.innerHTML = preprint.contributors.map(contributor => {
            const lastName = contributor.embeds.users.data.attributes.family_name;
            const profileUrl = `https://osf.io/${contributor.embeds.users.data.id}/`;
            return `<a href="${profileUrl}" target="_blank">${lastName}</a>`;
        }).join(', ');

        li.appendChild(title);
        li.appendChild(contributors);
        preprintsList.appendChild(li);
    });
}

async function fetchPreprintDetails(id) {
    const response = await fetch(`${PROXY_URL}/preprints/${id}`);
    const data = await response.json();
    return data;
}

async function displayPreprintDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const preprintId = urlParams.get('id');
    const preprint = await fetchPreprintDetails(preprintId);

    document.getElementById('preprint-title').textContent = preprint.attributes.title;

    const authors = preprint.contributors.map(contributor => {
        const fullName = contributor.embeds.users.data.attributes.full_name;
        const profileUrl = `https://osf.io/${contributor.embeds.users.data.id}/`;
        return `<a href="${profileUrl}" target="_blank">${fullName}</a>`;
    }).join(', ');
    document.getElementById('preprint-authors').innerHTML = 'Authors: ' + authors;

    document.getElementById('preprint-keywords').textContent = 'Keywords: ' + preprint.attributes.tags.join(', ');

    // Map the subjects to display their text
    const disciplines = preprint.attributes.subjects.map(subject => subject.text).join(', ');
    document.getElementById('preprint-categories').textContent = 'Disciplines: ' + disciplines;

    document.getElementById('preprint-abstract').textContent = preprint.attributes.description;

    if (preprint.primary_file) {
        document.getElementById('preprint-download').href = preprint.primary_file.links.download;
    } else {
        document.getElementById('preprint-download').style.display = 'none';
    }

    document.getElementById('preprint-osf-link').href = `https://osf.io/preprints/psyarxiv/${preprintId}`;
}

if (window.location.pathname.endsWith('preprint.html')) {
    displayPreprintDetails();
} else {
    displayLatestPreprints();
}
