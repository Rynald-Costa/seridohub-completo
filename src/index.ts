// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';

const app = express();

app.use(cors()); // em dev, libera tudo; se quiser, depois restringe
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// opcional: servir o frontend pela API
app.use(
  express.static(path.join(__dirname, '../frontend'), {
    extensions: ['html'],
  })
);

// rotas da API
app.use('/api', routes);

// home -> index.html do frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
