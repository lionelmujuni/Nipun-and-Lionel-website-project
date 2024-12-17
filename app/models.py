from app import db
from flask_login import UserMixin
from datetime import datetime

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    recipe_bookmarks = db.relationship(
        'BookmarkedRecipe',
        back_populates='user',
        lazy=True,
        cascade="all, delete-orphan"
    )
    restaurant_bookmarks = db.relationship(
        'BookmarkedRestaurant',
        back_populates='user',
        lazy=True,
        cascade="all, delete-orphan"
    )

class BookmarkedRecipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', back_populates='recipe_bookmarks')
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    ready_in_minutes = db.Column(db.Integer, nullable=True)
    servings = db.Column(db.Integer, nullable=True)
    source_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class BookmarkedRestaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', back_populates='restaurant_bookmarks')
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Float, nullable=True)
    review_count = db.Column(db.Integer, nullable=True)
    price = db.Column(db.String(10), nullable=True)
    address = db.Column(db.String(500), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    yelp_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)