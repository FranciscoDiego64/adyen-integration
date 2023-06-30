require('dotenv').config();
const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const express = require('express');
const app = express();
const axios = require('axios');
const morgan = require('morgan');

app.use(express.json()); // Add this line
app.use(morgan('dev')); // logs requests

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

// test cases for different payment methods

//card 
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

        // Log the message and return it along with the pspReference
        console.log(`Payment result: ${message}, pspReference: ${pspReference}`);
        return ` ${message}, pspReference: ${pspReference}`;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


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



// Run the test cases when the API calls are made
app.get('/testScheme', async (req, res) => {
    try {
        const result = await testScheme();
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});


app.get('/testGiropay', (req, res) => {
    testGiropay()
        .then(result => {
            console.log('Giropay test result:', result);
            res.send(result);
        })
        .catch(err => {
            console.error('Giropay test error:', err);
            res.status(500).send(err);
        });
});

//iDEAL

app.get('/testideal', async (req, res) => {
    try {
        const paymentsResponse = await checkout.payments({
            amount: { currency: "EUR", value: 1000 },
            paymentMethod: {
                type: 'ideal',
                issuer: '1121' //replace with a valid issuer
            },
            reference: "YOUR_ORDER_NUMBER",
            merchantAccount: config.merchantAccount,
            returnUrl: "http://localhost:3000/handleIdealRedirect"
        });

        // Send the response to client
        res.send(paymentsResponse);
    } catch (error) {
        console.error(error);
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


// Handle the redirect
app.get('/handleRedirect', (req, res) => {
    const redirectResult = req.query.redirectResult; 

    // Get the paymentData from the /paymentsData endpoint
    axios.get('http://localhost:3000/paymentsData')
    .then(response => {
        const paymentData = response.data.paymentData;

        checkout.paymentsDetails({
            details: {
                redirectResult: redirectResult
            },
            paymentData: paymentData
        }).then(result => {
            console.log(result);
            res.send("Payment completed. Check console for result.");
        }).catch(err => {
            console.error(err);
            res.send("Error occurred. Check console for details.");
        });
    });
});

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

        const { resultCode } = paymentDetails;

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

        res.send(message);

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
});


app.get('/', (req, res) => {
    res.send('It works!');
});


app.listen(3000, () => console.log('Server listening on port 3000'));