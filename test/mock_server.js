import express from "express"
import cors from "cors"

const app = express();

app.use(cors({
  origin: '*'
}));

app.get('/v3/4b2d23ec-4516-4a94-967e-995596d01a32', (req, res) => {
  res.status(500).send('Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.');
})

const handle57 = (status) => (req, res) => {
  res.status(status).send({
    "status": "Wrong!",
    "data": {
      "corpo": "corpo da resposta",
      "titulo": "titulo da resposta"
    }
  })
};
app.post('/v3/57a00707-bccf-4653-ac50-ba1c00cad431', handle57(400))
app.get('/v3/57a00707-bccf-4653-ac50-ba1c00cad431', handle57(200))

app.listen(3015);
console.log('Mock server listening on port 3015');
