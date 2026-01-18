"""
P0-P2 Backend Tests: WalletsPage Analytics + MarketPage Discovery Layer

Tests:
1. Wallet Activity Snapshot API
2. Wallet Signals API
3. Wallet Related Addresses API
4. Wallet Performance API
5. Market Top Active Tokens API
6. Market Emerging Signals API
7. Market New Actors API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test wallet address (Vitalik)
TEST_WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True


class TestWalletActivitySnapshot:
    """Wallet Activity Snapshot API tests"""
    
    def test_activity_snapshot_returns_200(self):
        """GET /api/wallets/:address/activity-snapshot returns 200"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/activity-snapshot?window=24h")
        assert response.status_code == 200
        
    def test_activity_snapshot_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/activity-snapshot?window=24h")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        snapshot = data["data"]
        assert "address" in snapshot
        assert "window" in snapshot
        assert "activity" in snapshot
        assert "interpretation" in snapshot
        assert "checkedWindow" in snapshot
        assert "analysisStatus" in snapshot
        
    def test_activity_snapshot_activity_fields(self):
        """Activity object has required fields"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/activity-snapshot?window=24h")
        data = response.json()
        
        activity = data["data"]["activity"]
        assert "inflowUsd" in activity
        assert "outflowUsd" in activity
        assert "netFlowUsd" in activity
        assert "transfers" in activity
        assert "activeTokens" in activity
        
    def test_activity_snapshot_interpretation(self):
        """Interpretation object has required fields"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/activity-snapshot?window=24h")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert "headline" in interpretation
        assert "description" in interpretation
        assert "behaviorType" in interpretation
        
    def test_activity_snapshot_different_windows(self):
        """Different time windows work"""
        for window in ["1h", "6h", "24h"]:
            response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/activity-snapshot?window={window}")
            assert response.status_code == 200
            data = response.json()
            assert data.get("ok") == True


class TestWalletSignals:
    """Wallet Signals API tests"""
    
    def test_signals_returns_200(self):
        """GET /api/wallets/:address/signals returns 200"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/signals")
        assert response.status_code == 200
        
    def test_signals_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/signals")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        signals_data = data["data"]
        assert "signals" in signals_data
        assert "baseline" in signals_data
        assert "current" in signals_data
        assert "checkedMetrics" in signals_data
        assert "interpretation" in signals_data
        assert "analysisStatus" in signals_data
        
    def test_signals_baseline_fields(self):
        """Baseline object has required fields"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/signals")
        data = response.json()
        
        baseline = data["data"]["baseline"]
        assert "avgTransfersPerDay" in baseline
        assert "avgVolumePerDay" in baseline
        assert "periodDays" in baseline
        
    def test_signals_checked_metrics(self):
        """Checked metrics list is populated"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/signals")
        data = response.json()
        
        checked_metrics = data["data"]["checkedMetrics"]
        assert isinstance(checked_metrics, list)
        assert len(checked_metrics) > 0


class TestWalletRelatedAddresses:
    """Wallet Related Addresses API tests"""
    
    def test_related_returns_200(self):
        """GET /api/wallets/:address/related returns 200"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/related")
        assert response.status_code == 200
        
    def test_related_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/related")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        related_data = data["data"]
        assert "clusters" in related_data
        assert "checkedCorrelations" in related_data
        assert "interpretation" in related_data
        assert "analysisStatus" in related_data
        
    def test_related_interpretation(self):
        """Interpretation has headline and description"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/related")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert "headline" in interpretation
        assert "description" in interpretation


class TestWalletPerformance:
    """Wallet Historical Performance API tests"""
    
    def test_performance_returns_200(self):
        """GET /api/wallets/:address/performance returns 200"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/performance")
        assert response.status_code == 200
        
    def test_performance_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/performance")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        perf_data = data["data"]
        assert "performanceLabel" in perf_data
        assert "volumeAnalyzed" in perf_data
        assert "tokenCount" in perf_data
        assert "interpretation" in perf_data
        assert "analysisStatus" in perf_data
        
    def test_performance_label_valid(self):
        """Performance label is one of valid values"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/performance")
        data = response.json()
        
        label = data["data"]["performanceLabel"]
        valid_labels = ["profitable", "neutral", "unprofitable", "insufficient_data"]
        assert label in valid_labels


class TestMarketTopActiveTokens:
    """Market Top Active Tokens API tests"""
    
    def test_top_active_tokens_returns_200(self):
        """GET /api/market/top-active-tokens returns 200"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens?limit=5")
        assert response.status_code == 200
        
    def test_top_active_tokens_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens?limit=5")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        market_data = data["data"]
        assert "tokens" in market_data
        assert "window" in market_data
        assert "analyzedAt" in market_data
        
    def test_top_active_tokens_token_fields(self):
        """Token objects have required fields"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens?limit=5")
        data = response.json()
        
        tokens = data["data"]["tokens"]
        assert len(tokens) > 0
        
        token = tokens[0]
        assert "address" in token
        assert "transferCount" in token
        assert "activeWallets" in token
        
    def test_top_active_tokens_limit_param(self):
        """Limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/market/top-active-tokens?limit=3")
        data = response.json()
        
        tokens = data["data"]["tokens"]
        assert len(tokens) <= 3


