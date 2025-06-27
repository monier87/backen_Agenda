require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');

const app = express();

app.use(cors());
app.use(express.json()); // Para parsear JSON en el body
app.use(morgan('tiny'));

// Ruta principal
app.get('/', (req, res) => {
  res.send('<h1>Phonebook API</h1>');
});

// Obtener todas las personas
app.get('/api/persons', (req, res, next) => {
  Person.find({})
    .then(persons => res.json(persons))
    .catch(next);
});

// Obtener información de una persona específica por id
app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) res.json(person);
      else res.status(404).end();
    })
    .catch(next);
});

// Eliminar una persona por id
app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
    .catch(next);
});

// Añadir nueva persona
app.post('/api/persons', (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({ error: 'name or number is missing' });
  }

  const person = new Person({ name, number });

  person.save()
    .then(savedPerson => res.json(savedPerson))
    .catch(error => {
      if (error.name === 'MongoServerError' && error.code === 11000) {
        res.status(400).json({ error: 'name must be unique' });
      } else {
        next(error);
      }
    });
});

// Ruta para información general
app.get('/info', (req, res, next) => {
  Person.countDocuments({})
    .then(count => {
      res.send(`
        <p>Phonebook has info for ${count} people</p>
        <p>${new Date()}</p>
      `);
    })
    .catch(next);
});

// Middleware para manejar errores de JSON inválido
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Middleware para manejar errores de formato de ID
app.use((error, req, res, next) => {
  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' });
  }
  next(error);
});

module.exports = app;
