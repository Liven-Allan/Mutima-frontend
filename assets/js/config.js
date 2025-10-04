// D:\Mutima\Application\frontend\assets\js\config.js

// Define the production API base URL
const PRODUCTION_API_BASE_URL = 'https://mutima-api.onrender.com'; // <-- REPLACE with your actual deployed backend URL

// Check the current host to determine the environment
const CURRENT_HOST = window.location.hostname;

let API_BASE_URL;

if (CURRENT_HOST === 'localhost' || CURRENT_HOST === '127.0.0.1') {
    // Local Development: Use the localhost URL
    API_BASE_URL = 'http://localhost:5000';
} else {
    // Production/Vercel Preview/Any Live Domain: Use the secure production URL
    API_BASE_URL = PRODUCTION_API_BASE_URL;
}

// You can optionally log it for debugging
// console.log("Using API Base URL:", API_BASE_URL);