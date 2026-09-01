def test_weight_categories_are_available_to_authenticated_clients(
    client,
    auth_headers,
    sample_weight_category,
):
    response = client.get("/api/weight-categories", headers=auth_headers())

    assert response.status_code == 200
    categories = response.get_json()["data"]
    assert categories == [
        {
            "id": str(sample_weight_category.id),
            "name": sample_weight_category.name,
            "min_weight": "0.00",
            "max_weight": "5.00",
            "base_price": "100.00",
            "price_per_km": "10.00",
        }
    ]


def test_weight_categories_require_authentication(client):
    response = client.get("/api/weight-categories")

    assert response.status_code == 401
