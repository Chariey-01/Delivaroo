def test_cors_allows_local_vite_origin(client):
    response = client.options(
        "/api/parcels",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert "Authorization" in response.headers["Access-Control-Allow-Headers"]
    assert "Content-Type" in response.headers["Access-Control-Allow-Headers"]
    assert "POST" in response.headers["Access-Control-Allow-Methods"]


def test_cors_rejects_unconfigured_origin(client):
    response = client.options(
        "/api/parcels",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert "Access-Control-Allow-Origin" not in response.headers
