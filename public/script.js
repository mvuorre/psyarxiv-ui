async function fetchLatestPreprints() {
    try {
        const response = await fetch('/api/preprints');
        const text = await response.text();
        console.log('Raw response text:', text);
        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('Error fetching preprints:', error);
    }
}

async function displayLatestPreprints() {
    const preprints = await fetchLatestPreprints();
    const preprintsList = document.getElementById('preprints-list');

    if (preprints) {
        preprints.forEach(preprint => {
            const li = document.createElement('li');

            const title = document.createElement('a');
            title.href = `preprint.html?id=${preprint.id}`;
            title.textContent = preprint.attributes.title;
            title.className = 'preprint-link';

            const contributors = document.createElement('div');
            contributors.className = 'contributors';
            const dateSubmitted = new Date(preprint.attributes.date_created).toLocaleDateString('en-CA');
            contributors.innerHTML = preprint.contributors.map(contributor => {
                const lastName = contributor.embeds.users.data.attributes.family_name;
                const profileUrl = `https://osf.io/${contributor.embeds.users.data.id}/`;
                return `<a href="${profileUrl}" target="_blank">${lastName}</a>`;
            }).join(', ') + ` | ${dateSubmitted}`;

            li.appendChild(title);
            li.appendChild(contributors);
            preprintsList.appendChild(li);
        });
    }
}

if (window.location.pathname.endsWith('preprint.html')) {
    displayPreprintDetails();
} else {
    displayLatestPreprints();
}
