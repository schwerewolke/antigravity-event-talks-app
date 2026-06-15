import time
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache to prevent unnecessary external requests
cache = {
    'data': None,
    'last_updated': 0
}
CACHE_DURATION = 3600  # 1 hour in seconds

def parse_feed():
    try:
        # Fetch external feed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        return {"error": f"Failed to fetch feed: {str(e)}"}

    try:
        root = ET.fromstring(response.content)
        # Atom feed namespace
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        
        feed_title = root.find('atom:title', namespaces)
        feed_title_text = feed_title.text if feed_title is not None else "BigQuery Release Notes"

        entries = []
        for entry_elem in root.findall('atom:entry', namespaces):
            title_elem = entry_elem.find('atom:title', namespaces)
            id_elem = entry_elem.find('atom:id', namespaces)
            updated_elem = entry_elem.find('atom:updated', namespaces)
            link_elem = entry_elem.find('atom:link', namespaces)
            content_elem = entry_elem.find('atom:content', namespaces)

            title = title_elem.text if title_elem is not None else ""
            id_val = id_elem.text if id_elem is not None else ""
            updated = updated_elem.text if updated_elem is not None else ""
            
            # Extract alternate link
            link_href = ""
            if link_elem is not None:
                if link_elem.get('rel') == 'alternate':
                    link_href = link_elem.get('href')
                else:
                    link_href = link_elem.get('href')
            
            # If default link is empty or not the main release notes link, look closely
            for l in entry_elem.findall('atom:link', namespaces):
                if l.get('rel') == 'alternate':
                    link_href = l.get('href')
                    break

            content_html = content_elem.text if content_elem is not None else ""
            
            updates = []
            if content_html:
                soup = BeautifulSoup(content_html, 'html.parser')
                current_type = None
                current_parts = []

                # contents is a list of child elements
                for child in soup.contents:
                    if child.name == 'h3':
                        # Store previous update block if it exists
                        if current_type and current_parts:
                            html_content = "".join(str(c) for c in current_parts).strip()
                            text_content = "".join(c.get_text() if hasattr(c, 'get_text') else str(c) for c in current_parts).strip()
                            updates.append({
                                'type': current_type,
                                'html': html_content,
                                'text': text_content
                            })
                        current_type = child.get_text().strip()
                        current_parts = []
                    elif child.name is not None:
                        if current_type is None:
                            current_type = 'Announcement'
                        current_parts.append(child)
                    elif isinstance(child, str) and child.strip():
                        if current_type is None:
                            current_type = 'Announcement'
                        current_parts.append(child)

                # Store the final update block
                if current_type and current_parts:
                    html_content = "".join(str(c) for c in current_parts).strip()
                    text_content = "".join(c.get_text() if hasattr(c, 'get_text') else str(c) for c in current_parts).strip()
                    updates.append({
                        'type': current_type,
                        'html': html_content,
                        'text': text_content
                    })

            entries.append({
                'id': id_val,
                'date': title,
                'updated': updated,
                'link': link_href,
                'updates': updates
            })

        return {
            'title': feed_title_text,
            'entries': entries,
            'fetched_at': time.time()
        }

    except Exception as e:
        return {"error": f"Failed to parse XML: {str(e)}"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()

    if force_refresh or cache['data'] is None or (now - cache['last_updated']) > CACHE_DURATION:
        data = parse_feed()
        if 'error' not in data:
            cache['data'] = data
            cache['last_updated'] = now
        else:
            # If fetching failed, try returning older cache before erroring
            if cache['data'] is not None:
                return jsonify({
                    **cache['data'],
                    'warning': 'Using older cached data due to new fetch error',
                    'error_detail': data['error']
                })
            return jsonify(data), 500

    return jsonify(cache['data'])

if __name__ == '__main__':
    # Using 5001 to avoid default MacOS AirPlay Receiver port collision on 5000
    app.run(host='0.0.0.0', port=5001, debug=True)
