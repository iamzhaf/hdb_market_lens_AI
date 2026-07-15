import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import json

load_dotenv()

api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
if not api_key:
    raise ValueError("No API key found")

client = genai.Client(api_key=api_key)

system_prompt = ("You are an expert infographic and creating consultant-like presentations for professionals. "
    "You create visually appealing, simple,"
    "and easy-to-understand presentation slides/images for topics."
    "Style: Professional, clean, modern, high-quality graphics, clear labels, correct spelling and no clutter.")


def call_gemini_image_generator_model(image_generator_prompt,model='gemini-3.1-flash-image'):

        try:
            response = client.models.generate_content(
            model=model,
            contents=image_generator_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio="9:16",
            )))

            return response 

        except Exception as e:
            # Show error
            print(e)
            return None
    

def save_image(response,image_name):

    for part in response.parts:
        if part.inline_data:
            generated_image = part.as_image()
            generated_image.save(f"{image_name}.png")
            return True

    return False


def generate_image(prompt):

    if prompt.get("image_name") and prompt.get("prompt"):
        image_name = prompt["image_name"]
        prompt = prompt["prompt"]
    else:
        raise ValueError("Invalid prompt format")

    image_response = call_gemini_image_generator_model(prompt)

    # save image
    success = save_image(image_response,image_name)
    if not success:
        print("Failed to save image")
        return None
    
    print(f"Image saved successfully as {image_name}.png")
    return image_name


def generate_prompt_for_image(prompt,model='gemini-3.1-flash-lite'):
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config = types.GenerateContentConfig(
            system_instruction = """
            You are an expert in generating prompts for image generation, 
            you job is to take user's ask and generate detailed prompt in bullet points. Use the example output as reference. No need to provide aspet ratio. 
            Provide the image a name for the output file. Store the output file in JSON format with name 'image_name' key.
            
            Example Output:
            {
                "image_name": "image_name",
                "prompt": ""
            }
            Create image to illustrate for users to understand the concept of curse of dimensionality and 
            how it affects the performance of K-NN where infinite number of dimensions cause the idea of nearest neighbour to be meaningless, 
            show it with visuals with data points. 
            Explain the concept step by step and 
            illustrate using unit-hypercubes and unit-hyperspheres in 2d, 3d then in n-d space. 
            Use simple wording, show the math and visual metaphors.
            Also show real-world examples of curse of dimensionality in embedding spaces in LLMs. 
            Provide examples of mitigations.
            """,
            response_mime_type = "application/json"
    ))

    # prints output from gemini
    for chunk in response.parts:
        print(chunk.text,end="\n")

    # parse json
    image_prompt_json = json.loads(response.text.strip())

    return image_prompt_json
    
    

if __name__ == "__main__":
    image_prompt = generate_prompt_for_image("""I would like to understand async/await in JS. Use starbuck coffee shop analogy to explain the concepts.
    
    - first show synchronous code and explain that it blocks the event loop.
    - then show async/await code and explain that it does not block the event loop.
    - show code examples of async/await in JS.
    - explain event loop with diagram.
    - show how async/await works with event loop.
    
    """)
    print(type(image_prompt))
    generate_image(image_prompt)
    