class TestMarketEmergingSignals:
    """Market Emerging Signals API tests"""
    
    def test_emerging_signals_returns_200(self):
        """GET /api/market/emerging-signals returns 200"""
        response = requests.get(f"{BASE_URL}/api/market/emerging-signals?limit=5")
        assert response.status_code == 200
        
    def test_emerging_signals_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/emerging-signals?limit=5")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        signals_data = data["data"]
        assert "tokens" in signals_data
        assert "checkedCount" in signals_data
        assert "window" in signals_data
        assert "interpretation" in signals_data
        assert "analyzedAt" in signals_data
        
    def test_emerging_signals_interpretation(self):
        """Interpretation has headline and description"""
        response = requests.get(f"{BASE_URL}/api/market/emerging-signals?limit=5")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert "headline" in interpretation
        assert "description" in interpretation
        
    def test_emerging_signals_token_with_signals(self):
        """Tokens with signals have correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/emerging-signals?limit=5")
        data = response.json()
        
        tokens = data["data"]["tokens"]
        if len(tokens) > 0:
            token = tokens[0]
            assert "address" in token
            assert "signals" in token
            assert "transferCount" in token
            if token.get("topSignal"):
                assert "type" in token["topSignal"]
                assert "severity" in token["topSignal"]
                assert "title" in token["topSignal"]


class TestMarketNewActors:
    """Market New Actors API tests"""
    
    def test_new_actors_returns_200(self):
        """GET /api/market/new-actors returns 200"""
        response = requests.get(f"{BASE_URL}/api/market/new-actors?limit=5")
        assert response.status_code == 200
        
    def test_new_actors_structure(self):
        """Response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/market/new-actors?limit=5")
        data = response.json()
        
        assert data.get("ok") == True
        assert "data" in data
        
        actors_data = data["data"]
        assert "actors" in actors_data
        assert "window" in actors_data
        assert "interpretation" in actors_data
        assert "analyzedAt" in actors_data
        
    def test_new_actors_interpretation(self):
        """Interpretation has headline and description"""
        response = requests.get(f"{BASE_URL}/api/market/new-actors?limit=5")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert "headline" in interpretation
        assert "description" in interpretation
        
    def test_new_actors_actor_fields(self):
        """Actor objects have required fields"""
        response = requests.get(f"{BASE_URL}/api/market/new-actors?limit=5")
        data = response.json()
        
        actors = data["data"]["actors"]
        if len(actors) > 0:
            actor = actors[0]
            assert "address" in actor
            assert "txCount" in actor
            assert "firstSeen" in actor
            assert "tokenCount" in actor


class TestEmptyStateInterpretations:
    """Test that empty states show proper 'Checked' interpretations"""
    
    def test_wallet_activity_empty_interpretation(self):
        """Empty wallet activity shows what was checked"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/activity-snapshot?window=24h")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        # Should have meaningful interpretation even with no data
        assert len(interpretation["headline"]) > 0
        assert len(interpretation["description"]) > 0
        
    def test_wallet_signals_empty_interpretation(self):
        """Empty signals shows what was checked"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/signals")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert len(interpretation["headline"]) > 0
        assert len(interpretation["description"]) > 0
        
    def test_wallet_related_empty_interpretation(self):
        """Empty related addresses shows what was checked"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/related")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert len(interpretation["headline"]) > 0
        assert len(interpretation["description"]) > 0
        
    def test_wallet_performance_empty_interpretation(self):
        """Empty performance shows what was checked"""
        response = requests.get(f"{BASE_URL}/api/wallets/{TEST_WALLET}/performance")
        data = response.json()
        
        interpretation = data["data"]["interpretation"]
        assert len(interpretation["headline"]) > 0
        assert len(interpretation["description"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
