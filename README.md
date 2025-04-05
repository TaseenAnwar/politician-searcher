# Politician Searcher

A web application that allows users to search for and view detailed information about U.S. politicians at federal, state, and local levels.

## Features

- Search politicians by name, state, and additional details
- Refine search results if needed
- View detailed politician profiles including:
  - Biography and background
  - Age and current position
  - Campaign donation history from OpenSecrets
  - Donations from pro-Israel advocacy groups
  - Recent news articles
  - Recent tweets

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **APIs**: OpenAI (GPT-4o-mini)
- **Deployment**: GitHub, Render.com

## Project Structure

```
politician-searcher/
│
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # CSS styles
│   ├── js/
│   │   └── script.js     # Frontend JavaScript
│   └── images/           # Image assets
│       └── default-profile.png  # Default profile image
│
├── server.js             # Express server and API routes
├── package.json          # Node.js dependencies
├── .env                  # Environment variables (not committed to Git)
├── .gitignore            # Git ignore file
└── README.md             # Project documentation
```

## Setup and Installation

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd politician-searcher
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=production
   ```

4. Create the necessary directory structure:
   ```
   mkdir -p frontend/css frontend/js frontend/images
   ```

5. Move the files to their respective directories:
   - `index.html` → `frontend/index.html`
   - `style.css` → `frontend/css/style.css`
   - `script.js` → `frontend/js/script.js`

6. Add a default profile image:
   - Save a default profile image as `frontend/images/default-profile.png`

## Running Locally

Start the development server:

```
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deployment to Render.com

1. Push your code to GitHub:
   ```
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Create a new Web Service on Render.com:
   - Connect your GitHub repository
   - Specify the build command: `npm install`
   - Specify the start command: `npm start`
   - Add the environment variables from your `.env` file

3. Deploy the service and wait for the build to complete.

## Extending the Project

If you want to implement the Grok API integration for tweets about Israel, Palestine, Gaza, Hamas, or AIPAC, you would need to:

1. Obtain API access to Grok
2. Add a new endpoint in `server.js` that calls the Grok API
3. Update the frontend to display these results

Note: Currently, there is no public Grok API available for this purpose. If Elon Musk's X/Twitter does release a Grok API in the future, it could potentially be integrated to analyze politician tweets for specific topics.

## License

MIT

## Disclaimer

This application uses OpenAI's GPT models to generate information about politicians. While we strive for accuracy, the information provided should be verified through official sources. The application is for educational and informational purposes only.
