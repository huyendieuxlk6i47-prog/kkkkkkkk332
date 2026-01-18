"""
Test Token Signals and Activity Drivers APIs (P0/P1)

Tests for:
- Token Signals API: /api/market/token-signals/:tokenAddress
- Token Drivers API: /api/market/token-drivers/:tokenAddress
- Token Activity API: /api/market/token-activity/:tokenAddress
- Token Clusters API: /api/market/token-clusters/:tokenAddress
- Token Smart Money API: /api/market/token-smart-money/:tokenAddress
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test token address (USDT)
USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"


class TestHealthCheck:
    """Health check tests - run first"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True


class TestTokenSignalsAPI:
    """P0: Token Signals Generation API tests"""
    
    def test_token_signals_returns_ok(self):
        """Test token signals endpoint returns ok response"""
        response = requests.get(f"{BASE_URL}/api/market/token-signals/{USDT_ADDRESS}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        
    def test_token_signals_has_data_structure(self):
        """Test token signals response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-signals/{USDT_ADDRESS}")
        data = response.json()
        
        assert "data" in data
        assert "tokenAddress" in data["data"]
        assert "signals" in data["data"]
        assert "analyzedAt" in data["data"]
        
    def test_token_signals_address_normalized(self):
        """Test token address is normalized to lowercase"""
        response = requests.get(f"{BASE_URL}/api/market/token-signals/{USDT_ADDRESS.upper()}")
        data = response.json()
        
        assert data["data"]["tokenAddress"] == USDT_ADDRESS.lower()
        
    def test_token_signals_array_format(self):
        """Test signals is an array"""
        response = requests.get(f"{BASE_URL}/api/market/token-signals/{USDT_ADDRESS}")
        data = response.json()
        
        assert isinstance(data["data"]["signals"], list)
        
    def test_token_signals_signal_structure(self):
        """Test individual signal has correct structure if signals exist"""
        response = requests.get(f"{BASE_URL}/api/market/token-signals/{USDT_ADDRESS}")
        data = response.json()
        
        signals = data["data"]["signals"]
        if len(signals) > 0:
            signal = signals[0]
            assert "type" in signal
            assert "severity" in signal
            assert "confidence" in signal
            assert "title" in signal
            assert "description" in signal
            assert "evidence" in signal
            assert "timestamp" in signal
            
            # Validate evidence structure
            evidence = signal["evidence"]
            assert "metric" in evidence
            assert "baseline" in evidence
            assert "current" in evidence
            assert "deviation" in evidence


class TestTokenDriversAPI:
    """P1: Token Activity Drivers API tests"""
    
    def test_token_drivers_returns_ok(self):
        """Test token drivers endpoint returns ok response"""
        response = requests.get(f"{BASE_URL}/api/market/token-drivers/{USDT_ADDRESS}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        
    def test_token_drivers_has_data_structure(self):
        """Test token drivers response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-drivers/{USDT_ADDRESS}")
        data = response.json()
        
        assert "data" in data
        assert "tokenAddress" in data["data"]
        assert "topDrivers" in data["data"]
        assert "totalVolume" in data["data"]
        assert "hasConcentration" in data["data"]
        assert "window" in data["data"]
        assert "analyzedAt" in data["data"]
        
    def test_token_drivers_limit_parameter(self):
        """Test limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/market/token-drivers/{USDT_ADDRESS}?limit=3")
        data = response.json()
        
        assert len(data["data"]["topDrivers"]) <= 3
        
    def test_token_drivers_driver_structure(self):
        """Test individual driver has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-drivers/{USDT_ADDRESS}")
        data = response.json()
        
        drivers = data["data"]["topDrivers"]
        if len(drivers) > 0:
            driver = drivers[0]
            assert "wallet" in driver
            assert "role" in driver
            assert "volumeIn" in driver
            assert "volumeOut" in driver
            assert "netFlow" in driver
            assert "influence" in driver
            
            # Role should be one of: accumulator, distributor, mixed
            assert driver["role"] in ["accumulator", "distributor", "mixed"]
            
    def test_token_drivers_usd_values(self):
        """Test USD values are present for known tokens"""
        response = requests.get(f"{BASE_URL}/api/market/token-drivers/{USDT_ADDRESS}")
        data = response.json()
        
        # USDT should have USD values
        assert "totalVolumeUsd" in data["data"]
        
        drivers = data["data"]["topDrivers"]
        if len(drivers) > 0:
            driver = drivers[0]
            assert "volumeInUsd" in driver
            assert "volumeOutUsd" in driver
            assert "netFlowUsd" in driver


class TestTokenActivityAPI:
    """Token Activity Snapshot API tests"""
    
    def test_token_activity_returns_ok(self):
        """Test token activity endpoint returns ok response"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{USDT_ADDRESS}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        
    def test_token_activity_has_data_structure(self):
        """Test token activity response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{USDT_ADDRESS}")
        data = response.json()
        
        assert "data" in data
        assert "tokenAddress" in data["data"]
        assert "window" in data["data"]
        assert "activity" in data["data"]
        assert "flows" in data["data"]
        assert "analyzedAt" in data["data"]
        assert "dataSource" in data["data"]
        
    def test_token_activity_metrics(self):
        """Test activity metrics are present"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{USDT_ADDRESS}")
        data = response.json()
        
        activity = data["data"]["activity"]
        assert "transfers24h" in activity
        assert "activeWallets" in activity
        assert "largestTransfer" in activity
        
    def test_token_activity_flows(self):
        """Test flow metrics are present"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{USDT_ADDRESS}")
        data = response.json()
        
        flows = data["data"]["flows"]
        assert "inflow" in flows
        assert "outflow" in flows
        assert "netFlow" in flows
        assert "hasPrice" in flows
        
    def test_token_activity_window_parameter(self):
        """Test window parameter works"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{USDT_ADDRESS}?window=1h")
        data = response.json()
        
        assert data["data"]["window"] == "1h"


class TestTokenClustersAPI:
    """Token Clusters API tests (B3)"""
    
    def test_token_clusters_returns_ok(self):
        """Test token clusters endpoint returns ok response"""
        response = requests.get(f"{BASE_URL}/api/market/token-clusters/{USDT_ADDRESS}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        
    def test_token_clusters_has_data_structure(self):
        """Test token clusters response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-clusters/{USDT_ADDRESS}")
        data = response.json()
        
        assert "data" in data
        assert "tokenAddress" in data["data"]
        assert "clusters" in data["data"]
        assert "analyzedAt" in data["data"]
        
    def test_token_clusters_limit_parameter(self):
        """Test limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/market/token-clusters/{USDT_ADDRESS}?limit=2")
        data = response.json()
        
        assert len(data["data"]["clusters"]) <= 2
        
    def test_token_clusters_cluster_structure(self):
        """Test individual cluster has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-clusters/{USDT_ADDRESS}")
        data = response.json()
        
        clusters = data["data"]["clusters"]
        if len(clusters) > 0:
            cluster = clusters[0]
            assert "clusterId" in cluster
            assert "walletCount" in cluster
            assert "behavior" in cluster
            assert "confidence" in cluster


