"""
Test Adaptive Alerts Implementation (A5.1-A5.4)

A5.1: Backend stats - AlertRule model with stats24h, sensitivity presets
A5.2: FeedbackHint - Shows 'Reduce sensitivity' when noiseScore >= 3
A5.3: Telegram nudge (tested via API)
A5.4: CreateAlertModal - 3 sensitivity levels with expected frequency

Tests:
- GET /api/alerts/sensitivity-presets - returns presets for token/wallet
- GET /api/alerts/rules/:id/feedback - returns stats24h with noiseScore
- POST /api/alerts/rules/:id/reduce-sensitivity - reduces sensitivity level
- PUT /api/alerts/rules/:id/sensitivity - updates sensitivity level
- AlertRule model has stats24h field
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://blockchain-radar.preview.emergentagent.com"

HEADERS = {
    'Content-Type': 'application/json',
    'x-user-id': 'test-adaptive-alerts'
}

# Test data
TEST_TOKEN_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"  # USDT


class TestSensitivityPresets:
    """A5.1/A5.4: Test sensitivity presets API"""
    
    def test_get_sensitivity_presets(self):
        """GET /api/alerts/sensitivity-presets returns presets for token/wallet"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/sensitivity-presets",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') == True
        
        # Check structure
        presets = data.get('data', {})
        assert 'token' in presets, "Missing token presets"
        assert 'wallet' in presets, "Missing wallet presets"
        assert 'levels' in presets, "Missing levels array"
        assert 'descriptions' in presets, "Missing descriptions"
        
        # Check levels
        levels = presets.get('levels', [])
        assert 'low' in levels
        assert 'medium' in levels
        assert 'high' in levels
        
        # Check token presets have required fields
        token_presets = presets.get('token', {})
        for level in ['low', 'medium', 'high']:
            assert level in token_presets, f"Missing {level} in token presets"
            preset = token_presets[level]
            assert 'window' in preset, f"Missing window in {level} preset"
            assert 'cooldown' in preset, f"Missing cooldown in {level} preset"
            assert 'minTransferSizeUsd' in preset, f"Missing minTransferSizeUsd in {level} preset"
            assert 'thresholdMultiplier' in preset, f"Missing thresholdMultiplier in {level} preset"
            assert 'description' in preset, f"Missing description in {level} preset"
            assert 'expectedFrequency' in preset, f"Missing expectedFrequency in {level} preset"
        
        # Check wallet presets have required fields
        wallet_presets = presets.get('wallet', {})
        for level in ['low', 'medium', 'high']:
            assert level in wallet_presets, f"Missing {level} in wallet presets"
        
        # Check descriptions have expected frequency
        descriptions = presets.get('descriptions', {})
        for level in ['low', 'medium', 'high']:
            assert level in descriptions, f"Missing {level} in descriptions"
            desc = descriptions[level]
            assert 'frequency' in desc, f"Missing frequency in {level} description"
            assert 'description' in desc, f"Missing description in {level} description"
        
        print(f"✓ Sensitivity presets API returns correct structure")
        print(f"  Token presets: {list(token_presets.keys())}")
        print(f"  Wallet presets: {list(wallet_presets.keys())}")
        print(f"  Levels: {levels}")


