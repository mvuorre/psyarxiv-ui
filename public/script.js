async function fetchPreprints(startDate, endDate, filterType) {
    try {
        const response = await fetch(`/api/preprints?startDate=${startDate}&endDate=${endDate}&filterType=${filterType}`);
        const text = await response.text();
        const data = JSON.parse(text);
        return data && data.data ? data.data : []; // Ensure it returns an array
    } catch (error) {
        return []; // Return an empty array in case of error
    }
}

async function displayPreprints(startDate, endDate, filterType) {
    const preprints = await fetchPreprints(startDate, endDate, filterType);
    const preprintsList = document.getElementById('preprints-list');
    preprintsList.innerHTML = ''; // Clear the list before displaying new results
    
    const dateRangeText = document.getElementById('date-range-text');
    dateRangeText.textContent = `(Most recently ${filterType === 'date_created' ? 'submitted preprints' : 'edited preprints'} from ${startDate} to ${endDate})`;
    
    if (Array.isArray(preprints) && preprints.length > 0) {
        preprints.forEach(preprint => {
            const li = document.createElement('li');
            const title = document.createElement('a');
            title.href = `preprint.html?id=${preprint.id}`;
            title.textContent = preprint.attributes.title;
            title.className = 'preprint-link';
            const contributors = document.createElement('div');
            contributors.className = 'contributors';
            const dateField = filterType === 'date_modified' ? preprint.attributes.date_modified : preprint.attributes.date_created;
            const dateSubmitted = new Date(dateField).toLocaleDateString('en-CA');
            contributors.innerHTML = preprint.contributors.map(contributor => {
                const fullName = contributor.embeds.users.data.attributes.given_name + ' ' + contributor.embeds.users.data.attributes.family_name;
                const profileUrl = `https://osf.io/${contributor.embeds.users.data.id}/`;
                return `<a href="${profileUrl}" target="_blank">${fullName}</a>`;
            }).join(', ');
            li.appendChild(title);
            li.appendChild(contributors);
            preprintsList.appendChild(li);
        });
    } else {
        console.error('Preprints is not an array or is empty:', preprints);
    }
}

async function fetchPreprintDetails(id) {
    try {
        const response = await fetch(`/api/preprints/${id}`);
        const text = await response.text();
        const data = JSON.parse(text);
        return data;
    } catch (error) {
        return null; // Return null in case of error
    }
}

async function displayPreprintDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const preprintId = urlParams.get('id');
    const preprint = await fetchPreprintDetails(preprintId);
    
    if (preprint) {
        document.getElementById('preprint-title').textContent = preprint.attributes.title;
        
        const authors = preprint.contributors.map(contributor => {
            const fullName = contributor.embeds.users.data.attributes.given_name + ' ' + contributor.embeds.users.data.attributes.family_name;
            const profileUrl = `https://osf.io/${contributor.embeds.users.data.id}/`;
            return `<a href="${profileUrl}" target="_blank">${fullName}</a>`;
        }).join(', ');
        document.getElementById('preprint-authors').innerHTML = 'Authors: ' + authors;
        
        document.getElementById('preprint-keywords').textContent = 'Keywords: ' + preprint.attributes.tags.join(', ');
        
        document.getElementById('preprint-abstract').textContent = preprint.attributes.description;
        
        if (preprint.primary_file) {
            document.getElementById('preprint-download').href = preprint.primary_file.links.download;
        } else {
            document.getElementById('preprint-download').style.display = 'none';
        }
        
        document.getElementById('preprint-osf-link').href = `https://osf.io/preprints/psyarxiv/${preprintId}`;
    }
}

function getDateRange(days) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of the day
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0); // Start of the day
    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

// Default display for today
const { startDate, endDate } = getDateRange(0);

if (window.location.pathname.endsWith('preprint.html')) {
    displayPreprintDetails();
} else {
    // Event listeners for "New Preprints"
    document.getElementById('today-new').addEventListener('click', () => {
        const { startDate, endDate } = getDateRange(0);
        displayPreprints(startDate, endDate, 'date_created');
    });
    
    document.getElementById('last3days-new').addEventListener('click', () => {
        const { startDate, endDate } = getDateRange(2); // Includes today
        displayPreprints(startDate, endDate, 'date_created');
    });
    
    document.getElementById('last7days-new').addEventListener('click', () => {
        const { startDate, endDate } = getDateRange(6); // Includes today
        displayPreprints(startDate, endDate, 'date_created');
    });
    
    // Event listeners for "Recently Edited"
    document.getElementById('today-edited').addEventListener('click', () => {
        const { startDate, endDate } = getDateRange(0);
        displayPreprints(startDate, endDate, 'date_modified');
    });
    
    document.getElementById('last3days-edited').addEventListener('click', () => {
        const { startDate, endDate } = getDateRange(2); // Includes today
        displayPreprints(startDate, endDate, 'date_modified');
    });
    
    document.getElementById('last7days-edited').addEventListener('click', () => {
        const { startDate, endDate } = getDateRange(6); // Includes today
        displayPreprints(startDate, endDate, 'date_modified');
    });
    displayPreprints(startDate, endDate, 'date_created');
}


