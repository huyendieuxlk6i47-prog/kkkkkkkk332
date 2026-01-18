"""
P2 Features Test Suite - CoinGecko Integration & Token Activity API

Tests:
1. CoinGecko price service returns live prices for WETH, WBTC, LINK, UNI, AAVE
2. Token Activity API shows priceSource field (stablecoin/coingecko/coingecko_contract)
3. Token Activity API shows priceNote in interpretation
4. USDT returns priceSource=stablecoin, price=$1
5. WETH returns priceSource=coingecko with live price
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tokentrack-2.preview.emergentagent.com').rstrip('/')

# Token addresses for testing
TOKENS = {
    'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',  # Stablecoin
    'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',  # Stablecoin
    'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',   # Stablecoin
    'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',  # CoinGecko
    'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',  # CoinGecko
    'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',  # CoinGecko
    'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',   # CoinGecko
    'AAVE': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',  # CoinGecko
}


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') == True


class TestCoinGeckoStablecoinPrices:
    """Test stablecoin prices are fixed at $1"""
    
    def test_usdt_stablecoin_price(self):
        """USDT should return priceSource=stablecoin, price=$1"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert data['data']['flows']['priceSource'] == 'stablecoin'
        assert data['data']['flows']['priceUsd'] == 1
        assert 'Stablecoin price fixed at $1' in data['data']['interpretation']['priceNote']
    
    def test_usdc_stablecoin_price(self):
        """USDC should return priceSource=stablecoin, price=$1"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDC']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert data['data']['flows']['priceSource'] == 'stablecoin'
        assert data['data']['flows']['priceUsd'] == 1
    
    def test_dai_stablecoin_price(self):
        """DAI should return priceSource=stablecoin, price=$1"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['DAI']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert data['data']['flows']['priceSource'] == 'stablecoin'
        assert data['data']['flows']['priceUsd'] == 1


class TestCoinGeckoLivePrices:
    """Test CoinGecko live prices for non-stablecoins"""
    
    def test_weth_coingecko_price(self):
        """WETH should return priceSource=coingecko with live price"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['WETH']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert data['data']['flows']['priceSource'] == 'coingecko'
        # WETH price should be > $1000 (reasonable sanity check)
        price = data['data']['flows']['priceUsd']
        assert price is not None, "WETH price should not be null"
        assert price > 1000, f"WETH price ${price} seems too low"
        assert price < 100000, f"WETH price ${price} seems too high"
        assert 'Live price from CoinGecko' in data['data']['interpretation']['priceNote']
    
    def test_link_coingecko_price(self):
        """LINK should return priceSource=coingecko with live price"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['LINK']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert data['data']['flows']['priceSource'] == 'coingecko'
        price = data['data']['flows']['priceUsd']
        assert price is not None, "LINK price should not be null"
        assert price > 1, f"LINK price ${price} seems too low"
        assert price < 1000, f"LINK price ${price} seems too high"
    
    def test_uni_coingecko_price(self):
        """UNI should return priceSource=coingecko with live price"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['UNI']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert data['data']['flows']['priceSource'] == 'coingecko'
        price = data['data']['flows']['priceUsd']
        assert price is not None, "UNI price should not be null"
        assert price > 0.1, f"UNI price ${price} seems too low"
        assert price < 500, f"UNI price ${price} seems too high"


class TestTokenActivityAPIStructure:
    """Test Token Activity API response structure"""
    
    def test_token_activity_response_structure(self):
        """Token Activity API should return proper structure with priceSource and priceNote"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('ok') == True
        assert 'data' in data
        
        # Check flows structure
        flows = data['data']['flows']
        assert 'totalVolume' in flows
        assert 'netFlow' in flows
        assert 'direction' in flows
        assert 'hasPrice' in flows
        assert 'priceUsd' in flows
        assert 'priceSource' in flows  # NEW P2 field
        
        # Check interpretation structure
        interpretation = data['data']['interpretation']
        assert 'walletsDefinition' in interpretation
        assert 'netFlowDefinition' in interpretation
        assert 'priceNote' in interpretation  # NEW P2 field
    
    def test_price_source_values(self):
        """priceSource should be one of: stablecoin, coingecko, coingecko_contract, unknown"""
        valid_sources = ['stablecoin', 'coingecko', 'coingecko_contract', 'unknown']
        
        # Test USDT (stablecoin)
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}")
        data = response.json()
        assert data['data']['flows']['priceSource'] in valid_sources
        
        # Test WETH (coingecko)
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['WETH']}")
        data = response.json()
        assert data['data']['flows']['priceSource'] in valid_sources


class TestTokenActivityWindows:
    """Test Token Activity API with different time windows"""
    
    def test_1h_window(self):
        """Test 1h time window"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}?window=1h")
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') == True
        assert data['data']['window'] == '1h'
    
    def test_6h_window(self):
        """Test 6h time window"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}?window=6h")
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') == True
        assert data['data']['window'] == '6h'
    
    def test_24h_window(self):
        """Test 24h time window (default)"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}?window=24h")
        assert response.status_code == 200
        data = response.json()
        assert data.get('ok') == True
        assert data['data']['window'] == '24h'


class TestPriceNoteMessages:
    """Test priceNote messages are correct"""
    
    def test_stablecoin_price_note(self):
        """Stablecoin should have specific price note"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['USDT']}")
        data = response.json()
        assert 'Stablecoin price fixed at $1' in data['data']['interpretation']['priceNote']
    
    def test_coingecko_price_note(self):
        """CoinGecko token should have live price note"""
        response = requests.get(f"{BASE_URL}/api/market/token-activity/{TOKENS['WETH']}")
        data = response.json()
        assert 'Live price from CoinGecko' in data['data']['interpretation']['priceNote']
        assert '5min cache' in data['data']['interpretation']['priceNote']


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
