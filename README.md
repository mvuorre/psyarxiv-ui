Alternative UI to [PsyArXiv](https://osf.io/preprints/psyarxiv). Early alpha and possibly abandoned. 

## Dependencies

- Node.js
- Express
- Axios
- Docker

## Local Development

1. **Install dependencies:**

```sh
npm install
```

2. **Start the server:**

```sh
node server.js
```

3. **Open your browser and go to:**

```
http://localhost:3000
```

## Containerization

1. **Build the Docker image:**

```sh
docker build -t psyarxiv-ui .
```

2. **Run the Docker container:**

```sh
docker run -p 3000:3000 psyarxiv-ui
```

3. **Open your browser and go to:**

```
http://localhost:3000
```

## License

This project is licensed under the MIT License.
