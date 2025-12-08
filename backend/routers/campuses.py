from flask import Blueprint, request
from database import get_db
from models import Campus

campuses_bp = Blueprint("campuses", __name__)


@campuses_bp.get("/")
def get_all():
    db = next(get_db())
    items = db.query(Campus).all()
    return {"items": [vars(i) for i in items]}


@campuses_bp.get("/<int:id>")
def get_one(id):
    db = next(get_db())
    item = db.query(Campus).filter(Campus.id == id).first()
    return {"item": vars(item) if item else None}


@campuses_bp.post("/")
def create():
    db = next(get_db())
    data = request.json or {}

    item = Campus(name=data["name"], region=data.get("region"))
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"message": "Created", "id": item.id}


@campuses_bp.put("/<int:id>")
def update(id):
    db = next(get_db())
    data = request.json or {}

    item = db.query(Campus).filter(Campus.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    item.name = data.get("name", item.name)
    item.region = data.get("region", item.region)

    db.commit()
    return {"message": "Updated"}


@campuses_bp.delete("/<int:id>")
def delete(id):
    db = next(get_db())
    item = db.query(Campus).filter(Campus.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
