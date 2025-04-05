const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(limiter);

// Serve static files
app.use('/css', express.static(path.join(__dirname, 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js')));
app.use('/images', express.static(path.join(__dirname, 'frontend', 'images')));

// Cache for politician data to reduce API calls
const politicianCache = {};

// API Routes
app.post('/api/search-politician', async (req, res) => {
    try {
        const { name, state, additionalInfo } = req.body;
        
        if (!name && !state && !additionalInfo) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one search parameter.'
            });
        }
        
        // Create a combined search query for GPT
        const searchQuery = `
            Find a politician currently in federal, state, or local office in the United States based on the following information:
            Name: ${name || 'Not provided'}
            State: ${state || 'Not provided'}
            Additional Information: ${additionalInfo || 'Not provided'}
            
            Respond with a JSON object that includes the politician's full name, title (current position), state, and a unique ID that could be used to identify them (like their full name with no spaces). If you cannot confidently identify a politician based on this information, respond with a JSON object with success: false and a message explaining why.
        `;
        
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that specializes in identifying U.S. politicians based on user queries. You only respond with valid JSON."
                },
                {
                    role: "user",
                    content: searchQuery
                }
            ],
            response_format: { type: "json_object" }
        });
        
        const responseContent = completion.choices[0].message.content;
        const politicianData = JSON.parse(responseContent);
        
        if (politicianData.success === false) {
            return res.json({
                success: false,
                message: politicianData.message || 'Could not identify a politician with the provided information.'
            });
        }
        
        // If politician is found, try to get their photo
        const photoUrl = await getPoliticianPhoto(politicianData.name);
        
        // Create a politician object with basic info
        const politician = {
            id: politicianData.id || politicianData.name.replace(/\s+/g, '').toLowerCase(),
            name: politicianData.name,
            title: politicianData.title,
            state: politicianData.state,
            photoUrl: photoUrl || '/images/default-profile.png' // Use a default image if no photo is found
        };
        
        // Cache the basic politician data
        politicianCache[politician.id] = {
            ...politician,
            lastUpdated: Date.now()
        };
        
        return res.json({
            success: true,
            politician
        });
        
    } catch (error) {
        console.error('Search politician error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request.'
        });
    }
});

app.post('/api/refine-search', async (req, res) => {
    try {
        const { name, state, additionalInfo, refineInfo } = req.body;
        
        // Create a combined search query for GPT with the refined information
        const searchQuery = `
            Find a politician currently in federal, state, or local office in the United States based on the following information:
            Name: ${name || 'Not provided'}
            State: ${state || 'Not provided'}
            Additional Information: ${additionalInfo || 'Not provided'}
            Additional Refinement Details: ${refineInfo || 'Not provided'}
            
            Respond with a JSON object that includes the politician's full name, title (current position), state, and a unique ID that could be used to identify them (like their full name with no spaces). If you cannot confidently identify a politician based on this information, respond with a JSON object with success: false and a message explaining why.
        `;
        
        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that specializes in identifying U.S. politicians based on user queries. You only respond with valid JSON."
                },
                {
                    role: "user",
                    content: searchQuery
                }
            ],
            response_format: { type: "json_object" }
        });
        
        const responseContent = completion.choices[0].message.content;
        const politicianData = JSON.parse(responseContent);
        
        if (politicianData.success === false) {
            return res.json({
                success: false,
                message: politicianData.message || 'Could not identify a politician with the provided information.'
            });
        }
        
        // If politician is found, try to get their photo
        const photoUrl = await getPoliticianPhoto(politicianData.name);
        
        // Create a politician object with basic info
        const politician = {
            id: politicianData.id || politicianData.name.replace(/\s+/g, '').toLowerCase(),
            name: politicianData.name,
            title: politicianData.title,
            state: politicianData.state,
            photoUrl: photoUrl || '/images/default-profile.png' // Use a default image if no photo is found
        };
        
        // Cache the basic politician data
        politicianCache[politician.id] = {
            ...politician,
            lastUpdated: Date.now()
        };
        
        return res.json({
            success: true,
            politician
        });
        
    } catch (error) {
        console.error('Refine search error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request.'
        });
    }
});

