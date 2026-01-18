"""
Backend API Tests for Wallet Alerts & Watchlist (P0)
Tests:
- Wallet Alert creation with correct trigger types
- TrackWallet (watchlist) functionality
- Token search/resolve functionality
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Valid wallet trigger types from backend enum
VALID_WALLET_TRIGGERS = [
    'accumulation',
    'distribution', 
    'large_move',
    'smart_money_entry',
    'smart_money_exit',
    'net_flow_spike',
    'activity_spike'
]

# Test wallet addresses
TEST_WALLET = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'  # Vitalik.eth
TEST_TOKEN = '0xdac17f958d2ee523a2206206994597c13d831ec7'  # USDT


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✓ Health check passed: {response.json()}")


class TestWalletAlertCreation:
    """Test wallet alert creation with correct trigger types"""
    
    def test_create_wallet_alert_accumulation(self):
        """Test creating wallet alert with 'accumulation' trigger type"""
        payload = {
            "scope": "wallet",
            "targetId": TEST_WALLET,
            "triggerTypes": ["accumulation"],
            "trigger": {
                "type": "accumulation",
                "threshold": 10000,
                "direction": "in",
                "window": "6h"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "minSeverity": 50,
            "minConfidence": 0.6,
            "throttle": "6h",
            "name": "TEST_Vitalik Accumulation Alert",
            "targetMeta": {
                "label": "Vitalik.eth",
                "address": TEST_WALLET,
                "chain": "Ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.json()}")
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("ok") == True
        assert "data" in data
        
        rule = data["data"]
        assert rule["scope"] == "wallet"
        assert rule["targetId"] == TEST_WALLET.lower()
        assert "accumulation" in rule["triggerTypes"]
        assert rule["watchlistItemId"] is not None, "watchlistItemId should be auto-created"
        
        # Store rule ID for cleanup
        self.__class__.created_rule_id = rule.get("_id")
        print(f"✓ Created wallet alert with accumulation trigger: {rule['_id']}")
        
    def test_create_wallet_alert_distribution(self):
        """Test creating wallet alert with 'distribution' trigger type"""
        payload = {
            "scope": "wallet",
            "targetId": TEST_WALLET,
            "triggerTypes": ["distribution"],
            "trigger": {
                "type": "distribution",
                "threshold": 50000,
                "direction": "out",
                "window": "24h"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "name": "TEST_Vitalik Distribution Alert"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("ok") == True
        assert "distribution" in data["data"]["triggerTypes"]
        
        self.__class__.distribution_rule_id = data["data"].get("_id")
        print(f"✓ Created wallet alert with distribution trigger")
        
    def test_create_wallet_alert_large_move(self):
        """Test creating wallet alert with 'large_move' trigger type"""
        payload = {
            "scope": "wallet",
            "targetId": TEST_WALLET,
            "triggerTypes": ["large_move"],
            "trigger": {
                "type": "large_move",
                "threshold": 100000
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "name": "TEST_Vitalik Large Move Alert"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("ok") == True
        assert "large_move" in data["data"]["triggerTypes"]
        
        self.__class__.large_move_rule_id = data["data"].get("_id")
        print(f"✓ Created wallet alert with large_move trigger")
        
    def test_create_wallet_alert_smart_money_entry(self):
        """Test creating wallet alert with 'smart_money_entry' trigger type"""
        payload = {
            "scope": "wallet",
            "targetId": TEST_WALLET,
            "triggerTypes": ["smart_money_entry"],
            "trigger": {
                "type": "smart_money_entry",
                "window": "6h"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "name": "TEST_Vitalik Smart Money Entry Alert"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("ok") == True
        assert "smart_money_entry" in data["data"]["triggerTypes"]
        
        self.__class__.smart_money_rule_id = data["data"].get("_id")
        print(f"✓ Created wallet alert with smart_money_entry trigger")
        
    def test_create_wallet_alert_activity_spike(self):
        """Test creating wallet alert with 'activity_spike' trigger type"""
        payload = {
            "scope": "wallet",
            "targetId": TEST_WALLET,
            "triggerTypes": ["activity_spike"],
            "trigger": {
                "type": "activity_spike",
                "threshold": 5,
                "window": "1h"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "name": "TEST_Vitalik Activity Spike Alert"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("ok") == True
        assert "activity_spike" in data["data"]["triggerTypes"]
        
        self.__class__.activity_spike_rule_id = data["data"].get("_id")
        print(f"✓ Created wallet alert with activity_spike trigger")


class TestWatchlistAPI:
    """Test watchlist (Track Wallet) functionality"""
    
    def test_add_wallet_to_watchlist(self):
        """Test adding wallet to watchlist"""
        payload = {
            "type": "wallet",
            "target": {
                "address": TEST_WALLET,
                "chain": "ethereum",
                "name": "Vitalik.eth"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/watchlist",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Add to watchlist response: {response.status_code} - {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("ok") == True
        assert data["data"]["type"] == "wallet"
        assert data["data"]["target"]["address"].lower() == TEST_WALLET.lower()
        
        self.__class__.watchlist_item_id = data["data"].get("_id")
        print(f"✓ Added wallet to watchlist: {self.__class__.watchlist_item_id}")
        
    def test_get_wallet_watchlist(self):
        """Test getting wallet watchlist"""
        response = requests.get(f"{BASE_URL}/api/watchlist?type=wallet")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert "data" in data
        assert isinstance(data["data"], list)
        
        # Check if our test wallet is in the list
        wallet_addresses = [item["target"]["address"].lower() for item in data["data"]]
        assert TEST_WALLET.lower() in wallet_addresses, "Test wallet should be in watchlist"
        
        print(f"✓ Got wallet watchlist with {len(data['data'])} items")
        
    def test_get_watchlist_item_by_id(self):
        """Test getting single watchlist item"""
        if not hasattr(self.__class__, 'watchlist_item_id'):
            pytest.skip("No watchlist item ID from previous test")
            
        response = requests.get(f"{BASE_URL}/api/watchlist/{self.__class__.watchlist_item_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert data["data"]["type"] == "wallet"
        
        print(f"✓ Got watchlist item by ID")


class TestTokenSearch:
    """Test token search/resolve functionality"""
    
    def test_resolve_token_by_symbol(self):
        """Test resolving token by symbol (USDT)"""
        response = requests.get(f"{BASE_URL}/api/resolve?input=USDT")
        
        print(f"Resolve USDT response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        
        # Should resolve to USDT address
        resolved = data.get("data", {})
        print(f"Resolved data: {resolved}")
        
        # Check resolution status
        assert resolved.get("status") in ["resolved", "indexing", "pending"], \
            f"Unexpected status: {resolved.get('status')}"
        
        print(f"✓ Resolved USDT - status: {resolved.get('status')}")
        
    def test_resolve_token_by_address(self):
        """Test resolving token by address"""
        response = requests.get(f"{BASE_URL}/api/resolve?input={TEST_TOKEN}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        
        resolved = data.get("data", {})
        assert resolved.get("normalizedId", "").lower() == TEST_TOKEN.lower()
        
        print(f"✓ Resolved token by address - type: {resolved.get('type')}")
        
    def test_resolve_wallet_address(self):
        """Test resolving wallet address"""
        response = requests.get(f"{BASE_URL}/api/resolve?input={TEST_WALLET}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        
        resolved = data.get("data", {})
        assert resolved.get("normalizedId", "").lower() == TEST_WALLET.lower()
        
        print(f"✓ Resolved wallet address - type: {resolved.get('type')}")


class TestTokenAlertCreation:
    """Test token alert creation"""
    
    def test_create_token_alert_accumulation(self):
        """Test creating token alert with accumulation trigger"""
        payload = {
            "scope": "token",
            "targetId": TEST_TOKEN,
            "triggerTypes": ["accumulation"],
            "trigger": {
                "type": "accumulation",
                "threshold": 100000,
                "window": "6h"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "name": "TEST_USDT Accumulation Alert",
            "targetMeta": {
                "symbol": "USDT",
                "name": "Tether USD",
                "chain": "Ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("ok") == True
        assert data["data"]["scope"] == "token"
        
        self.__class__.token_rule_id = data["data"].get("_id")
        print(f"✓ Created token alert with accumulation trigger")


class TestAlertRulesManagement:
    """Test alert rules CRUD operations"""
    
    def test_get_all_alert_rules(self):
        """Test getting all alert rules"""
        response = requests.get(f"{BASE_URL}/api/alerts/rules")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert "data" in data
        assert isinstance(data["data"], list)
        
        # Check that our test rules are present
        test_rules = [r for r in data["data"] if r.get("name", "").startswith("TEST_")]
        print(f"✓ Got {len(data['data'])} alert rules ({len(test_rules)} test rules)")
        
    def test_get_active_alert_rules(self):
        """Test getting only active alert rules"""
        response = requests.get(f"{BASE_URL}/api/alerts/rules?activeOnly=true")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        
        # All returned rules should be active
        for rule in data["data"]:
            assert rule.get("status") == "active" or rule.get("active") == True
            
        print(f"✓ Got {len(data['data'])} active alert rules")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_rules(self):
        """Delete all TEST_ prefixed alert rules"""
        # Get all rules
        response = requests.get(f"{BASE_URL}/api/alerts/rules")
        if response.status_code != 200:
            pytest.skip("Could not get rules for cleanup")
            
        data = response.json()
        test_rules = [r for r in data.get("data", []) if r.get("name", "").startswith("TEST_")]
        
        deleted_count = 0
        for rule in test_rules:
            rule_id = rule.get("_id")
            if rule_id:
                del_response = requests.delete(f"{BASE_URL}/api/alerts/rules/{rule_id}")
                if del_response.status_code == 200:
                    deleted_count += 1
                    
        print(f"✓ Cleaned up {deleted_count} test alert rules")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
