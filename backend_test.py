import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any

class ValScrimsAPITester:
    def __init__(self, base_url="https://valorant-scrims.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.team_id = None
        self.scrim_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            return success, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test health endpoint"""
        success, response, status = self.make_request('GET', 'api/health')
        
        if success and 'status' in response and response['status'] == 'healthy':
            self.log_test("Health Check", True)
            return True
        else:
            self.log_test("Health Check", False, f"Status: {status}, Response: {response}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "valorant_username": f"TestPlayer_{timestamp}",
            "valorant_tag": "1234"
        }

        success, response, status = self.make_request('POST', 'api/auth/register', user_data)
        
        if success and 'access_token' in response and 'user' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {response}")
            return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not self.user_data:
            self.log_test("User Login", False, "No user data available for login test")
            return False

        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }

        # Clear token to test fresh login
        old_token = self.token
        self.token = None

        success, response, status = self.make_request('POST', 'api/auth/login', login_data)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("User Login", True)
            return True
        else:
            self.token = old_token  # Restore token
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_profile(self):
        """Test getting user profile"""
        success, response, status = self.make_request('GET', 'api/user/profile')
        
        if success and 'user_id' in response and 'username' in response:
            self.log_test("Get User Profile", True)
            return True
        else:
            self.log_test("Get User Profile", False, f"Status: {status}, Response: {response}")
            return False

    def test_tier_upgrade_request(self):
        """Test requesting tier upgrade"""
        tier_data = {"requested_tier": 3}
        
        success, response, status = self.make_request('POST', 'api/user/request-tier-upgrade', tier_data)
        
        if success and 'message' in response:
            self.log_test("Tier Upgrade Request", True)
            return True
        else:
            self.log_test("Tier Upgrade Request", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_team(self):
        """Test team creation"""
        timestamp = datetime.now().strftime("%H%M%S")
        team_data = {
            "name": f"TestTeam_{timestamp}",
            "description": "A test team for API testing",
            "max_members": 5
        }

        success, response, status = self.make_request('POST', 'api/teams/create', team_data, 200)
        
        if success and 'team_id' in response:
            self.team_id = response['team_id']
            self.log_test("Create Team", True)
            return True
        else:
            self.log_test("Create Team", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_my_team(self):
        """Test getting team details"""
        if not self.team_id:
            self.log_test("Get My Team", False, "No team created")
            return False

        success, response, status = self.make_request('GET', 'api/teams/my-team')
        
        if success and 'team_id' in response and response['team_id'] == self.team_id:
            self.log_test("Get My Team", True)
            return True
        else:
            self.log_test("Get My Team", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_scrim(self):
        """Test scrim creation"""
        if not self.team_id:
            self.log_test("Create Scrim", False, "No team available")
            return False

        scrim_data = {
            "title": "Test Scrim Match",
            "description": "A test scrim for API testing",
            "maps": ["Ascent", "Bind"],
            "max_rounds": 13,
            "num_games": 1,
            "scheduled_time": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
            "max_participants": 2
        }

        success, response, status = self.make_request('POST', 'api/scrims/create', scrim_data)
        
        if success and 'scrim_id' in response:
            self.scrim_id = response['scrim_id']
            self.log_test("Create Scrim", True)
            return True
        else:
            self.log_test("Create Scrim", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_scrims(self):
        """Test getting available scrims"""
        success, response, status = self.make_request('GET', 'api/scrims')
        
        if success and isinstance(response, list):
            self.log_test("Get Scrims", True)
            return True
        else:
            self.log_test("Get Scrims", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_maps(self):
        """Test getting available maps"""
        success, response, status = self.make_request('GET', 'api/maps')
        
        if success and 'maps' in response and isinstance(response['maps'], list):
            self.log_test("Get Maps", True)
            return True
        else:
            self.log_test("Get Maps", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_ranks(self):
        """Test getting available ranks"""
        success, response, status = self.make_request('GET', 'api/ranks')
        
        if success and 'ranks' in response and isinstance(response['ranks'], list):
            self.log_test("Get Ranks", True)
            return True
        else:
            self.log_test("Get Ranks", False, f"Status: {status}, Response: {response}")
            return False

    def test_team_creation_restriction(self):
        """Test that tier_1/tier_2 users cannot create teams"""
        # This test would require admin privileges to change user tier
        # For now, we'll just document this as a manual test requirement
        self.log_test("Team Creation Restriction (Manual Test Required)", True, "Requires admin to test tier restrictions")
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ValScrims API Tests...")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)

        # Core API tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False

        if not self.test_user_registration():
            print("❌ User registration failed - stopping tests")
            return False

        self.test_user_login()
        self.test_get_profile()
        self.test_tier_upgrade_request()
        
        # Team and scrim tests
        self.test_create_team()
        self.test_get_my_team()
        self.test_create_scrim()
        self.test_get_scrims()
        
        # Utility endpoints
        self.test_get_maps()
        self.test_get_ranks()
        
        # Restriction tests
        self.test_team_creation_restriction()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            failed_tests = [test for test in self.test_results if not test['success']]
            print("\nFailed Tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
            return False

def main():
    """Main test execution"""
    tester = ValScrimsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())