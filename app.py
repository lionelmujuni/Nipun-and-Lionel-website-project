from flask import Flask, request, jsonify, render_template
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Yelp API configuration
YELP_API_KEY = 'prL-BhV54opcGo6NqoHEqhAa8zdmnGWn1D3LjCH2nTgB9tNu8wvTrDbiE-Ju-VWeocXAHEkdXCCa0T4_urgKw4eVQkTJYj37P43C1GUpJElfx0Z1fNH53V8kIyxZZ3Yx' 
YELP_BASE_URL = 'https://api.yelp.com/v3/businesses/search'

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/restaurants')
def get_restaurants():
    city = request.args.get('city')
    
    if not city:
        return jsonify({'error': 'City parameter is required'}), 400

    headers = {
        'Authorization': f'Bearer {YELP_API_KEY}'
    }

    params = {
        'location': city,
        'term': 'restaurants',
        'sort_by': 'review_count',  # Sort by most reviewed
        'limit': 20  # Get top 20 results
    }

    try:
        response = requests.get(YELP_BASE_URL, headers=headers, params=params)
        data = response.json()

        if response.status_code == 200 and 'businesses' in data:
            # Extract relevant information for each restaurant
            restaurants = []
            for business in data['businesses']:
                restaurant = {
                    'name': business['name'],
                    'review_count': business['review_count'],
                    'rating': business['rating'],
                    'price': business.get('price', 'N/A'),
                    'address': ' '.join(business['location']['display_address']),
                    'coordinates': {
                        'lat': business['coordinates']['latitude'],
                        'lng': business['coordinates']['longitude']
                    },
                    'description': business.get('categories', [{}])[0].get('title', 'Restaurant'),  # Add category as description
                    'image_url': business.get('image_url', ''),  # Also getting image URL for better presentation
                    'url': business.get('url', '')  # Yelp URL for more details
                }
                restaurants.append(restaurant)

            # Print restaurants to console
            print(f"\nTop 20 Most Reviewed Restaurants in {city}:")
            for i, rest in enumerate(restaurants, 1):
                print(f"\n{i}. {rest['name']}")
                print(f"   Reviews: {rest['review_count']}")
                print(f"   Rating: {rest['rating']} stars")
                print(f"   Price: {rest['price']}")
                print(f"   Address: {rest['address']}")

            return jsonify({'restaurants': restaurants})

        else:
            return jsonify({'error': 'Could not fetch restaurants'}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    if not YELP_API_KEY:
        raise ValueError("YELP_API_KEY not found. Please add it to your .env file")
    app.run(debug=True) 