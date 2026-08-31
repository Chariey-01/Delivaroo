from flask_jwt_extended import jwt_required
from flask_restful import Resource

from app.models.weight_category import WeightCategory


def serialize_weight_category(category):
    return {
        "id": str(category.id),
        "name": category.name,
        "min_weight": str(category.min_weight),
        "max_weight": str(category.max_weight),
        "base_price": str(category.base_price),
        "price_per_km": str(category.price_per_km),
    }


class WeightCategoryListResource(Resource):
    @jwt_required()
    def get(self):
        categories = WeightCategory.query.order_by(WeightCategory.min_weight.asc()).all()
        return {"data": [serialize_weight_category(category) for category in categories]}, 200
