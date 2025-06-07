import os
import requests
import json
import traceback
import time
import random
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = os.getenv('OPENROUTER_URL')

# Validate environment variables
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")


# Rate limiting configuration
MAX_RETRIES = 3
BASE_DELAY = 1
MAX_DELAY = 30

def exponential_backoff_delay(attempt):
    """Calculate delay for exponential backoff with jitter"""
    delay = min(BASE_DELAY * (2 ** attempt) + random.uniform(0, 1), MAX_DELAY)
    return delay

def extract_price_from_prompt(prompt):
    """Extract price constraints from user prompt"""
    prompt_lower = prompt.lower()
    price_constraints = {}
    
    # Extract "under X", "below X", "less than X"
    under_patterns = [
        r'under\s*\$?(\d+)',
        r'below\s*\$?(\d+)', 
        r'less\s+than\s*\$?(\d+)',
        r'cheaper\s+than\s*\$?(\d+)',
        r'maximum\s*\$?(\d+)'
    ]
    
    # Extract "over X", "above X", "more than X"
    over_patterns = [
        r'over\s*\$?(\d+)',
        r'above\s*\$?(\d+)',
        r'more\s+than\s*\$?(\d+)',
        r'minimum\s*\$?(\d+)'
    ]
    
    # Extract price range "between X and Y"
    range_pattern = r'between\s*\$?(\d+)\s*and\s*\$?(\d+)'
    
    for pattern in under_patterns:
        match = re.search(pattern, prompt_lower)
        if match:
            price_constraints['max_price'] = float(match.group(1))
            break
    
    for pattern in over_patterns:
        match = re.search(pattern, prompt_lower)
        if match:
            price_constraints['min_price'] = float(match.group(1))
            break
    
    range_match = re.search(range_pattern, prompt_lower)
    if range_match:
        min_price = float(range_match.group(1))
        max_price = float(range_match.group(2))
        price_constraints['min_price'] = min(min_price, max_price)
        price_constraints['max_price'] = max(min_price, max_price)
    
    return price_constraints

def extract_category_from_prompt(prompt):
    """Extract category preferences from user prompt"""
    prompt_lower = prompt.lower()
    
    # Fashion categories
    clothing_keywords = ['shirt', 'shirts', 't-shirt', 'tshirt', 'top', 'tops', 'blouse', 'dress', 'dresses', 
                        'pants', 'trouser', 'jeans', 'shorts', 'jacket', 'coat', 'sweater', 'hoodie',
                        'skirt', 'leggings', 'suit', 'clothing', 'clothes', 'wear', 'apparel']
    
    shoes_keywords = ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'footwear']
    
    accessories_keywords = ['bag', 'bags', 'backpack', 'handbag', 'purse', 'wallet', 'belt', 'watch', 
                           'jewelry', 'necklace', 'earrings', 'ring', 'bracelet', 'accessories']
    
    beauty_keywords = ['makeup', 'foundation', 'lipstick', 'perfume', 'beauty', 'cosmetics', 'skincare']
    
    electronics_keywords = ['phone', 'laptop', 'headphones', 'electronics', 'gadget', 'device']
    
    # Check for category matches
    for keyword in clothing_keywords:
        if keyword in prompt_lower:
            return 'clothing'
    
    for keyword in shoes_keywords:
        if keyword in prompt_lower:
            return 'shoes'
    
    for keyword in accessories_keywords:
        if keyword in prompt_lower:
            return 'accessories'
    
    for keyword in beauty_keywords:
        if keyword in prompt_lower:
            return 'beauty'
    
    for keyword in electronics_keywords:
        if keyword in prompt_lower:
            return 'electronics'
    
    return None

def extract_color_from_prompt(prompt):
    """Extract color preferences from user prompt"""
    prompt_lower = prompt.lower()
    
    colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'purple', 'orange', 
             'brown', 'gray', 'grey', 'navy', 'maroon', 'gold', 'silver', 'beige', 'cream',
             'turquoise', 'magenta', 'cyan', 'lime', 'olive', 'coral', 'salmon']
    
    found_colors = []
    for color in colors:
        if color in prompt_lower:
            found_colors.append(color)
    
    return found_colors

