# Adyen Integration Project

This project demonstrates how to integrate with the Adyen payments platform. It's built with Node.js and uses the Adyen Node.js API library for interaction with Adyen's services.

## Features

- A simple shopping cart to demonstrate the checkout process.
- A mock form to enter card details and process a payment. Raw card data won't work since it requires additional permissions from Adyen.
- Payment processing via Adyen using the `giropay` method.
- Payment processing via Adyen using the `iDEAL` method.
- Payment processing via Adyen using the `klarna` method.

## Getting Started

1. **Clone the repository** - `git clone https://github.com/FranciscoDiego64/adyen-integration.git`
2. **Install the dependencies** - `npm install`
3. **Start the application** - `npm start`

The application runs on `localhost:3000` by default.

## Testing the Application

To test the various payment methods, simply choose any of the options mentioned in the list. Please note that the remaining payment methods do not have any actual functionality; they are solely displayed to demonstrate the use of the `/paymentmethods` call.

The responses and any error messages will be logged in the console and the confirmation page.

## Dependencies

This project uses the following dependencies:

- `express` - For setting up the server and handling HTTP requests.
- `axios` - For making HTTP requests to the Adyen API.
- `Adyen API` - For interaction with Adyen's services.

## Project Structure

- The root directory contains the main server file `index.js`
- The `public` directory contains the front-end files, including HTML and JS files.

## Contributing

We welcome contributions to this project. Please feel free to submit issues and pull requests.

## Contact

If you have any questions or comments about this project, please feel free to contact me.
