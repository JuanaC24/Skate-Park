const express = require('express');
const { engine } = require('express-handlebars');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.engine('handlebars', engine({
  defaultLayout: 'main',
  helpers: {
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&': return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||': return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    }
  }
}));
app.set('view engine', 'handlebars');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skaters');
    res.render('index', { skaters: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al recuperar los datos de los skaters');
  }
});

app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skaters');
    res.render('admin', { skaters: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/datos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Datos.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Registro.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});

app.post('/api/skaters', async (req, res) => {
  const { email, nombre, password, anos_experiencia, especialidad, estado } = req.body;
  
  let fotoPath = '';
  if (req.files && req.files.foto) {
    const foto = req.files.foto;
    fotoPath = `/uploads/${foto.name}`;
    const uploadPath = path.join(__dirname, 'public', fotoPath);
    await foto.mv(uploadPath, (err) => {
      if (err) {
        console.error('Error al subir la foto:', err);
        return res.status(500).send('Error al subir la foto');
      }
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [email, nombre, hashedPassword, anos_experiencia, especialidad, fotoPath, estado === 'Aprobado']
    );
    io.emit('nuevoSkater', result.rows[0]); // Emitir evento de nuevo skater
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar el skater');
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM skaters WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    const skater = result.rows[0];
    const isMatch = await bcrypt.compare(password, skater.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ email: skater.email, id: skater.id, isAdmin: skater.is_admin }, secretKey, { expiresIn: '1h' });

    // Redirigir al frontend dependiendo del rol del usuario
    if (skater.is_admin) {
      return res.json({ token, redirectTo: '/admin' });
    } else {
      return res.json({ token, redirectTo: '/datos' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Acceso denegado' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Failed to verify token:', err.message);
    res.status(403).json({ message: 'Token inválido' });
  }
}

app.get('/api/protected', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skaters WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener datos del usuario');
  }
});

app.put('/api/skaters/email/:email', authenticateToken, async (req, res) => {
  const { email } = req.params;
  const { nombre, anos_experiencia, especialidad, estado, newPassword } = req.body;

  let hashedPassword = null;
  if (newPassword) {
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (err) {
      console.error('Error al encriptar la contraseña:', err);
      return res.status(500).send('Error al encriptar la contraseña');
    }
  }

  try {
    const updateQuery = `
      UPDATE skaters
      SET nombre = $1, password = COALESCE($2, password), anos_experiencia = $3, especialidad = $4, estado = $5
      WHERE email = $6
      RETURNING *;
    `;
    const values = [nombre, hashedPassword, anos_experiencia, especialidad, estado, email];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontró el skater con el email proporcionado." });
    }

    io.emit('skaterActualizado', result.rows[0]); // Emitir evento de actualización de skater
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar el skater:', err);
    res.status(500).send('Error al actualizar el skater');
  }
});

app.delete('/api/skaters/email/:email', authenticateToken, async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('DELETE FROM skaters WHERE email = $1 RETURNING *', [email]);
    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    io.emit('skaterEliminado', { email }); // Emitir evento de eliminación de skater
    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar el skater:', err);
    res.status(500).send('Error al eliminar el skater');
  }
});

server.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
