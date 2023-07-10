# Midjourney Multi Prompt Weight Calculator

This script helps you easily create and adjust weights for multi prompts used in Midjourney, a generative artificial intelligence program that generates images from natural language descriptions (prompts). 

With the help of this calculator, you can create prompts that have a more balanced weight distribution, thereby creating more accurate images. Keep in mind, however, that additional parameters will still need to be added manually.

## Background

Midjourney generates artwork based on user-provided prompts. While you can use simple prompts to generate images, for more control over the generated image, you may want to use multi-prompts. 

Multi-prompts allow you to assign relative importance to different parts of your prompt, allowing for a more tailored image creation. You can also assign negative weights to remove unwanted elements from the generated image. However, the sum of all weights must be a positive number.

To know more about the use of prompts, multi-prompts and parameters, please refer to the [official Midjourney documentation](https://docs.midjourney.com/docs/quick-start).

## Usage

Here is an example of how to use this script:

For an image of the Swiss Alps with less houses and trees:

- Set Positive Weight to 60%
- Set Negative Weight to 40%

- Add two Positive Prompts: 
  1. "beautiful swiss alps"
  2. "landscape"

- Add two Negative Prompts:
  1. "house"
  2. "trees"

The generated multi prompt would be "beautiful swiss alps::30 landscape::30 houses::-20 trees::-20"

## Getting Started

To run this application, you need to have Python installed on your system. If you don't have Python installed, you can download it from [here](https://www.python.org/downloads/).

The `index.html` file needs to be accessed from a web server due to the use of localStorage. For local development, you can use Python's built-in HTTP server.

Navigate to the project directory and run the following command in your terminal:

For Python 3.x:

```bash
python3 -m http.server
```

For Python 2.x:

```bash
python -m SimpleHTTPServer
```

Then, open your web browser and visit `http://localhost:8000` to view the application.

## Dependencies

The application has three main files:

- `index.html`: The main HTML document.
- `styles.css`: Contains all the styles for the project.
- `main.js`: Contains the JavaScript code that powers the calculator.

You need to have all three files in the same directory for the calculator to work correctly.

## Authors

- Matt Westgate - Initial work

## Acknowledgments

- Thanks to Midjourney for creating such a versatile AI image generation tool.

Please note that this is a tool to aid in the creation of prompts for Midjourney and is not affiliated with Midjourney. For any issues related to the images created by the AI, please refer to the official Midjourney documentation and support.

## License

This project is licensed under the MIT License. For more information see `LICENSE.md`.

## Contributing

If you have any ideas on how to improve this script, feel free to fork this repository and send a pull request. Any contributions are welcome.
