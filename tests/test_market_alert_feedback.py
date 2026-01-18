"""
Test Suite: MarketPage Semantic Polish + Alert Feedback Loop (P3)

Tests:
1. MarketPage - Discovery-only content (no Watchlist duplication)
2. MarketPage - Card descriptions with 'Why this matters'
3. MarketPage - CTA buttons functionality
4. Alert Feedback Loop - API endpoints
5. Alert Feedback Loop - FeedbackHint trigger conditions
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
USER_ID = 'demo-user'

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def api_client():
    """Shared requests session with headers"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "x-user-id": USER_ID
    })
    return session


@pytest.fixture(scope="function")
def test_alert_rule(api_client):
    """Create a test alert rule for feedback loop testing - fresh rule per test"""
    # First, create a watchlist item and alert rule
    import time
    payload = {
        "scope": "token",
        "targetId": "0xdac17f958d2ee523a2206206994597c13d831ec7",  # USDT
        "triggerTypes": ["accumulation"],
        "channels": {"inApp": True, "telegram": False},
        "minSeverity": 50,
        "targetMeta": {"symbol": "USDT", "name": "Tether USD", "chain": "ethereum"}
    }
    
    response = api_client.post(f"{BASE_URL}/api/alerts/rules", json=payload)
    
    if response.status_code == 201 or response.status_code == 200:
        data = response.json()
        rule_id = data.get('data', {}).get('_id') or data.get('_id')
        yield rule_id
        # Cleanup
        if rule_id:
            time.sleep(0.1)  # Small delay to ensure operations complete
            api_client.delete(f"{BASE_URL}/api/alerts/rules/{rule_id}")
    else:
        pytest.skip(f"Could not create test alert rule: {response.status_code} - {response.text}")


# ============================================================================
# MARKET PAGE API TESTS - Discovery Content
# ============================================================================

