"""
Backend API tests for Microsoft 365 MSAL.js authentication endpoint
Tests the /api/auth/microsoft/authenticate endpoint with mock data
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMicrosoftAuthConfig:
    """Tests for Microsoft OAuth configuration endpoint"""
    
    def test_get_microsoft_config(self, api_client):
        """Test that Microsoft OAuth config endpoint returns expected data"""
        response = api_client.get(f"{BASE_URL}/api/auth/microsoft/config")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "client_id" in data
        assert "tenant_id" in data
        assert "redirect_uri" in data
        assert "auth_url" in data
        assert "google_form_url" in data
        assert "allowed_domain" in data
        
        # Verify allowed domain is wolmers.org
        assert data["allowed_domain"] == "wolmers.org"


class TestMicrosoftAuthenticate:
    """Tests for MSAL.js authentication endpoint /api/auth/microsoft/authenticate"""
    
    def test_authenticate_valid_wolmers_email_new_user(self, api_client):
        """Test authentication with valid @wolmers.org email creates new user"""
        test_email = f"test.student.{uuid.uuid4().hex[:8]}@wolmers.org"
        test_name = "Test Student"
        test_ms_id = str(uuid.uuid4())
        
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": test_email,
            "name": test_name,
            "microsoft_id": test_ms_id,
            "id_token": "mock_id_token"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert len(data["access_token"]) > 0
        
        # Verify user data
        user = data["user"]
        assert user["email"] == test_email.lower()
        assert user["full_name"] == test_name
        assert user["role"] == "student"
        assert "id" in user
        assert "created_at" in user
    
    def test_authenticate_valid_wolmers_email_existing_user(self, api_client):
        """Test authentication with existing @wolmers.org user returns valid token"""
        test_email = f"test.existing.{uuid.uuid4().hex[:8]}@wolmers.org"
        test_name = "Existing Student"
        test_ms_id = str(uuid.uuid4())
        
        # First authentication - creates user
        response1 = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": test_email,
            "name": test_name,
            "microsoft_id": test_ms_id,
            "id_token": "mock_id_token"
        })
        assert response1.status_code == 200
        user_id_first = response1.json()["user"]["id"]
        
        # Second authentication - logs in existing user
        response2 = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": test_email,
            "name": test_name,
            "microsoft_id": test_ms_id,
            "id_token": "mock_id_token"
        })
        assert response2.status_code == 200
        user_id_second = response2.json()["user"]["id"]
        
        # Verify same user ID returned (not a new user)
        assert user_id_first == user_id_second
    
    def test_authenticate_invalid_email_domain_rejected(self, api_client):
        """Test that non-wolmers.org emails are rejected with 403"""
        invalid_emails = [
            "test@gmail.com",
            "student@outlook.com",
            "user@school.edu",
            "admin@company.org",
            "test@wolmers.com",  # Similar but not .org
            "test@sub.wolmers.org",  # Subdomain not allowed
        ]
        
        for email in invalid_emails:
            response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
                "email": email,
                "name": "Test User",
                "microsoft_id": str(uuid.uuid4()),
                "id_token": "mock_id_token"
            })
            
            assert response.status_code == 403, f"Expected 403 for {email}, got {response.status_code}"
            assert "wolmers.org" in response.json()["detail"].lower()
    
    def test_authenticate_email_domain_case_insensitive(self, api_client):
        """Test that email domain validation is case insensitive"""
        test_email_upper = f"TEST.STUDENT.{uuid.uuid4().hex[:8]}@WOLMERS.ORG"
        test_email_mixed = f"Test.Student.{uuid.uuid4().hex[:8]}@WoLmErS.oRg"
        
        for email in [test_email_upper, test_email_mixed]:
            response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
                "email": email,
                "name": "Test Student",
                "microsoft_id": str(uuid.uuid4()),
                "id_token": "mock_id_token"
            })
            
            assert response.status_code == 200, f"Failed for email: {email}"
            # Email should be lowercased in response
            assert response.json()["user"]["email"] == email.lower()
    
    def test_authenticate_missing_required_fields(self, api_client):
        """Test that missing required fields return 422 validation error"""
        # Missing email
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "name": "Test User",
            "microsoft_id": str(uuid.uuid4()),
        })
        assert response.status_code == 422
        
        # Missing name
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": "test@wolmers.org",
            "microsoft_id": str(uuid.uuid4()),
        })
        assert response.status_code == 422
        
        # Missing microsoft_id
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": "test@wolmers.org",
            "name": "Test User",
        })
        assert response.status_code == 422
    
    def test_authenticate_invalid_email_format(self, api_client):
        """Test that invalid email formats are rejected"""
        invalid_emails = [
            "notanemail",
            "missing@domain",
            "@wolmers.org",
            "test@",
        ]
        
        for email in invalid_emails:
            response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
                "email": email,
                "name": "Test User",
                "microsoft_id": str(uuid.uuid4()),
            })
            assert response.status_code == 422, f"Expected 422 for invalid email: {email}"
    
    def test_authenticate_jwt_token_valid(self, api_client):
        """Test that returned JWT token can be used to access protected endpoints"""
        test_email = f"test.jwt.{uuid.uuid4().hex[:8]}@wolmers.org"
        
        # Authenticate
        auth_response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": test_email,
            "name": "JWT Test User",
            "microsoft_id": str(uuid.uuid4()),
            "id_token": "mock_id_token"
        })
        assert auth_response.status_code == 200
        token = auth_response.json()["access_token"]
        
        # Use token to access /auth/me endpoint
        me_response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == test_email.lower()
    
    def test_authenticate_optional_id_token(self, api_client):
        """Test that id_token is optional (nullable field)"""
        test_email = f"test.notoken.{uuid.uuid4().hex[:8]}@wolmers.org"
        
        # Without id_token
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": test_email,
            "name": "No Token User",
            "microsoft_id": str(uuid.uuid4()),
        })
        
        assert response.status_code == 200
        assert "access_token" in response.json()


class TestMicrosoftAuthUserRole:
    """Tests for user role assignment in Microsoft OAuth flow"""
    
    def test_new_microsoft_user_assigned_student_role(self, api_client):
        """Test that new users created via Microsoft OAuth are assigned student role"""
        test_email = f"test.role.{uuid.uuid4().hex[:8]}@wolmers.org"
        
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": test_email,
            "name": "Role Test Student",
            "microsoft_id": str(uuid.uuid4()),
        })
        
        assert response.status_code == 200
        assert response.json()["user"]["role"] == "student"
    
    def test_existing_admin_retains_role(self, api_client):
        """Test that existing admin user retains admin role when logging in via Microsoft"""
        # First, login as admin to verify admin exists
        admin_login = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wolmers.org",
            "password": "Admin123!"
        })
        
        if admin_login.status_code != 200:
            pytest.skip("Admin user not available for testing")
        
        # Now test Microsoft auth with admin email
        response = api_client.post(f"{BASE_URL}/api/auth/microsoft/authenticate", json={
            "email": "admin@wolmers.org",
            "name": "Admin User",
            "microsoft_id": str(uuid.uuid4()),
        })
        
        assert response.status_code == 200
        # Admin should retain admin role
        assert response.json()["user"]["role"] == "admin"
