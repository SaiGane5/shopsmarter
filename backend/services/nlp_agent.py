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
# Fallback to environment variable if direct value is empty or None
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = os.getenv("OPENROUTER_URL")

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
    """FIXED: Extract price constraints with comprehensive pattern matching"""
    prompt_lower = prompt.lower()
    price_constraints = {}
    
    print(f"Aurra: Extracting price from prompt: '{prompt_lower}'")
    
    # ENHANCED: More comprehensive range patterns - handles "to", "and", "dollars" variations
    range_patterns = [
        # Standard range patterns
        r'between\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)',
        r'from\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)',
        r'\$?(\d+(?:\.\d+)?)\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)',
        r'\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)',
        
        # Dollar word patterns - FIXED to handle "dollars to dollars"
        r'between\s*(\d+(?:\.\d+)?)\s*dollars?\s*(?:and|to)\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'from\s*(\d+(?:\.\d+)?)\s*dollars?\s*(?:and|to)\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'(\d+(?:\.\d+)?)\s*dollars?\s*(?:and|to)\s*(\d+(?:\.\d+)?)\s*dollars?',
        
        # More flexible patterns
        r'price\s*between\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)',
        r'price\s*from\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)',
        r'cost\s*between\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to)\s*\$?(\d+(?:\.\d+)?)',
    ]
    
    # Enhanced under patterns
    under_patterns = [
        r'under\s*\$?(\d+(?:\.\d+)?)',
        r'below\s*\$?(\d+(?:\.\d+)?)', 
        r'less\s+than\s*\$?(\d+(?:\.\d+)?)',
        r'cheaper\s+than\s*\$?(\d+(?:\.\d+)?)',
        r'maximum\s*\$?(\d+(?:\.\d+)?)',
        r'max\s*\$?(\d+(?:\.\d+)?)',
        r'up\s+to\s*\$?(\d+(?:\.\d+)?)',
        r'within\s*\$?(\d+(?:\.\d+)?)',
        r'not\s+more\s+than\s*\$?(\d+(?:\.\d+)?)',
        # Dollar word patterns
        r'under\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'below\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'less\s+than\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'cheaper\s+than\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'maximum\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'max\s*(\d+(?:\.\d+)?)\s*dollars?',
    ]
    
    # Enhanced over patterns  
    over_patterns = [
        r'over\s*\$?(\d+(?:\.\d+)?)',
        r'above\s*\$?(\d+(?:\.\d+)?)',
        r'more\s+than\s*\$?(\d+(?:\.\d+)?)',
        r'minimum\s*\$?(\d+(?:\.\d+)?)',
        r'min\s*\$?(\d+(?:\.\d+)?)',
        r'at\s+least\s*\$?(\d+(?:\.\d+)?)',
        r'starting\s+from\s*\$?(\d+(?:\.\d+)?)',
        r'greater\s+than\s*\$?(\d+(?:\.\d+)?)',
        # Dollar word patterns
        r'over\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'above\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'more\s+than\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'minimum\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'min\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'at\s+least\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'starting\s+from\s*(\d+(?:\.\d+)?)\s*dollars?',
        r'greater\s+than\s*(\d+(?:\.\d+)?)\s*dollars?',
    ]
    
    # Check for "cheaper" or "cheaper options" patterns (but not "cheaper than X")
    if re.search(r'(cheaper|cheap|budget|affordable|inexpensive)(?!\s+than\s+\$?\d)', prompt_lower):
        price_constraints['preference'] = 'cheaper'
        print(f"Aurra: Found 'cheaper' preference")
    
    # Check for "expensive" or "premium" patterns  
    if re.search(r'(expensive|premium|luxury|high.end)', prompt_lower):
        price_constraints['preference'] = 'expensive'
        print(f"Aurra: Found 'expensive' preference")
    
    # FIXED: Check range patterns first (most specific)
    range_found = False
    for pattern in range_patterns:
        match = re.search(pattern, prompt_lower)
        if match:
            min_price = float(match.group(1))
            max_price = float(match.group(2))
            price_constraints['min_price'] = min(min_price, max_price)
            price_constraints['max_price'] = max(min_price, max_price)
            print(f"Aurra: Found range pattern '{pattern}': ${price_constraints['min_price']:.2f} - ${price_constraints['max_price']:.2f}")
            range_found = True
            break
    
    # Only check under/over patterns if no range was found
    if not range_found:
        for pattern in under_patterns:
            match = re.search(pattern, prompt_lower)
            if match:
                price_constraints['max_price'] = float(match.group(1))
                print(f"Aurra: Found max price pattern '{pattern}': ${price_constraints['max_price']:.2f}")
                break
        
        for pattern in over_patterns:
            match = re.search(pattern, prompt_lower)
            if match:
                price_constraints['min_price'] = float(match.group(1))
                print(f"Aurra: Found min price pattern '{pattern}': ${price_constraints['min_price']:.2f}")
                break
    
    print(f"Aurra: Final price constraints: {price_constraints}")
    return price_constraints

