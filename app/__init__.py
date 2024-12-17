import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from pyfatsecret import Fatsecret
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
YELP_API_KEY = 'prL-BhV54opcGo6NqoHEqhAa8zdmnGWn1D3LjCH2nTgB9tNu8wvTrDbiE-Ju-VWeocXAHEkdXCCa0T4_urgKw4eVQkTJYj37P43C1GUpJElfx0Z1fNH53V8kIyxZZ3Yx' 
YELP_BASE_URL = 'https://api.yelp.com/v3/businesses/search'
CORS(app)

db = SQLAlchemy(app)
with app.app_context():
    db.create_all()

bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
fs = Fatsecret(client_id='your_client_id', client_secret='your_client_secret')

from app import routes