document.getElementById('issuer-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const issuer = document.getElementById('issuer').value;

    fetch('http://localhost:3000/testideal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            issuer: issuer
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // If there's an error message in the response, display it
            alert(data.error);
        } else {
            // If there's no error, redirect to the URL
            window.location.href = data.url;
        }
    })
    .catch(error => console.error('Error:', error));
});
