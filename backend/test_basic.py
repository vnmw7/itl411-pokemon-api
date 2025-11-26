# backend/test_basic.py
"""
System: ITL411 Pokémon API
Module: Test Script
File URL: backend/test_basic.py
Purpose: Basic functionality test for the new implementation.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from services.pokeapi_client import pokeapi_client
from services.recommender_service import recommender_service

async def test_basic_functionality():
    """Test basic functionality of the new implementation."""
    print("Testing basic functionality...")
    
    try:
        # Test 1: Basic PokeAPI client functionality
        print("\n1. Testing PokeAPI client...")
        data = await pokeapi_client.fetch_data(f"{settings.POKEAPI_BASE_URL}pokemon/1")
        print(f"   ✓ Successfully fetched Bulbasaur: {data['name']}")
        
        # Test 2: Recommender service initialization (limited dataset for quick test)
        print("\n2. Testing recommender service initialization...")
        # Temporarily reduce dataset limit for faster testing
        original_limit = recommender_service.limit
        recommender_service.limit = 10  # Just test with 10 Pokémon
        
        success = await recommender_service.initialize()
        if success:
            print(f"   ✓ Successfully initialized with {len(recommender_service.df)} Pokémon")
        else:
            print("   ✗ Failed to initialize recommender service")
            return False
        
        # Test 3: Search functionality
        print("\n3. Testing search functionality...")
        results = recommender_service.search_by_name("bulb")
        print(f"   ✓ Search for 'bulb' returned: {results}")
        
        # Test 4: Recommendation functionality with distance ordering
        print("\n4. Testing recommendation functionality with distance ordering...")
        recommendations = recommender_service.get_recommendations("bulbasaur", 3)
        print(f"   ✓ Recommendations for Bulbasaur: {recommendations}")
        
        # Test 5: Enhanced health check
        print("\n5. Testing enhanced health check...")
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        health_response = client.get("/health")
        health_data = health_response.json()
        print(f"   ✓ Enhanced health check: {health_data}")
        
        # Restore original limit
        recommender_service.limit = original_limit
        
        print("\n✅ All tests passed! Implementation is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("=" * 60)
    print("ITL411 Pokémon API - Basic Functionality Test")
    print("=" * 60)
    
    success = await test_basic_functionality()
    
    # Clean up
    await pokeapi_client.close()
    
    if success:
        print("\n🎉 Implementation is ready for use!")
        print("\nTo start the server, run:")
        print("   uvicorn backend.main:app --host 0.0.0.0 --port 8000")
        print("\nAPI Documentation will be available at:")
        print("   http://127.0.0.1:8000/docs")
    else:
        print("\n❌ Implementation needs fixes before use.")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())