def extract_category_from_prompt(prompt):
    """ENHANCED: Extract category with better combined query handling"""
    prompt_lower = prompt.lower()
    
    print(f"Aurra: Extracting category from prompt: '{prompt_lower}'")
    
    # ENHANCED: More specific category patterns with word boundaries and combined query support
    category_patterns = {
        # Specific product types (most specific first)
        'tshirt': [
            r'\bt-?shirts?\b', 
            r'\btees?\b', 
            r'\btshirts?\b',
            r'only\s+t-?shirts?\b',
            r'just\s+t-?shirts?\b',
            r't-?shirts?\s+only\b'
        ],
        'shirt': [
            r'\bshirts?\b(?!\s*sleeve)(?!.*t-?shirt)', 
            r'\bblouses?\b', 
            r'\bdress\s+shirts?\b',
            r'only\s+shirts?\b',
            r'just\s+shirts?\b',
            r'shirts?\s+only\b'
        ],
        'pants': [
            r'\bpants?\b', 
            r'\btrousers?\b', 
            r'\bjeans?\b', 
            r'\bslacks?\b',
            r'only\s+pants?\b',
            r'just\s+pants?\b',
            r'pants?\s+only\b'
        ],
        'shorts': [
            r'\bshorts?\b', 
            r'\bbermudas?\b',
            r'only\s+shorts?\b',
            r'just\s+shorts?\b',
            r'shorts?\s+only\b'
        ],
        'shoes': [
            r'\bshoes?\b', 
            r'\bsneakers?\b', 
            r'\bboots?\b', 
            r'\bloafers?\b', 
            r'\bpumps?\b', 
            r'\bheels?\b',
            r'only\s+shoes?\b',
            r'just\s+shoes?\b',
            r'shoes?\s+only\b'
        ],
        'sandals': [
            r'\bsandals?\b', 
            r'\bflip\s*flops?\b', 
            r'\bslippers?\b',
            r'only\s+sandals?\b',
            r'just\s+sandals?\b',
            r'sandals?\s+only\b'
        ],
        'footwear': [
            r'\bfootwear\b', 
            r'\bfoot\s*wear\b',
            r'only\s+footwear\b',
            r'just\s+footwear\b',
            r'footwear\s+only\b'
        ],
        'dress': [
            r'\bdresses?\b', 
            r'\bgowns?\b',
            r'only\s+dresses?\b',
            r'just\s+dresses?\b'
        ],
        'jacket': [
            r'\bjackets?\b', 
            r'\bcoats?\b', 
            r'\bblazers?\b',
            r'only\s+jackets?\b',
            r'just\s+jackets?\b'
        ],
        'accessories': [
            r'\baccessories?\b', 
            r'\bbags?\b', 
            r'\bwallet', 
            r'\bbelts?\b', 
            r'\bwatches?\b',
            r'only\s+accessories?\b',
            r'just\s+accessories?\b'
        ]
    }
    
    # Check for specific product types first (most specific)
    for category, patterns in category_patterns.items():
        for pattern in patterns:
            if re.search(pattern, prompt_lower):
                print(f"Aurra: Detected specific category '{category}' from pattern '{pattern}'")
                return category
    
    # If no specific match, check for broader category hints
    if re.search(r'\bclothing\b|\bapparel\b|\bclothes\b|\bwear\b|\boutfit', prompt_lower):
        print(f"Aurra: Detected broad category 'clothing'")
        return 'clothing'
    
    print(f"Aurra: No category detected")
    return None