class TestTokenSmartMoneyAPI:
    """Token Smart Money API tests (B4)"""
    
    def test_token_smart_money_returns_ok(self):
        """Test token smart money endpoint returns ok response"""
        response = requests.get(f"{BASE_URL}/api/market/token-smart-money/{USDT_ADDRESS}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        
    def test_token_smart_money_has_data_structure(self):
        """Test token smart money response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-smart-money/{USDT_ADDRESS}")
        data = response.json()
        
        assert "data" in data
        assert "tokenAddress" in data["data"]
        assert "count" in data["data"]
        assert "totalValue" in data["data"]
        assert "wallets" in data["data"]
        assert "analyzedAt" in data["data"]
        
    def test_token_smart_money_wallet_structure(self):
        """Test individual wallet has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/token-smart-money/{USDT_ADDRESS}")
        data = response.json()
        
        wallets = data["data"]["wallets"]
        if len(wallets) > 0:
            wallet = wallets[0]
            assert "address" in wallet
            assert "action" in wallet
            assert "volumeUsd" in wallet
            assert "txCount" in wallet
            
            # Action should be one of: accumulating, distributing
            assert wallet["action"] in ["accumulating", "distributing"]


class TestTopActiveTokensAPI:
    """Top Active Tokens API tests"""
    
    def test_top_active_tokens_returns_ok(self):
        """Test top active tokens endpoint returns ok response"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        
    def test_top_active_tokens_has_data_structure(self):
        """Test top active tokens response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens")
        data = response.json()
        
        assert "data" in data
        assert "tokens" in data["data"]
        assert "window" in data["data"]
        assert "analyzedAt" in data["data"]
        
    def test_top_active_tokens_limit_parameter(self):
        """Test limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens?limit=3")
        data = response.json()
        
        assert len(data["data"]["tokens"]) <= 3
        
    def test_top_active_tokens_token_structure(self):
        """Test individual token has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens")
        data = response.json()
        
        tokens = data["data"]["tokens"]
        if len(tokens) > 0:
            token = tokens[0]
            assert "address" in token
            assert "transferCount" in token
            assert "activeWallets" in token
            assert "isKnown" in token


class TestCleanup:
    """Cleanup tests - run last"""
    
    def test_no_cleanup_needed(self):
        """No cleanup needed for read-only tests"""
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
