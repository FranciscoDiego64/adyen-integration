require('dotenv').config();
const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios');
const morgan = require('morgan');
const path = require('path');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
})

app.use(express.json()); // Add this line
app.use(morgan('dev')); // logs requests

app.use(express.static('public'));


// Configure the client
const config = new Config();
//const apiKey = process.env.API_KEY;
//const merchantAccount = process.env.MERCHANT_ACCOUNT;
config.apiKey = process.env.API_KEY;
config.merchantAccount = process.env.MERCHANT_ACCOUNT;

const client = new Client({ config });
client.setEnvironment("TEST");

// Initialize the Checkout API
const checkout = new CheckoutAPI(client);

app.use(express.static('public'));


// test cases for different payment methods

// show payment methods:

function getPaymentMethods() {
    const paymentMethodsRequest = {
        merchantAccount: config.merchantAccount
    };
    return checkout.paymentMethods(paymentMethodsRequest)
        .then(res => res)
        .catch(error => console.error(error));
}

app.get('/paymentmethods', async (req, res) => {
    try {
        const response = await getPaymentMethods();
        res.json(response);
    } catch (error) {
        res.json({error: error.message});
    }
});

//card 

let lastResult = "";
async function testScheme() {
    try {
        const paymentResponse = await checkout.payments({
            merchantAccount: config.merchantAccount,
            paymentMethod: {
                
                type: 'scheme',
                encryptedCardNumber: "test_4111111111111111",
                encryptedExpiryMonth: "test_03",
                encryptedExpiryYear: "test_2030",
                encryptedSecurityCode: "test_737"
                
               /*
                type: 'scheme',
                encryptedCardNumber: `test_${cardDetails.cardNumber}`,
                encryptedExpiryMonth: `test_${cardDetails.expiryMonth}`,
                encryptedExpiryYear: `test_${cardDetails.expiryYear}`,
                encryptedSecurityCode: `test_${cardDetails.cvc}`,
                holderName: cardDetails.holderName
                */
               /*
                type: 'scheme',
                encryptedCardNumber: cardDetails.cardNumber,
                encryptedExpiryMonth: cardDetails.expiryMonth,
                encryptedExpiryYear: cardDetails.expiryYear,
                encryptedSecurityCode: cardDetails.cvc,
                holderName: cardDetails.holderName
                */
            },
            amount: { currency: "EUR", value: 1000 },
            reference: "orderNo1"
        });

        // Extract the resultCode from the paymentResponse
        const { resultCode, pspReference } = paymentResponse;

        // Define a message based on the resultCode
        let message;
        switch (resultCode) {
            case 'Authorised':
                message = 'Payment was successful';
                break;
            case 'Refused':
                message = 'Payment was refused';
                break;
            case 'Error':
                message = 'An error occurred during payment';
                break;
            default:
                message = 'Payment result is unknown';
                break;
        }

        // Log the message
        console.log(`Payment result: ${message}, pspReference: ${pspReference}`);
        // Save the result
        lastResult = `${message}, pspReference: ${pspReference}`;

        // Return the message and pspReference
        return lastResult;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

app.get('/testScheme', (req, res) => {
    res.send(lastResult);
});
/*
app.post('/testScheme', async (req, res) => {
    try {
        const paymentResponse = await testScheme();
        res.send(paymentResponse);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});
*/

app.post('/testScheme', async (req, res) => {
    try {
        const paymentResponse = await testScheme();
        res.send(paymentResponse);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});





// Giropay

let paymentDataStore = {};  // To store the paymentData temporarily

function testGiropay() {
    return checkout.payments({
        amount: { currency: "EUR", value: 1000 },
        paymentMethod: {
            type: 'giropay'
        },
        reference: "your_giropay_order1",
        merchantAccount: config.merchantAccount,
        returnUrl: "http://localhost:3000/handleRedirect"
    }).then(response => {
        // Post the paymentData to the /paymentsData endpoint
        axios.post('http://localhost:3000/paymentsData', { paymentData: response.paymentData });
        return response;

    });
}

// run test case

app.get('/testGiropay', async (req, res) => {
    try {
        const paymentsResponse = await testGiropay();

        // Check if there's an action object
        if (paymentsResponse.action) {
            // Redirect the customer
            res.redirect(paymentsResponse.action.url);
        } else {
            res.send(paymentsResponse);
        }
    } catch (error) {
        console.error('Giropay test error:', error);
        res.status(500).send({ error: error.message });
    }
});


//payments data for giropay

app.post('/paymentsData', (req, res) => {
    paymentDataStore = req.body.paymentData;
    res.send("Payment Data Stored Successfully");
});

app.get('/paymentsData', (req, res) => {
    res.json({ paymentData: paymentDataStore });
});


// Handle the redirect giropay
app.get('/handleRedirect', async (req, res) => {
    try {
        const redirectResult = req.query.redirectResult; 

        // Get the paymentData from the /paymentsData endpoint
        const response = await axios.get('http://localhost:3000/paymentsData');
        const paymentData = response.data.paymentData;

        const paymentDetails = await checkout.paymentsDetails({
            details: {
                redirectResult: redirectResult
            },
            paymentData: paymentData
        });

        console.log('Payment details response:\n', paymentDetails);

        const { resultCode, pspReference } = paymentDetails;

        let message;
        switch (resultCode) {
            case 'Authorised':
                message = 'Payment was successful :)';
                break;
            case 'Refused':
                message = 'Payment was refused';
                break;
            case 'Error':
                message = 'An error occurred during payment';
                break;
            default:
                message = 'Payment result is unknown';
                break;
        }

        // Append pspReference to the message
        message += ` PSP Reference: ${pspReference}`;

        res.send(message);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});


// iDEAL
function testIdeal() {
    return checkout.payments({
        amount: { currency: "EUR", value: 1000 },
        paymentMethod: {
            type: 'ideal',
            issuer: '1121'
        },
        reference: "YOUR_ORDER_NUMBER",
        merchantAccount: config.merchantAccount,
        returnUrl: "http://localhost:3000/handleIdealRedirect"
    });
}

//run test case
//no automatic redirection
app.get('/testideal', async (req, res) => {
    try {
        const paymentsResponse = await testIdeal();

        // Send the response to client
        res.send(paymentsResponse);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});

/* automatic redirect
app.get('/testideal', async (req, res) => {
    try {
        const paymentsResponse = await testIdeal();

        // Check if there's an action object in the response
        if (paymentsResponse.action) {
            // If yes, redirect the user to the URL
            res.redirect(paymentsResponse.action.url);
        } else {
            // If no action object, send the response back
            res.send(paymentsResponse);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});
*/

// Handle the redirect iDEAL

app.get('/handleIdealRedirect', async (req, res) => {
    try {
        // Extract redirectResult from the request
        const { redirectResult } = req.query;

        // Make a POST /payments/details request
        const paymentDetails = await checkout.paymentsDetails({
            details: {
                redirectResult
            }
        });

        // Log the paymentDetails response
        console.log('Payment details response:\n', paymentDetails);

        const { resultCode, pspReference } = paymentDetails;

        let message;
        switch (resultCode) {
            case 'Authorised':
                message = 'Payment was successful :)';
                break;
            case 'Refused':
                message = 'Payment was refused';
                break;
            case 'Error':
                message = 'An error occurred during payment';
                break;
            default:
                message = 'Payment result is unknown';
                break;
        }

         // Append pspReference to the message
         message += ` PSP Reference: ${pspReference}`;

         res.send(message);
 
     } catch (error) {
         console.error(error);
         res.status(500).send({ error: error.message });
     }
});

// KLARNA

async function testKlarna() {
    return checkout.payments({
        merchantAccount: config.merchantAccount,
        reference: "YOUR_ORDER_REFERENCE",
        paymentMethod: {
            type: 'klarna'
        },
        amount: {
            currency: 'SEK',
            value: 1000
        },
        shopperLocale: 'en_US',
        countryCode: 'SE',
        telephoneNumber: "+46 840 839 298",
        shopperEmail: "youremail@email.com",
        shopperName: {
            firstName: "Testperson-se",
            gender: "UNKNOWN",
            lastName: "Approved"
        },
        shopperReference: "YOUR_UNIQUE_SHOPPER_ID",
        billingAddress: {
            city: "Ankeborg",
            country: "SE",
            houseNumberOrName: "1",
            postalCode: "12345",
            street: "Stargatan"
        },
        deliveryAddress: {
            city: "Ankeborg",
            country: "SE",
            houseNumberOrName: "1",
            postalCode: "12345",
            street: "Stargatan"
        },
        returnUrl: "http://localhost:3000/handleKlarnaRedirect",
        lineItems: [
            {
                quantity: "1",
                taxPercentage: "2100",
                description: "Shoes",
                id: "Item #1",
                amountIncludingTax: "400",
                productUrl: "URL_TO_PURCHASED_ITEM",
                imageUrl: "URL_TO_PICTURE_OF_PURCHASED_ITEM"
            },
            {
                quantity: "2",
                taxPercentage: "2100",
                description: "Socks",
                id: "Item #2",
                amountIncludingTax: "300",
                productUrl: "URL_TO_PURCHASED_ITEM",
                imageUrl: "URL_TO_PICTURE_OF_PURCHASED_ITEM"
            }
        ]
    });
}

app.get('/testklarna', async (req, res) => {
    try {
        const paymentsResponse = await testKlarna();

        // Check if there's an action object in the response
        if (paymentsResponse.action) {
            // If yes, redirect the user to the URL
            res.redirect(paymentsResponse.action.url);
        } else {
            // If no action object, send the response back
            res.send(paymentsResponse);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});

app.get('/handleKlarnaRedirect', async (req, res) => {
    try {
        // Extract redirectResult from the request
        const { redirectResult } = req.query;

        // Make a POST /payments/details request
        const paymentDetails = await checkout.paymentsDetails({
            details: {
                redirectResult
            }
        });

        // Log the paymentDetails response
        console.log('Payment details response:\n', paymentDetails);

        const { resultCode, pspReference } = paymentDetails;

        let message;
        switch (resultCode) {
            case 'Authorised':
                message = 'Payment was successful :)';
                break;
            case 'Refused':
                message = 'Payment was refused';
                break;
            case 'Error':
                message = 'An error occurred during payment';
                break;
            default:
                message = 'Payment result is unknown';
                break;
        }

        // Append pspReference to the message
        message += ` PSP Reference: ${pspReference}`;

        res.send(message);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});



//Webpage routes

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/checkout.html'));
});

app.get('/envData', (req, res) => {
    // send only the necessary data, not the whole process.env
    res.send({
        merchantAccount: process.env.MERCHANT_ACCOUNT,
        apiKey: process.env.API_KEY
    });
});

app.post('/cardDetails', async (req, res) => {
    const { cardNumber, supportedBrands } = req.body;

    try {
        const response = await axios({
            method: 'post',
            url: 'https://checkout-test.adyen.com/v69/cardDetails',
            headers: {
                'X-API-key': process.env.API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                merchantAccount: process.env.MERCHANT_ACCOUNT,
                cardNumber: cardNumber,
                supportedBrands: supportedBrands
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});



app.listen(3000, () => console.log('Server listening on port 3000'));