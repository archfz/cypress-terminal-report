const express = require('express');
const app = express();

app.get('/v3/4b2d23ec-4516-4a94-967e-995596d01a32', (req, res) => {
  res.status(500).send('Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.');
})

app.post('/v3/57a00707-bccf-4653-ac50-ba1c00cad431', (req, res) => {
  res.status(400).send({
    "status": "Wrong!",
    "data": {
      "corpo": "corpo da resposta",
      "titulo": "titulo da resposta"
    }
  })
})

app.listen(3015);
console.log('Mock server listening on port 3000');
