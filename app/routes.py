import requests
from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, current_user, logout_user, login_required
from app import app, db, bcrypt, login_manager
from app.models import User, FavouriteRecipe
from app.config import YELP_API_KEY, YELP_BASE_URL

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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

@app.route('/verify_email', methods=['GET', 'POST'])
def verify_email():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            flash('Welcome back! Please login to continue.', 'info')
            return redirect(url_for('login', email=email))
        else:
            return redirect(url_for('register', email=email))
    return render_template('verify_email.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = bcrypt.generate_password_hash(request.form['password']).decode('utf-8')
        user = User(name=name, email=email, password=password)
        db.session.add(user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/eat_out')
@login_required
def eat_out():
    return render_template('index.html')

@app.route('/eat_at_home', methods=['GET', 'POST'])
@login_required
def eat_at_home():
    recipes = []
    if request.method == 'POST':
        query = request.form['query']
        # For now, return empty recipes until we implement a recipe API
        flash('Recipe search functionality coming soon!', 'info')
    return render_template('recipes.html', recipes=recipes)

@app.route('/bookmark_recipe', methods=['POST'])
@login_required
def bookmark_recipe():
    data = request.get_json()
    new_recipe = FavouriteRecipe(
        user_id=current_user.id,
        title=data['title'],
        description=data.get('description'),
        image_url=data.get('image_url')
    )
    db.session.add(new_recipe)
    db.session.commit()
    return jsonify({'message': 'Recipe bookmarked successfully.'}), 200

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))