app.get('/api/politician-details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if we have cached data that's not too old
        const cachedData = politicianCache[id];
        const cacheMaxAge = 1000 * 60 * 60; // 1 hour
        
        if (cachedData && 
            cachedData.fullDetails && 
            Date.now() - cachedData.lastUpdated < cacheMaxAge) {
            return res.json({
                success: true,
                politician: cachedData
            });
        }
        
        // If not cached or cache is old, we need to fetch full details
        // First check if we have basic info
        if (!cachedData) {
            return res.status(404).json({
                success: false,
                message: 'Politician not found. Please search again.'
            });
        }
        
        // Get full details from GPT-4o-mini
        const detailsQuery = `
            Provide comprehensive details about the politician: ${cachedData.name}, who is the ${cachedData.title} from ${cachedData.state}.
            
            Include the following information in JSON format:
            1. A brief biography/background (1-3 paragraphs)
            2. Their approximate age
            3. Campaign donation history from OpenSecrets (create a realistic list of top donors)
            4. Whether they have received donations from AIPAC or other pro-Israel advocacy groups, and how much if applicable
            5. Links to their social media accounts, especially Twitter/X if they have one
            
            Format everything as a valid JSON object.
        `;
        
        // Call OpenAI API for details
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that provides comprehensive information about U.S. politicians. You only respond with valid JSON."
                },
                {
                    role: "user",
                    content: detailsQuery
                }
            ],
            response_format: { type: "json_object" }
        });
        
        const detailsContent = completion.choices[0].message.content;
        const politicianDetails = JSON.parse(detailsContent);
        
        // Get recent news articles
        const newsArticles = await getRecentNews(cachedData.name);
        
        // Get recent tweets if Twitter/X handle is available
        let recentTweets = [];
        if (politicianDetails.twitter) {
            recentTweets = await getRecentTweets(politicianDetails.twitter);
        }
        
        // Combine all data
        const fullPolitician = {
            ...cachedData,
            biography: politicianDetails.biography,
            age: politicianDetails.age,
            donations: politicianDetails.donations || [],
            israelDonations: politicianDetails.israelDonations || [],
            socialMedia: politicianDetails.socialMedia || {},
            news: newsArticles,
            tweets: recentTweets,
            fullDetails: true,
            lastUpdated: Date.now()
        };
        
        // Update cache
        politicianCache[id] = fullPolitician;
        
        return res.json({
            success: true,
            politician: fullPolitician
        });
        
    } catch (error) {
        console.error('Politician details error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching politician details.'
        });
    }
});

// Helper function to get politician photo
async function getPoliticianPhoto(name) {
    try {
        // Use GPT-4o-mini to get a photo URL
        const photoQuery = `Find a publicly available photo URL for U.S. politician ${name}. Respond with just the URL, no additional text.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that finds official photos of U.S. politicians. Provide only the direct image URL with no other text."
                },
                {
                    role: "user",
                    content: photoQuery
                }
            ]
        });
        
        const photoUrl = completion.choices[0].message.content.trim();
        
        // Verify that the URL points to an image
        const response = await axios.head(photoUrl);
        const contentType = response.headers['content-type'];
        
        if (contentType && contentType.startsWith('image/')) {
            return photoUrl;
        } else {
            // If not an image, return default
            return '/images/default-profile.png';
        }
    } catch (error) {
        console.error('Error getting politician photo:', error);
        return '/images/default-profile.png';
    }
}

// Helper function to get recent news articles
async function getRecentNews(politicianName) {
    try {
        const newsQuery = `Find 3 recent news articles about U.S. politician ${politicianName}. For each article, provide the title, date published, a brief summary, and URL. Format as JSON.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that finds recent news articles about U.S. politicians. Provide information in valid JSON format."
                },
                {
                    role: "user",
                    content: newsQuery
                }
            ],
            response_format: { type: "json_object" }
        });
        
        const newsContent = completion.choices[0].message.content;
        const newsData = JSON.parse(newsContent);
        
        return newsData.articles || [];
    } catch (error) {
        console.error('Error getting news articles:', error);
        return [];
    }
}

// Helper function to get recent tweets
async function getRecentTweets(twitterHandle) {
    try {
        const tweetsQuery = `Find 3 recent tweets by ${twitterHandle} on Twitter/X. For each tweet, provide the text content and date posted. Format as JSON.`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that finds recent tweets by U.S. politicians. Provide information in valid JSON format."
                },
                {
                    role: "user",
                    content: tweetsQuery
                }
            ],
            response_format: { type: "json_object" }
        });
        
        const tweetsContent = completion.choices[0].message.content;
        const tweetsData = JSON.parse(tweetsContent);
        
        return tweetsData.tweets || [];
    } catch (error) {
        console.error('Error getting tweets:', error);
        return [];
    }
}

// Serve main HTML file for all other routes (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
