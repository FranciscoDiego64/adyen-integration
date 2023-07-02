// paymentStatus.js
window.onload = function() {
    // Retrieve the payment status from localStorage
    const paymentStatus = JSON.parse(localStorage.getItem('paymentStatus'));

    if (paymentStatus) {
        document.getElementById('message').innerHTML = paymentStatus;
        // Clear the payment status from localStorage
        localStorage.removeItem('paymentStatus');
    } else {
        document.getElementById('message').innerHTML = 'Payment status is not available';
    }
};
