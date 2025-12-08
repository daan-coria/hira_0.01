from flask import Flask
from flask_cors import CORS

from database import Base, engine

# Import Blueprints
from routers.campuses import campuses_bp
from routers.departments import departments_bp
from routers.shift_templates import shift_templates_bp
from routers.employees import employees_bp
from routers.resource_types import resource_types_bp

app = Flask(__name__)
CORS(app)

# Create tables on startup (safe for production)
Base.metadata.create_all(bind=engine)

# Register routes
app.register_blueprint(campuses_bp, url_prefix="/api/v1/campuses")
app.register_blueprint(departments_bp, url_prefix="/api/v1/departments")
app.register_blueprint(shift_templates_bp, url_prefix="/api/v1/default-shifts")
app.register_blueprint(employees_bp, url_prefix="/api/v1/employees")
app.register_blueprint(resource_types_bp, url_prefix="/api/v1/resource-types")

@app.get("/api/v1/health")
def health():
    return {"status": "OK"}

if __name__ == "__main__":
    app.run(port=5001, debug=True)
