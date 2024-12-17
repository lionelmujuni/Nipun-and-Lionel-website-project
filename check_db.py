from app import db, app
from app.models import User, BookmarkedRecipe, BookmarkedRestaurant
from sqlalchemy import inspect

with app.app_context():
    # Get inspector
    inspector = inspect(db.engine)
    
    # Print all tables in database
    print("\nAll tables in database:")
    print(inspector.get_table_names())

    # Print User data
    print("\nUsers in database:")
    users = User.query.all()
    for user in users:
        print(f"ID: {user.id}, Name: {user.name}, Email: {user.email}")

    # Print BookmarkedRecipe data
    print("\nBookmarked Recipes:")
    recipes = BookmarkedRecipe.query.all()
    for recipe in recipes:
        print(f"User ID: {recipe.user_id}")
        print(f"Title: {recipe.title}")
        print(f"Ready in: {recipe.ready_in_minutes} minutes")
        print(f"Servings: {recipe.servings}")
        print(f"URL: {recipe.source_url}")
        print("---")

    # Print BookmarkedRestaurant data
    print("\nBookmarked Restaurants:")
    restaurants = BookmarkedRestaurant.query.all()
    for restaurant in restaurants:
        print(f"User ID: {restaurant.user_id}")
        print(f"Name: {restaurant.name}")
        print(f"Rating: {restaurant.rating}")
        print(f"Price: {restaurant.price}")
        print(f"Address: {restaurant.address}")
        print("---") 