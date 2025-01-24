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

4. **View Application**: Open `http://localhost:3000` in your browser.

## Production Deployment

### Prerequisites

1. Install PM2 globally:
```sh
sudo npm install -g pm2
```

### Deployment Instructions

1. **Start Application**:
```sh
pm2 start server.js --name psyarxiv
```

2. **Configure Auto-start** (replace USERNAME with your system username):
```sh
sudo pm2 startup ubuntu -u USERNAME
pm2 save
```

### PM2 Management Commands

- View status: `pm2 status`
- View logs: `pm2 logs`
- Restart application: `pm2 restart psyarxiv`
- Stop application: `pm2 stop psyarxiv`