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
        window.location.href = data.url;
    })
    .catch(error => console.error('Error:', error));
});
