# YouTube OAuth Test Page

A simple, single-page application to retrieve and display all available data from your YouTube account using the YouTube Data API v3 and Google OAuth 2.0.

## Features

- **Complete OAuth 2.0 Flow**: Secure authentication with Google
- **Comprehensive Data Retrieval**: Fetches multiple types of data from your YouTube account:
  - Channel information and statistics
  - Playlists
  - Subscriptions
  - Uploaded videos
  - Recent activities
- **Beautiful UI**: Modern, responsive design with YouTube branding
- **Raw Data View**: Expandable sections to view complete JSON responses
- **Local Configuration**: Saves your API credentials in browser localStorage

## Setup Instructions

### Step 1: Create Google Cloud Project and Enable YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen if prompted:
   - Choose "External" user type
   - Fill in the required fields (app name, user support email, developer email)
   - Add scopes: `youtube.readonly`, `youtube.force-ssl`, `youtubepartner`
   - Add test users (your own Google account email)
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "YouTube OAuth Test"
   - Authorized JavaScript origins: Add the origin where you'll host this file
     - For local testing: `http://localhost:8000` or `http://127.0.0.1:8000`
     - For file protocol: `file://` (Note: may have limitations)
   - Authorized redirect URIs: Same as origins
   - Click "Create"
5. Copy the **Client ID**

### Step 3: Create API Key

1. In "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the **API Key**
4. (Optional) Restrict the API key:
   - Click on the API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Save

### Step 4: Run the Test Page

#### Option 1: Using Python's Built-in Server (Recommended)

```bash
# Navigate to the project directory
cd /home/user/Project-Wonderwall

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and go to: `http://localhost:8000/youtube-oauth-test.html`

#### Option 2: Using Node.js http-server

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

Then open your browser and go to: `http://localhost:8000/youtube-oauth-test.html`

#### Option 3: Open Directly in Browser

Simply open the `youtube-oauth-test.html` file in your web browser. Note that some browsers may have restrictions with the file:// protocol for OAuth.

### Step 5: Configure and Use

1. Open the test page in your browser
2. Enter your **Client ID** and **API Key** in the configuration section
3. Click "Save Configuration"
4. Click "Sign In with Google"
5. Authorize the application (you may see a warning if the app is not verified - click "Advanced" and proceed)
6. Click "Fetch YouTube Data" to retrieve all available data
7. Explore the displayed data!

## What Data is Retrieved?

The test page fetches the following data from your YouTube account:

### Channel Information
- Channel name, description, and thumbnail
- Custom URL and country
- Creation date
- Branding settings and topic details

### Channel Statistics
- Subscriber count
- Total video count
- Total view count

### Playlists
- All your playlists with titles, descriptions, and thumbnails
- Item counts and privacy status

### Subscriptions
- Channels you're subscribed to
- Channel thumbnails and descriptions

### Uploaded Videos
- Your uploaded videos with titles and thumbnails
- Descriptions and publish dates

### Recent Activities
- Your recent YouTube activities
- Activity types and timestamps

## Security Notes

- Your API credentials are stored only in your browser's localStorage
- The access token is only valid for a limited time
- You can revoke access at any time by clicking "Sign Out"
- You can revoke app access completely from your [Google Account Settings](https://myaccount.google.com/permissions)

## Troubleshooting

### "Access blocked: Authorization Error"
- Make sure your OAuth consent screen is properly configured
- Add your email as a test user in the OAuth consent screen
- Ensure the redirect URI in Google Cloud Console matches your test page URL

### "Invalid Client ID"
- Double-check that you copied the correct Client ID
- Make sure the Client ID is for a Web application type

### "API key not valid"
- Verify the API key is correct
- Check that the YouTube Data API v3 is enabled for your project
- If you restricted the key, ensure it's allowed for YouTube Data API v3

### No data displayed
- Check the browser console (F12) for error messages
- Ensure you've granted all requested permissions during OAuth
- Verify that your YouTube account has the data you're trying to retrieve

## API Quotas

The YouTube Data API has quota limits. Each request costs quota units:
- This test page makes approximately 5-10 API calls
- Default quota: 10,000 units per day
- Monitor your quota usage in Google Cloud Console

## License

This is a test/demo page. Feel free to modify and use as needed.

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