class TestMarketPageAPIs:
    """Test MarketPage discovery APIs"""
    
    def test_health_check(self, api_client):
        """Verify backend is healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') is True
        print("✓ Health check passed")
    
    def test_top_active_tokens_returns_data(self, api_client):
        """Test 'Highest On-Chain Activity' card data source"""
        response = api_client.get(f"{BASE_URL}/api/market/top-active-tokens?limit=8&window=24h")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        assert 'data' in data
        assert 'tokens' in data['data']
        
        tokens = data['data']['tokens']
        assert isinstance(tokens, list)
        
        # Verify token structure
        if len(tokens) > 0:
            token = tokens[0]
            assert 'address' in token
            assert 'transferCount' in token
            assert 'activeWallets' in token
            print(f"✓ Top active tokens: {len(tokens)} tokens returned")
            print(f"  Top token: {token.get('symbol', 'Unknown')} - {token.get('transferCount')} transfers")
        else:
            print("✓ Top active tokens: Empty (indexing in progress)")
    
    def test_emerging_signals_returns_data(self, api_client):
        """Test 'Unusual On-Chain Behavior Detected' card data source"""
        response = api_client.get(f"{BASE_URL}/api/market/emerging-signals?limit=6")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        assert 'data' in data
        
        # Check for interpretation field (Why this matters)
        if 'interpretation' in data['data']:
            interpretation = data['data']['interpretation']
            assert 'headline' in interpretation
            assert 'description' in interpretation
            print(f"✓ Emerging signals interpretation: {interpretation.get('headline')}")
        
        tokens = data['data'].get('tokens', [])
        print(f"✓ Emerging signals: {len(tokens)} tokens with unusual behavior")
        
        # Verify signal structure if tokens exist
        if len(tokens) > 0:
            token = tokens[0]
            assert 'address' in token
            assert 'signals' in token
            if token.get('topSignal'):
                print(f"  Top signal: {token['topSignal'].get('type')} - severity {token['topSignal'].get('severity')}")
    
    def test_new_actors_returns_data(self, api_client):
        """Test 'New Wallets Showing Abnormal Activity' card data source"""
        response = api_client.get(f"{BASE_URL}/api/market/new-actors?limit=6")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        assert 'data' in data
        
        # Check for interpretation field (Why this matters)
        if 'interpretation' in data['data']:
            interpretation = data['data']['interpretation']
            assert 'headline' in interpretation
            assert 'description' in interpretation
            print(f"✓ New actors interpretation: {interpretation.get('headline')}")
        
        actors = data['data'].get('actors', [])
        print(f"✓ New actors: {len(actors)} wallets detected")
        
        # Verify actor structure if actors exist
        if len(actors) > 0:
            actor = actors[0]
            assert 'address' in actor
            assert 'txCount' in actor
            assert 'tokenCount' in actor
            print(f"  Top actor: {actor['address'][:10]}... - {actor['txCount']} txs")


# ============================================================================
# ALERT FEEDBACK LOOP API TESTS (P3)
# ============================================================================

class TestAlertFeedbackLoopAPIs:
    """Test Alert Feedback Loop endpoints"""
    
    def test_create_alert_rule(self, api_client):
        """Test creating an alert rule for feedback testing"""
        payload = {
            "scope": "token",
            "targetId": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",  # USDC
            "triggerTypes": ["activity_spike"],
            "channels": {"inApp": True, "telegram": False},
            "minSeverity": 50,
            "targetMeta": {"symbol": "USDC", "name": "USD Coin", "chain": "ethereum"}
        }
        
        response = api_client.post(f"{BASE_URL}/api/alerts/rules", json=payload)
        
        # Accept 200 or 201
        assert response.status_code in [200, 201], f"Failed to create rule: {response.text}"
        
        data = response.json()
        assert data.get('ok') is True or '_id' in data.get('data', {})
        
        rule_id = data.get('data', {}).get('_id') or data.get('_id')
        assert rule_id is not None
        print(f"✓ Created alert rule: {rule_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/alerts/rules/{rule_id}")
        print(f"✓ Cleaned up alert rule")
    
    def test_get_feedback_status_endpoint(self, api_client, test_alert_rule):
        """Test GET /api/alerts/rules/:id/feedback endpoint"""
        if not test_alert_rule:
            pytest.skip("No test alert rule available")
        
        response = api_client.get(f"{BASE_URL}/api/alerts/rules/{test_alert_rule}/feedback")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        assert 'data' in data
        
        feedback_data = data['data']
        assert 'triggersIn24h' in feedback_data
        assert 'totalTriggerCount' in feedback_data
        assert 'showFeedback' in feedback_data
        assert 'feedbackSent' in feedback_data
        
        print(f"✓ Feedback status: triggersIn24h={feedback_data['triggersIn24h']}, showFeedback={feedback_data['showFeedback']}")
    
    def test_pause_rule_endpoint(self, api_client, test_alert_rule):
        """Test POST /api/alerts/rules/:id/pause endpoint"""
        if not test_alert_rule:
            pytest.skip("No test alert rule available")
        
        response = api_client.post(f"{BASE_URL}/api/alerts/rules/{test_alert_rule}/pause", json={})
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        
        # Verify rule is paused
        rule_data = data.get('data', {})
        assert rule_data.get('status') == 'paused' or rule_data.get('active') is False
        print(f"✓ Rule paused successfully")
    
    def test_reduce_sensitivity_endpoint(self, api_client, test_alert_rule):
        """Test POST /api/alerts/rules/:id/reduce-sensitivity endpoint"""
        if not test_alert_rule:
            pytest.skip("No test alert rule available")
        
        # Get initial minSeverity
        rules_response = api_client.get(f"{BASE_URL}/api/alerts/rules")
        initial_severity = 50  # Default
        
        response = api_client.post(f"{BASE_URL}/api/alerts/rules/{test_alert_rule}/reduce-sensitivity", json={})
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        
        # Verify severity increased
        rule_data = data.get('data', {})
        new_severity = rule_data.get('minSeverity', 0)
        assert new_severity >= initial_severity, f"Severity should increase: {initial_severity} -> {new_severity}"
        
        print(f"✓ Sensitivity reduced: minSeverity increased to {new_severity}")
        if 'message' in data:
            print(f"  Message: {data['message']}")
    
    def test_feedback_not_found_for_invalid_rule(self, api_client):
        """Test feedback endpoint returns 404 for non-existent rule"""
        fake_id = "000000000000000000000000"
        response = api_client.get(f"{BASE_URL}/api/alerts/rules/{fake_id}/feedback")
        assert response.status_code == 404
        print("✓ Correctly returns 404 for non-existent rule")


# ============================================================================
# ALERT RULES CRUD TESTS
# ============================================================================

class TestAlertRulesCRUD:
    """Test Alert Rules CRUD operations"""
    
    def test_list_alert_rules(self, api_client):
        """Test listing alert rules"""
        response = api_client.get(f"{BASE_URL}/api/alerts/rules")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        assert 'data' in data
        assert isinstance(data['data'], list)
        
        print(f"✓ Listed {len(data['data'])} alert rules")
    
    def test_update_alert_rule_status(self, api_client, test_alert_rule):
        """Test updating alert rule status"""
        if not test_alert_rule:
            pytest.skip("No test alert rule available")
        
        # Pause the rule
        response = api_client.put(
            f"{BASE_URL}/api/alerts/rules/{test_alert_rule}",
            json={"status": "paused"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('ok') is True
        print("✓ Updated alert rule status to paused")
        
        # Resume the rule
        response = api_client.put(
            f"{BASE_URL}/api/alerts/rules/{test_alert_rule}",
            json={"status": "active"}
        )
        assert response.status_code == 200
        print("✓ Updated alert rule status to active")
    
    def test_delete_alert_rule(self, api_client):
        """Test deleting an alert rule"""
        # Create a rule to delete
        payload = {
            "scope": "token",
            "targetId": "0x6b175474e89094c44da98b954eedeac495271d0f",  # DAI
            "triggerTypes": ["large_move"],
            "channels": {"inApp": True, "telegram": False},
            "minSeverity": 60,
            "targetMeta": {"symbol": "DAI", "name": "Dai Stablecoin", "chain": "ethereum"}
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/alerts/rules", json=payload)
        assert create_response.status_code in [200, 201]
        
        rule_id = create_response.json().get('data', {}).get('_id')
        assert rule_id is not None
        
        # Delete the rule
        delete_response = api_client.delete(f"{BASE_URL}/api/alerts/rules/{rule_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data.get('ok') is True
        print(f"✓ Deleted alert rule: {rule_id}")


# ============================================================================
# FEEDBACK HINT TRIGGER CONDITIONS
# ============================================================================

class TestFeedbackHintConditions:
    """Test FeedbackHint component trigger conditions"""
    
    def test_feedback_not_shown_for_new_rule(self, api_client, test_alert_rule):
        """FeedbackHint should NOT show for new rules (0 triggers)"""
        if not test_alert_rule:
            pytest.skip("No test alert rule available")
        
        response = api_client.get(f"{BASE_URL}/api/alerts/rules/{test_alert_rule}/feedback")
        assert response.status_code == 200
        
        data = response.json()
        feedback_data = data.get('data', {})
        
        # New rule should have 0 triggers and showFeedback=false
        assert feedback_data.get('triggersIn24h', 0) < 3
        assert feedback_data.get('showFeedback') is False
        
        print(f"✓ FeedbackHint correctly hidden for new rule (triggers={feedback_data.get('triggersIn24h')})")
    
    def test_feedback_conditions_documented(self, api_client, test_alert_rule):
        """Verify feedback conditions are properly documented in response"""
        if not test_alert_rule:
            pytest.skip("No test alert rule available")
        
        response = api_client.get(f"{BASE_URL}/api/alerts/rules/{test_alert_rule}/feedback")
        assert response.status_code == 200
        
        data = response.json()
        feedback_data = data.get('data', {})
        
        # Check recommendation field exists when showFeedback would be true
        # For new rules, recommendation should be null
        if feedback_data.get('showFeedback'):
            assert 'recommendation' in feedback_data
            assert feedback_data['recommendation'] is not None
            print(f"✓ Recommendation provided: {feedback_data['recommendation']}")
        else:
            print("✓ No recommendation needed (showFeedback=false)")


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