def refine_recommendations_advanced(products, prompt):
    """
    Advanced rule-based refinement with proper filtering logic
    """
    try:
        print(f"Advanced refinement for prompt: '{prompt}'")
        
        # Extract constraints from prompt
        price_constraints = extract_price_from_prompt(prompt)
        preferred_category = extract_category_from_prompt(prompt)
        preferred_colors = extract_color_from_prompt(prompt)
        
        print(f"Price constraints: {price_constraints}")
        print(f"Preferred category: {preferred_category}")
        print(f"Preferred colors: {preferred_colors}")
        
        refined_products = products.copy()
        
        # Apply price filtering (MOST IMPORTANT)
        if price_constraints:
            if 'max_price' in price_constraints:
                max_price = price_constraints['max_price']
                refined_products = [p for p in refined_products if p.get('price', 0) <= max_price]
                print(f"Filtered by max price ${max_price}: {len(refined_products)} products")
            
            if 'min_price' in price_constraints:
                min_price = price_constraints['min_price']
                refined_products = [p for p in refined_products if p.get('price', 0) >= min_price]
                print(f"Filtered by min price ${min_price}: {len(refined_products)} products")
        
        # Apply category filtering
        if preferred_category:
            category_filtered = []
            for product in refined_products:
                product_category = str(product.get('category', '')).lower()
                product_name = str(product.get('name', '')).lower()
                product_desc = str(product.get('description', '')).lower()
                
                if (preferred_category in product_category or 
                    preferred_category in product_name or 
                    preferred_category in product_desc):
                    category_filtered.append(product)
            
            if category_filtered:  # Only apply if we found matches
                refined_products = category_filtered
                print(f"Filtered by category '{preferred_category}': {len(refined_products)} products")
        
        # Apply color filtering
        if preferred_colors:
            color_filtered = []
            for product in refined_products:
                product_name = str(product.get('name', '')).lower()
                product_desc = str(product.get('description', '')).lower()
                
                for color in preferred_colors:
                    if color in product_name or color in product_desc:
                        color_filtered.append(product)
                        break
            
            if color_filtered:  # Only apply if we found matches
                refined_products = color_filtered
                print(f"Filtered by colors {preferred_colors}: {len(refined_products)} products")
        
        # Handle style keywords
        prompt_lower = prompt.lower()
        if 'casual' in prompt_lower:
            style_filtered = [p for p in refined_products if 'casual' in str(p.get('description', '')).lower()]
            if style_filtered:
                refined_products = style_filtered
        elif 'formal' in prompt_lower:
            style_filtered = [p for p in refined_products if 'formal' in str(p.get('description', '')).lower()]
            if style_filtered:
                refined_products = style_filtered
        elif 'sport' in prompt_lower:
            style_filtered = [p for p in refined_products if 'sport' in str(p.get('description', '')).lower()]
            if style_filtered:
                refined_products = style_filtered
        
        # Sort by price if no specific order requested
        if price_constraints and 'max_price' in price_constraints:
            refined_products.sort(key=lambda x: x.get('price', 0))  # Cheapest first
        
        # Limit results to avoid overwhelming
        refined_products = refined_products[:10]
        
        print(f"Final refined products: {len(refined_products)}")
        return refined_products if refined_products else products[:5]
        
    except Exception as e:
        print(f"Error in advanced refinement: {e}")
        traceback.print_exc()
        return products

def make_openrouter_request(data, max_retries=MAX_RETRIES):
    """Make a request to OpenRouter with exponential backoff retry logic"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://shopsmarter.ai",
        "X-Title": "ShopSmarter AI"
    }
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(data), timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                if attempt < max_retries:
                    delay = exponential_backoff_delay(attempt)
                    print(f"Rate limited. Waiting {delay:.2f} seconds before retry {attempt + 1}/{max_retries}")
                    time.sleep(delay)
                    continue
                else:
                    print("Max retries reached for rate limiting")
                    return None
            else:
                print(f"OpenRouter API error: {response.status_code} - {response.text}")
                return None
                    
        except Exception as e:
            print(f"Request error: {e}")
            if attempt < max_retries:
                delay = exponential_backoff_delay(attempt)
                time.sleep(delay)
                continue
            else:
                return None
    
    return None

def refine_recommendations(products, prompt):
    """
    Refine product recommendations with AI and fallback to rule-based system
    """
    try:
        print(f"Refining {len(products)} products with prompt: '{prompt}'")
        
        # First, try advanced rule-based refinement (more reliable)
        refined_products = refine_recommendations_advanced(products, prompt)
        
        # If we have a good result from rule-based, return it
        if len(refined_products) > 0 and len(refined_products) < len(products):
            print(f"Using advanced rule-based refinement: {len(refined_products)} products")
            return refined_products
        
        # Otherwise, try AI refinement
        context = f"""You are an expert e-commerce filter. I have {len(products)} products. Filter them based on the user's request.

**Products (first 5 shown):**
{json.dumps([{
    'id': p.get('id'),
    'name': p.get('name'),
    'price': p.get('price'),
    'category': p.get('category'),
    'description': p.get('description', '')[:100]
} for p in products[:5]], indent=2)}

**User Request:** "{prompt}"

**Instructions:**
- If user mentions price (under $X, below $Y), STRICTLY filter by price
- If user mentions category (shirts, shoes, etc.), filter by category
- If user mentions color, filter by color
- Return ONLY product IDs that match the criteria as a JSON array
- Example: [105, 152, 278]

**IMPORTANT:** Respect price constraints exactly. "under $80" means price <= 80."""

        data = {
            "model": "google/gemini-2.0-flash-exp:free",
            "messages": [{"role": "user", "content": context}],
            "max_tokens": 1000,
            "temperature": 0.1
        }

        response_data = make_openrouter_request(data, max_retries=1)
        
        if response_data:
            response_text = response_data['choices'][0]['message']['content']
            
            # Extract JSON array
            json_match = re.search(r'(\[[\d\s,]+\])', response_text)
            if json_match:
                try:
                    product_ids = json.loads(json_match.group(1))
                    
                    # Filter products by returned IDs
                    product_dict = {int(p.get('id', 0)): p for p in products}
                    ai_refined = [product_dict[int(pid)] for pid in product_ids if int(pid) in product_dict]
                    
                    if ai_refined:
                        print(f"Using AI refinement: {len(ai_refined)} products")
                        return ai_refined
                        
                except Exception as e:
                    print(f"Error parsing AI response: {e}")
        
        # Fallback to rule-based result
        print(f"Using fallback refinement: {len(refined_products)} products")
        return refined_products
        
    except Exception as e:
        print(f"Error in refine_recommendations: {e}")
        traceback.print_exc()
        return refine_recommendations_advanced(products, prompt)
