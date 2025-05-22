from PIL import Image
import numpy as np

def preprocess_image(image_path, target_size=(224, 224)):
    """
    Preprocess image for feature extraction
    
    Args:
        image_path: Path to the image file
        target_size: Target size for resizing
        
    Returns:
        Preprocessed image path
    """
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize the image
        img = img.resize(target_size, Image.LANCZOS)
        
        # Save the preprocessed image
        preprocessed_path = f"{image_path}_preprocessed.jpg"
        img.save(preprocessed_path)
        
        return preprocessed_path
        
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return image_path
