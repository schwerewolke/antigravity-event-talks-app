# BigQuery Release Hub 🚀

A modern, responsive web dashboard built with **Python Flask** and plain vanilla **HTML, CSS, and JavaScript** that fetches, parses, and formats the Google Cloud BigQuery Release Notes RSS Atom feed.

## Features
- **Live Syncing:** Fetches feed entries directly from the Google Cloud RSS feed, cache-controlled (1-hour in-memory cache) with a manual force refresh button.
- **Categorization:** Classifies and displays updates with distinct visual badges: `Feature`, `Breaking Change`, `Change`, `Announcement`, and `Issue`.
- **Overview Statistics:** Displays real-time counters of features, breaking changes, and issues found in the feed.
- **Search & Filters:** Instant search by keywords and filter notes by category or sort order (newest/oldest).
- **Tweet Composer:** Click any release card to select it, opening an interactive Composer drawer where you can generate customizable, styled tweets (Professional, Excited, Minimalist templates) and post directly to X (Twitter) using Twitter's Web Intent helper.

## Project Structure
- [app.py](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/app.py) - Flask Web server, cache coordinator, feed fetcher, and RSS XML parsing logic.
- [templates/index.html](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/templates/index.html) - HTML dashboard layout.
- [static/css/styles.css](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/static/css/styles.css) - Vanilla CSS styling and animations.
- [static/js/app.js](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/static/js/app.js) - App state, fuzzy search, active stats counters, and composer integration.

## How to Run Locally

### 1. Activate the Virtual Environment
```bash
source .venv/bin/activate
```

### 2. Install Dependencies (If not already installed)
```bash
pip install flask requests beautifulsoup4
```

### 3. Start the Flask Server
```bash
python3 app.py
```

### 4. View in Browser
Open your browser and navigate to:
[http://127.0.0.1:5001](http://127.0.0.1:5001)

*(Note: The server runs on port `5001` to avoid standard macOS AirPlay receiver port collisions on `5000`)*