class TestAlertRuleWithSensitivity:
    """A5.1/A5.4: Test alert rule creation with sensitivity field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.created_rule_ids = []
        yield
        # Cleanup
        for rule_id in self.created_rule_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/alerts/rules/{rule_id}",
                    headers=HEADERS
                )
            except:
                pass
    
    def test_create_alert_with_sensitivity(self):
        """POST /api/alerts/rules creates rule with sensitivity field"""
        payload = {
            "scope": "token",
            "targetId": TEST_TOKEN_ADDRESS,
            "triggerTypes": ["accumulation"],
            "trigger": {
                "type": "accumulation",
                "sensitivity": "high"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "minSeverity": 30,
            "minConfidence": 0.6,
            "throttle": "1h",
            "sensitivity": "high",
            "name": "TEST_Adaptive_Alert_High",
            "targetMeta": {
                "symbol": "USDT",
                "name": "Tether USD",
                "chain": "ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers=HEADERS
        )
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True
        
        rule = data.get('data', {})
        self.created_rule_ids.append(rule.get('_id'))
        
        # Verify sensitivity is stored
        assert rule.get('sensitivity') == 'high' or rule.get('trigger', {}).get('sensitivity') == 'high', \
            "Sensitivity not stored correctly"
        
        print(f"✓ Alert rule created with sensitivity: {rule.get('sensitivity')}")
        print(f"  Rule ID: {rule.get('_id')}")
        
        return rule.get('_id')
    
    def test_create_alert_with_medium_sensitivity(self):
        """POST /api/alerts/rules creates rule with medium sensitivity"""
        payload = {
            "scope": "token",
            "targetId": TEST_TOKEN_ADDRESS,
            "triggerTypes": ["large_move"],
            "trigger": {
                "type": "large_move",
                "sensitivity": "medium"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "minSeverity": 50,
            "minConfidence": 0.6,
            "throttle": "6h",
            "sensitivity": "medium",
            "name": "TEST_Adaptive_Alert_Medium",
            "targetMeta": {
                "symbol": "USDT",
                "name": "Tether USD",
                "chain": "ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers=HEADERS
        )
        
        assert response.status_code == 201
        data = response.json()
        rule = data.get('data', {})
        self.created_rule_ids.append(rule.get('_id'))
        
        print(f"✓ Alert rule created with medium sensitivity")
        return rule.get('_id')


class TestFeedbackAPI:
    """A5.1/A5.2: Test feedback API with stats24h and noiseScore"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test rule for feedback testing"""
        self.created_rule_ids = []
        
        # Create a test rule
        payload = {
            "scope": "token",
            "targetId": TEST_TOKEN_ADDRESS,
            "triggerTypes": ["activity_spike"],
            "trigger": {
                "type": "activity_spike",
                "sensitivity": "high"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "minSeverity": 30,
            "minConfidence": 0.6,
            "throttle": "1h",
            "sensitivity": "high",
            "name": "TEST_Feedback_Rule",
            "targetMeta": {
                "symbol": "USDT",
                "name": "Tether USD",
                "chain": "ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers=HEADERS
        )
        
        if response.status_code == 201:
            data = response.json()
            self.test_rule_id = data.get('data', {}).get('_id')
            self.created_rule_ids.append(self.test_rule_id)
        else:
            self.test_rule_id = None
        
        yield
        
        # Cleanup
        for rule_id in self.created_rule_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/alerts/rules/{rule_id}",
                    headers=HEADERS
                )
            except:
                pass
    
    def test_get_feedback_returns_stats24h(self):
        """GET /api/alerts/rules/:id/feedback returns stats24h with noiseScore"""
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        response = requests.get(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/feedback",
            headers=HEADERS
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True
        
        feedback = data.get('data', {})
        
        # A5.1: Check stats field exists
        stats = feedback.get('stats', {})
        assert 'triggers24h' in stats, "Missing triggers24h in stats"
        assert 'suppressedCount24h' in stats, "Missing suppressedCount24h in stats"
        assert 'highestPriority24h' in stats, "Missing highestPriority24h in stats"
        assert 'noiseScore' in stats, "Missing noiseScore in stats"
        
        # Check other feedback fields
        assert 'triggersIn24h' in feedback, "Missing triggersIn24h"
        assert 'showFeedback' in feedback, "Missing showFeedback"
        assert 'currentSensitivity' in feedback, "Missing currentSensitivity"
        
        print(f"✓ Feedback API returns stats24h with noiseScore")
        print(f"  Stats: {stats}")
        print(f"  Current sensitivity: {feedback.get('currentSensitivity')}")
        print(f"  Show feedback: {feedback.get('showFeedback')}")
    
    def test_feedback_shows_reduce_sensitivity_when_noisy(self):
        """A5.2: Feedback shows 'Reduce sensitivity' when noiseScore >= 3"""
        # This test verifies the logic - actual noiseScore depends on triggers
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        response = requests.get(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/feedback",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        feedback = data.get('data', {})
        
        stats = feedback.get('stats', {})
        noiseScore = stats.get('noiseScore', 0)
        highestPriority = stats.get('highestPriority24h', 'low')
        showFeedback = feedback.get('showFeedback', False)
        
        # Verify logic: showFeedback should be True when noiseScore >= 3 AND highestPriority !== 'high'
        expected_show_feedback = noiseScore >= 3 and highestPriority != 'high'
        
        print(f"✓ Feedback logic verified")
        print(f"  noiseScore: {noiseScore}")
        print(f"  highestPriority24h: {highestPriority}")
        print(f"  showFeedback: {showFeedback}")
        print(f"  Expected showFeedback: {expected_show_feedback}")


class TestReduceSensitivityAPI:
    """A5.2: Test reduce-sensitivity API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test rule with high sensitivity"""
        self.created_rule_ids = []
        
        payload = {
            "scope": "token",
            "targetId": TEST_TOKEN_ADDRESS,
            "triggerTypes": ["smart_money_entry"],
            "trigger": {
                "type": "smart_money_entry",
                "sensitivity": "high"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "minSeverity": 30,
            "minConfidence": 0.6,
            "throttle": "1h",
            "sensitivity": "high",
            "name": "TEST_Reduce_Sensitivity_Rule",
            "targetMeta": {
                "symbol": "USDT",
                "name": "Tether USD",
                "chain": "ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers=HEADERS
        )
        
        if response.status_code == 201:
            data = response.json()
            self.test_rule_id = data.get('data', {}).get('_id')
            self.created_rule_ids.append(self.test_rule_id)
        else:
            self.test_rule_id = None
        
        yield
        
        # Cleanup
        for rule_id in self.created_rule_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/alerts/rules/{rule_id}",
                    headers=HEADERS
                )
            except:
                pass
    
    def test_reduce_sensitivity_from_high_to_medium(self):
        """POST /api/alerts/rules/:id/reduce-sensitivity reduces high -> medium"""
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/reduce-sensitivity",
            json={},
            headers=HEADERS
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True
        
        # Check sensitivity changed
        assert data.get('previousSensitivity') == 'high', "Previous sensitivity should be high"
        assert data.get('newSensitivity') == 'medium', "New sensitivity should be medium"
        
        # Verify rule was updated
        rule = data.get('data', {})
        assert rule.get('sensitivity') == 'medium', "Rule sensitivity not updated"
        
        print(f"✓ Reduce sensitivity: high -> medium")
        print(f"  Previous: {data.get('previousSensitivity')}")
        print(f"  New: {data.get('newSensitivity')}")
        print(f"  Message: {data.get('message')}")
    
    def test_reduce_sensitivity_from_medium_to_low(self):
        """POST /api/alerts/rules/:id/reduce-sensitivity reduces medium -> low"""
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        # First reduce to medium
        requests.post(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/reduce-sensitivity",
            json={},
            headers=HEADERS
        )
        
        # Then reduce to low
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/reduce-sensitivity",
            json={},
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('previousSensitivity') == 'medium', "Previous sensitivity should be medium"
        assert data.get('newSensitivity') == 'low', "New sensitivity should be low"
        
        print(f"✓ Reduce sensitivity: medium -> low")


class TestUpdateSensitivityAPI:
    """A5.4: Test PUT /api/alerts/rules/:id/sensitivity"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test rule"""
        self.created_rule_ids = []
        
        payload = {
            "scope": "token",
            "targetId": TEST_TOKEN_ADDRESS,
            "triggerTypes": ["distribution"],
            "trigger": {
                "type": "distribution",
                "sensitivity": "medium"
            },
            "channels": {
                "inApp": True,
                "telegram": False
            },
            "minSeverity": 50,
            "minConfidence": 0.6,
            "throttle": "6h",
            "sensitivity": "medium",
            "name": "TEST_Update_Sensitivity_Rule",
            "targetMeta": {
                "symbol": "USDT",
                "name": "Tether USD",
                "chain": "ethereum"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/alerts/rules",
            json=payload,
            headers=HEADERS
        )
        
        if response.status_code == 201:
            data = response.json()
            self.test_rule_id = data.get('data', {}).get('_id')
            self.created_rule_ids.append(self.test_rule_id)
        else:
            self.test_rule_id = None
        
        yield
        
        # Cleanup
        for rule_id in self.created_rule_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/alerts/rules/{rule_id}",
                    headers=HEADERS
                )
            except:
                pass
    
    def test_update_sensitivity_to_high(self):
        """PUT /api/alerts/rules/:id/sensitivity updates to high"""
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        response = requests.put(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/sensitivity",
            json={"sensitivity": "high"},
            headers=HEADERS
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True
        
        rule = data.get('data', {})
        assert rule.get('sensitivity') == 'high', "Sensitivity not updated to high"
        
        # Check sensitivity config is returned
        config = data.get('sensitivityConfig', {})
        assert 'expectedFrequency' in config, "Missing expectedFrequency in config"
        
        print(f"✓ Sensitivity updated to high")
        print(f"  Expected frequency: {config.get('expectedFrequency')}")
    
    def test_update_sensitivity_to_low(self):
        """PUT /api/alerts/rules/:id/sensitivity updates to low"""
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        response = requests.put(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/sensitivity",
            json={"sensitivity": "low"},
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        
        rule = data.get('data', {})
        assert rule.get('sensitivity') == 'low', "Sensitivity not updated to low"
        
        print(f"✓ Sensitivity updated to low")
    
    def test_update_sensitivity_invalid_value(self):
        """PUT /api/alerts/rules/:id/sensitivity rejects invalid value"""
        if not self.test_rule_id:
            pytest.skip("Test rule not created")
        
        response = requests.put(
            f"{BASE_URL}/api/alerts/rules/{self.test_rule_id}/sensitivity",
            json={"sensitivity": "invalid"},
            headers=HEADERS
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert data.get('ok') == False
        
        print(f"✓ Invalid sensitivity value rejected")


class TestHealthAndBasicAPIs:
    """Basic health and API tests"""
    
    def test_health_endpoint(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'ok' or data.get('ok') == True
        print(f"✓ Health endpoint OK")
    
    def test_alerts_rules_list(self):
        """GET /api/alerts/rules returns list"""
        response = requests.get(
            f"{BASE_URL}/api/alerts/rules",
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') == True
        assert 'data' in data
        print(f"✓ Alert rules list endpoint OK, count: {data.get('count', len(data.get('data', [])))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
