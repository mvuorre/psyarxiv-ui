# PsyArXiv UI

Experimental alternative UI to [PsyArXiv](https://osf.io/preprints/psyarxiv).

## Local Development Setup

### Prerequisites

1. **Node.js and npm**: Ensure you have Node.js and npm installed. Download from [Node.js](https://nodejs.org/).
2. **Git**: Ensure you have Git installed. Download from [Git](https://git-scm.com/).

### Development Instructions

1. **Clone the Repository**:
```sh
git clone https://github.com/mvuorre/psyarxiv-ui.git
cd psyarxiv-ui
```

2. **Install Dependencies**:
```sh
npm install
```

3. **Start Development Server**:
```sh
node server.js
```

4. **View Application**: Open `http://localhost:PORT` in your browser (define PORT in .env).

## Production Deployment

We use systemctl and Caddy.