def extract_color_from_prompt(prompt):
    """Extract color preferences from user prompt"""
    prompt_lower = prompt.lower()
    
    colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'purple', 'orange', 
             'brown', 'gray', 'grey', 'navy', 'maroon', 'gold', 'silver', 'beige', 'cream',
             'turquoise', 'magenta', 'cyan', 'lime', 'olive', 'coral', 'salmon', 'violet',
             'indigo', 'tan', 'khaki', 'burgundy', 'emerald', 'ruby', 'sapphire']
    
    found_colors = []
    for color in colors:
        if re.search(r'\b' + color + r'\b', prompt_lower):
            found_colors.append(color)
    
    return found_colors

def handle_question_queries(products, prompt):
    """Handle informational queries about the products"""
    prompt_lower = prompt.lower()
    
    # Count queries
    if re.search(r'how\s+many|count|number\s+of', prompt_lower):
        count = len(products)
        return {
            'type': 'info',
            'response': f"I found {count} products in your current results.",
            'products': products
        }
    
    # Price range queries
    if re.search(r'price\s+range|cheapest|most\s+expensive', prompt_lower):
        if products:
            prices = [p.get('price', 0) for p in products if p.get('price')]
            if prices:
                min_price = min(prices)
                max_price = max(prices)
                avg_price = sum(prices) / len(prices)
                return {
                    'type': 'info',
                    'response': f"Price range: ${min_price:.2f} - ${max_price:.2f} (Average: ${avg_price:.2f})",
                    'products': products
                }
    
    # Category breakdown
    if re.search(r'what\s+categories|types\s+of|categories', prompt_lower):
        categories = {}
        for product in products:
            cat = product.get('category', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        category_text = ", ".join([f"{cat}: {count}" for cat, count in categories.items()])
        return {
            'type': 'info',
            'response': f"Categories available: {category_text}",
            'products': products
        }
    
    return None

def match_product_to_category(product, target_category):
    """ENHANCED: Product matching with better accuracy"""
    if not target_category:
        return True
    
    # Get product fields for matching
    product_category = str(product.get('category', '')).lower()
    product_name = str(product.get('name', '')).lower()
    product_desc = str(product.get('description', '')).lower()
    
    # Combine all text fields for comprehensive matching
    product_text = f"{product_category} {product_name} {product_desc}".lower()
    
    print(f"Aurra: Matching product '{product.get('name', 'Unknown')[:30]}...' against category '{target_category}'")
    print(f"Aurra: Product text: '{product_text[:100]}...'")
    
    # Enhanced category matching rules
    category_rules = {
        'tshirt': {
            'must_contain': [r'\bt-?shirt\b', r'\btee\b'],
            'must_not_contain': [r'\bshirt\b(?!.*t-?shirt)'],
            'category_match': ['apparel', 'clothing'],
            'description_hints': ['tshirt', 't-shirt', 'tee']
        },
        'shirt': {
            'must_contain': [r'\bshirt\b'],
            'must_not_contain': [r'\bt-?shirt\b', r'\btee\b'],
            'category_match': ['apparel', 'clothing'],
            'description_hints': ['shirt']
        },
        'pants': {
            'must_contain': [r'\btrouser\b', r'\bpant\b', r'\bjean\b'],
            'must_not_contain': [r'\bshort\b'],
            'category_match': ['apparel', 'clothing'],
            'description_hints': ['trouser', 'pant']
        },
        'shorts': {
            'must_contain': [r'\bshort\b'],
            'must_not_contain': [],
            'category_match': ['apparel', 'clothing'],
            'description_hints': ['short']
        },
        'shoes': {
            'must_contain': [r'\bshoe\b', r'\bsneaker\b', r'\bboot\b', r'\bloafer\b'],
            'must_not_contain': [r'\bsandal\b', r'\bflip\b', r'\bslipper\b'],
            'category_match': ['footwear', 'shoes'],
            'description_hints': ['shoe', 'sneaker', 'boot']
        },
        'sandals': {
            'must_contain': [r'\bsandal\b', r'\bflip\b', r'\bslipper\b', r'\bfloater\b'],
            'must_not_contain': [],
            'category_match': ['footwear', 'shoes'],
            'description_hints': ['sandal', 'flip', 'slipper', 'floater']
        },
        'footwear': {
            'must_contain': [r'\bsandal\b', r'\bshoe\b', r'\bsneaker\b', r'\bboot\b', r'\bflip\b', r'\bslipper\b', r'\bfloater\b'],
            'must_not_contain': [],
            'category_match': ['footwear', 'shoes'],
            'description_hints': ['footwear', 'sandal', 'shoe', 'flip', 'slipper']
        }
    }
    
    # Get rules for target category
    rules = category_rules.get(target_category, {})
    
    if not rules:
        # Fallback to simple text matching
        return target_category in product_text
    
    # Check must_contain patterns
    must_contain = rules.get('must_contain', [])
    contains_required = False
    for pattern in must_contain:
        if re.search(pattern, product_text):
            contains_required = True
            print(f"Aurra: ✓ Found required pattern '{pattern}' in product")
            break
    
    if must_contain and not contains_required:
        print(f"Aurra: ✗ Product doesn't contain any required patterns: {must_contain}")
        return False
    
    # Check must_not_contain patterns
    must_not_contain = rules.get('must_not_contain', [])
    for pattern in must_not_contain:
        if re.search(pattern, product_text):
            print(f"Aurra: ✗ Product contains excluded pattern '{pattern}'")
            return False
    
    # Check category match
    category_match = rules.get('category_match', [])
    if category_match:
        category_matches = any(cat in product_category for cat in category_match)
        if not category_matches:
            print(f"Aurra: ✗ Product category '{product_category}' doesn't match required: {category_match}")
            return False
    
    print(f"Aurra: ✓ Product matches category '{target_category}'")
    return True

def refine_recommendations_advanced(products, prompt):
    """FIXED: Advanced refinement with perfect price and category filtering"""
    try:
        print(f"Aurra: Advanced refinement for prompt: '{prompt}' on {len(products)} products")
        
        # First check if it's an informational query
        info_result = handle_question_queries(products, prompt)
        if info_result:
            return info_result
        
        # Extract constraints from prompt
        price_constraints = extract_price_from_prompt(prompt)
        preferred_category = extract_category_from_prompt(prompt)
        preferred_colors = extract_color_from_prompt(prompt)
        
        print(f"Aurra: Price constraints: {price_constraints}")
        print(f"Aurra: Preferred category: {preferred_category}")
        print(f"Aurra: Preferred colors: {preferred_colors}")
        
        # Start with full product list
        refined_products = products.copy()
        original_count = len(products)
        
        # FIXED: Apply price filtering FIRST with exact constraints
        if 'min_price' in price_constraints:
            min_price = price_constraints['min_price']
            before_count = len(refined_products)
            refined_products = [p for p in refined_products if p.get('price', 0) >= min_price]
            print(f"Aurra: Applied min price ${min_price}: {before_count} → {len(refined_products)} products")
        
        if 'max_price' in price_constraints:
            max_price = price_constraints['max_price']
            before_count = len(refined_products)
            refined_products = [p for p in refined_products if p.get('price', 0) <= max_price]
            print(f"Aurra: Applied max price ${max_price}: {before_count} → {len(refined_products)} products")
        
        # Handle "cheaper options" request
        if price_constraints.get('preference') == 'cheaper':
            if products:
                all_prices = [p.get('price', 0) for p in products if p.get('price', 0) > 0]
                if all_prices:
                    median_price = sorted(all_prices)[len(all_prices) // 3]  # Lower third
                    before_count = len(refined_products)
                    refined_products = [p for p in refined_products if p.get('price', 0) <= median_price]
                    print(f"Aurra: Applied cheaper filter (under ${median_price:.2f}): {before_count} → {len(refined_products)} products")
        
        # Handle "expensive/premium" request
        elif price_constraints.get('preference') == 'expensive':
            if products:
                all_prices = [p.get('price', 0) for p in products if p.get('price', 0) > 0]
                if all_prices:
                    high_price = sorted(all_prices)[len(all_prices) * 2 // 3]  # Upper third
                    before_count = len(refined_products)
                    refined_products = [p for p in refined_products if p.get('price', 0) >= high_price]
                    print(f"Aurra: Applied expensive filter (over ${high_price:.2f}): {before_count} → {len(refined_products)} products")
        
        # Apply category filtering AFTER price filtering
        if preferred_category:
            print(f"Aurra: Applying category filter '{preferred_category}'...")
            before_count = len(refined_products)
            category_filtered = []
            
            for product in refined_products:
                if match_product_to_category(product, preferred_category):
                    category_filtered.append(product)
            
            refined_products = category_filtered
            print(f"Aurra: Applied category filter '{preferred_category}': {before_count} → {len(refined_products)} products")
            
            if len(refined_products) == 0:
                print(f"Aurra: ✗ No products found for category '{preferred_category}' with current price constraints")
                return {
                    'type': 'filtered',
                    'response': f"No {preferred_category} found in the specified price range. Try adjusting your filters or view all products.",
                    'products': []
                }
        
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
            
            if color_filtered:
                before_count = len(refined_products)
                refined_products = color_filtered
                print(f"Aurra: Applied color filter {preferred_colors}: {before_count} → {len(refined_products)} products")
        
        # Sort by price if needed
        if price_constraints.get('preference') == 'cheaper' or 'max_price' in price_constraints:
            refined_products.sort(key=lambda x: x.get('price', 0))  # Cheapest first
        elif price_constraints.get('preference') == 'expensive' or 'min_price' in price_constraints:
            refined_products.sort(key=lambda x: x.get('price', 0), reverse=True)  # Most expensive first
        
        # Limit results but keep more for better selection
        refined_products = refined_products[:20]  # Increased limit
        
        print(f"Aurra: Final refined products: {len(refined_products)} from original {original_count}")
        
        # Generate appropriate response with detailed feedback
        if len(refined_products) == 0:
            if preferred_category and price_constraints:
                return {
                    'type': 'filtered',
                    'response': f"No {preferred_category} found in the specified price range. Try adjusting your price range or category.",
                    'products': []
                }
            elif preferred_category:
                return {
                    'type': 'filtered',
                    'response': f"No {preferred_category} found in your current results. Try browsing all products or a different category.",
                    'products': []
                }
            else:
                return {
                    'type': 'filtered',
                    'response': f"No products match your criteria. Try adjusting your filters.",
                    'products': []
                }
        elif len(refined_products) < original_count:
            response_parts = []
            if preferred_category and price_constraints:
                price_range = ""
                if 'min_price' in price_constraints and 'max_price' in price_constraints:
                    price_range = f" between ${price_constraints['min_price']:.0f}-${price_constraints['max_price']:.0f}"
                elif 'min_price' in price_constraints:
                    price_range = f" above ${price_constraints['min_price']:.0f}"
                elif 'max_price' in price_constraints:
                    price_range = f" under ${price_constraints['max_price']:.0f}"
                
                response_parts.append(f"Found {len(refined_products)} {preferred_category}{price_range}")
            elif preferred_category:
                response_parts.append(f"Found {len(refined_products)} {preferred_category}")
            elif price_constraints:
                if 'min_price' in price_constraints and 'max_price' in price_constraints:
                    response_parts.append(f"Found {len(refined_products)} products between ${price_constraints['min_price']:.0f}-${price_constraints['max_price']:.0f}")
                elif 'min_price' in price_constraints:
                    response_parts.append(f"Found {len(refined_products)} products above ${price_constraints['min_price']:.0f}")
                elif 'max_price' in price_constraints:
                    response_parts.append(f"Found {len(refined_products)} products under ${price_constraints['max_price']:.0f}")
            else:
                response_parts.append(f"Found {len(refined_products)} products matching your criteria")
            
            response_parts.append(f"from {original_count} total products!")
            
            return {
                'type': 'filtered',
                'response': " ".join(response_parts),
                'products': refined_products
            }
        else:
            return {
                'type': 'no_change',
                'response': f"All {original_count} products already match your criteria!",
                'products': refined_products
            }
        
    except Exception as e:
        print(f"Aurra: Error in advanced refinement: {e}")
        traceback.print_exc()
        return {
            'type': 'error',
            'response': "I had trouble processing your request. Could you try rephrasing?",
            'products': products
        }

def make_openrouter_request(data, max_retries=MAX_RETRIES):
    """Make a request to OpenRouter with exponential backoff retry logic"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://shopsmarter.ai",
        "X-Title": "ShopSmarter AI - Aurra"
    }
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(data), timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                if attempt < max_retries:
                    delay = exponential_backoff_delay(attempt)
                    print(f"Aurra: Rate limited. Waiting {delay:.2f} seconds before retry {attempt + 1}/{max_retries}")
                    time.sleep(delay)
                    continue
                else:
                    print("Aurra: Max retries reached for rate limiting")
                    return None
            else:
                print(f"Aurra: OpenRouter API error: {response.status_code} - {response.text}")
                return None
                    
        except Exception as e:
            print(f"Aurra: Request error: {e}")
            if attempt < max_retries:
                delay = exponential_backoff_delay(attempt)
                time.sleep(delay)
                continue
            else:
                return None
    
    return None

def refine_recommendations(products, prompt):
    """Main refinement function with enhanced AI fallback"""
    try:
        print(f"Aurra: Refining {len(products)} products with prompt: '{prompt}'")
        
        # Always try advanced rule-based refinement first
        result = refine_recommendations_advanced(products, prompt)
        
        # If it's an info query or successful filtering, return immediately
        if result['type'] in ['info', 'filtered']:
            return result
        
        # For AI enhancement, try OpenRouter if rule-based didn't filter much
        if result['type'] == 'no_change' and len(products) > 3:
            try:
                context = f"""You are Aurra, ShopSmarter's AI assistant. Help filter {len(products)} products based on user request.

**Products (first 5):**
{json.dumps([{
    'id': p.get('id'),
    'name': p.get('name'),
    'price': p.get('price'),
    'category': p.get('category'),
    'description': p.get('description', '')[:100]
} for p in products[:5]], indent=2)}

**User Request:** "{prompt}"

**Instructions:**
- Return ONLY product IDs that match as JSON array: [105, 152, 278]
- For price ranges: be STRICT with constraints
- For categories: match exactly in name/description
- For "cheaper": select products below median price
- For combined filters: apply ALL constraints

Response:"""

                data = {
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": context}],
                    "max_tokens": 500,
                    "temperature": 0.1
                }

                response_data = make_openrouter_request(data, max_retries=1)
                
                if response_data:
                    response_text = response_data['choices'][0]['message']['content']
                    json_match = re.search(r'(\[[\d\s,]+\])', response_text)
                    
                    if json_match:
                        product_ids = json.loads(json_match.group(1))
                        product_dict = {int(p.get('id', 0)): p for p in products}
                        ai_refined = [product_dict[int(pid)] for pid in product_ids if int(pid) in product_dict]
                        
                        if ai_refined and len(ai_refined) < len(products):
                            print(f"Aurra: AI refinement successful: {len(ai_refined)} products")
                            return {
                                'type': 'filtered',
                                'response': f"I found {len(ai_refined)} products that match your request!",
                                'products': ai_refined
                            }
                            
            except Exception as e:
                print(f"Aurra: AI enhancement failed: {e}")
        
        # Return the rule-based result
        return result
        
    except Exception as e:
        print(f"Aurra: Error in refine_recommendations: {e}")
        traceback.print_exc()
        return {
            'type': 'error',
            'response': "I'm having trouble processing your request. Could you try again?",
            'products': products
        }
