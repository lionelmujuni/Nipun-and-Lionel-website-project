import requests
from urllib.parse import quote

API_KEY = '365023ab9add4a68892b474cd555966b'
BASE_URL = 'https://api.spoonacular.com/recipes'

def search_recipes(query):
    endpoint = f'{BASE_URL}/complexSearch'
    
    params = {
        'apiKey': API_KEY,
        'query': query,
        'number': 8,
        'addRecipeInformation': True,
        'fillIngredients': True,
        'instructionsRequired': True
    }
    
    try:
        print(f"\nMaking API request to Spoonacular...")  # Debug print
        print(f"Endpoint: {endpoint}")
        print(f"Query: {query}")
        
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        print(f"\nAPI Response status: {response.status_code}")  # Debug print
        
        recipes = []
        results = data.get('results', [])
        print(f"Found {len(results)} results")  # Debug print
        
        for recipe in results:
            recipe_data = {
                'title': recipe.get('title', 'No title'),
                'description': recipe.get('summary', 'No description').replace('<b>', '').replace('</b>', ''),
                'image_url': recipe.get('image', ''),
                'url': recipe.get('sourceUrl', '#'),
                'readyInMinutes': recipe.get('readyInMinutes', 'N/A'),
                'servings': recipe.get('servings', 'N/A')
            }
            recipes.append(recipe_data)
        
        return {'recipes': recipes}
    except requests.exceptions.RequestException as e:
        print(f"\nAPI request failed: {e}")  # Debug print
        print(f"Response content: {response.text if 'response' in locals() else 'No response'}")
        return {'recipes': []} 