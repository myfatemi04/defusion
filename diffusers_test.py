# Make sure to run `huggingface-cli login` before running this script

import torch
from torch import autocast
from diffusers import StableDiffusionPipeline
import PIL.Image
from gen_prompts import prompts
import os

model_id = "CompVis/stable-diffusion-v1-4"
device = "cpu"

pipe = StableDiffusionPipeline.from_pretrained(model_id) # , use_auth_token=True) # Only needed when first downloading
# pipe = pipe.to(device)

import sys

for prompt_id in range(int(sys.argv[1]), len(prompts)):
    os.makedirs('output/' + str(prompt_id))
    os.chdir('output/' + str(prompt_id))

    prompt = prompts[prompt_id]

    print("Generating prompt", prompt_id, "-", prompt)

    # prompt = "a photo of an astronaut riding a horse on mars"
    # prompt = "a car at a gas station in the rain at night"
    # prompt = "a horse in a field at sunrise with a rainbow in the background"
    # prompt = "an award-winning professional photo of a marmot skiing in the Alps"
    # with autocast("cuda"):
    pipe(prompt, guidance_scale=7.5)

    os.chdir('../..')

# image.save("avocado.png")

