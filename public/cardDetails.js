document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('submit-card-details').addEventListener('click', function () {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryMonth = document.getElementById('expiryMonth').value;
        const expiryYear = document.getElementById('expiryYear').value;
        const cvc = document.getElementById('cvc').value;
        const holderName = document.getElementById('holderName').value;

        fetch('http://localhost:3000/testScheme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                /*
                cardNumber: `test_${cardNumber}`,
                expiryMonth: `test_${expiryMonth}`,
                expiryYear: `test_${expiryYear}`,
                cvc: `test_${cvc}`,
                holderName: holderName
                
               /*
                cardNumber: cardNumber,
                expiryMonth: expiryMonth,
                expiryYear: expiryYear,
                cvc: cvc,
                holderName: holderName
                */
                
            })
        })
        .then(response => response.text()) // Updated this line
        .then(data => {
            console.log(data);
            // Save the response message (payment status) in localStorage
            localStorage.setItem('paymentStatus', JSON.stringify(data));
            window.location.href = '/paymentStatus.html';  // Redirect to the paymentStatus page
        })
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('cardNumber').addEventListener('input', (e) => {
        const cardNumber = e.target.value;
    
        if (cardNumber.length >= 6) {
            const formattedCardNumber = cardNumber.replace(/\D/g, '');

            fetch('http://localhost:3000/cardDetails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    merchantAccount: 'AdyenRecruitmentCOM',
                    cardNumber: formattedCardNumber,
                    supportedBrands: ['visa', 'mc', 'amex']
                })
            })
            .then(response => response.text())
            .then(data => {
                console.log(data);
            })
            .catch(error => console.error('Error:', error));
        }
    });
});
