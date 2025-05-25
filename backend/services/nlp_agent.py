import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyBVCjp6cbCEuzWaJB81XHT2afHvX_6bAVI"))

def refine_recommendations(products, prompt):
    """
    Refine product recommendations based on user prompt
    
    Args:
        products: List of product dictionaries
        prompt: User's text prompt for refinement
        
    Returns:
        Refined list of product dictionaries
    """
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create a context for the model
        context = f"""
        I have a list of product recommendations:
        {products}
        
        The user has provided the following prompt to refine these results:
        "{prompt}"
        
        Based on this prompt, filter and reorder the products to best match the user's request.
        Return only the product IDs in order of relevance as a JSON array.
        """
        
        # Generate content
        response = model.generate_content(context)
        
        # Extract the response
        import json
        import re
        
        # Find JSON content between triple backticks if present
        json_match = re.search(r'``````', response.text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Otherwise try to find anything that looks like a JSON array
            json_str = re.search(r'(\[.*\])', response.text, re.DOTALL).group(1)
        
        # Parse the JSON
        product_ids = json.loads(json_str)
        
        # Filter and reorder products based on the returned IDs
        product_dict = {product['id']: product for product in products}
        refined_products = [product_dict[product_id] for product_id in product_ids if product_id in product_dict]
        
        return refined_products
        
    except Exception as e:
        print(f"Error refining recommendations: {e}")
        # Return original products if refinement fails
        return products
