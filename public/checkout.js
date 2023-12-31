document.addEventListener('DOMContentLoaded', async () => {
    // Get available payment methods from the server
    const response = await fetch('http://localhost:3000/paymentmethods', { method: 'GET' });
    const data = await response.json();
    const paymentMethods = data.paymentMethods;

    // Generate list elements for each available payment method
    paymentMethods.forEach(paymentMethod => {
        const listItem = document.createElement('li');
        listItem.innerText = paymentMethod.type;
        listItem.classList.add('list-group-item'); // Add 'list-group-item' class
        listItem.classList.add('list-group-item-action'); // Add 'list-group-item-action' class
        listItem.addEventListener('click', () => {
            initiatePayment(paymentMethod.type);
        });
        document.getElementById('payment-methods').appendChild(listItem);
    });
});

function initiatePayment(paymentMethodType) {
    // Define the base URL
    const baseURL = 'http://localhost:3000/';

    // Map the payment method types to their respective endpoints
    const endpoints = {
        'scheme': 'cardDetails.html',
        'giropay': 'testgiropay',
        'ideal': 'selectIssuer.html',
        'klarna': 'testklarna'
    };

    // Redirect to the corresponding endpoint
    window.location.href = baseURL + endpoints[paymentMethodType];
}
