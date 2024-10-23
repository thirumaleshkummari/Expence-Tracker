const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'expense-tracker.db')


let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

     // Create `user` table
     await db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        gender TEXT
      );
    `);

    // Create `transactions` table
    await db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        category TEXT,
        amount REAL,
        date TEXT,
        description TEXT,
        FOREIGN KEY (user_id) REFERENCES user(id)
      );
    `);

    // Create `categories` table
    await db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        type TEXT
      );
    `);

    app.listen(3000, () => {
      console.log('Server is Running At http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']

  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

app.post('/register/', async (request, response) => {
  try {
    const {username, password, name, gender} = request.body
    const hashedPassword = await bcrypt.hash(request.body.password, 10)
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
    const dbUser = await db.get(selectUserQuery)
    
    if (dbUser === undefined) {
      const createUserQuery = `
      INSERT INTO 
        user (username, password, name, gender) 
      VALUES 
        (
          '${username}', 
          '${hashedPassword}', 
          '${name}',
          '${gender}'
          
        );`

      if (password.length < 6) {
        response.status(400)
        response.send('Password is too short')
      } else {
        await db.run(createUserQuery)
        response.send('User created successfully')
      }
    } else {
      response.status(400)
      response.send('User already exists')
    }
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.get("/sample", async(request, response) => {
  response.send("server is successfully running")
})

//Add a new transaction

app.post('/transactions', (req, res) => {
  const { type, category, amount, date, description } = req.body;
  const sql = `INSERT INTO transactions (type, category, amount, date, description) VALUES ${type, category, amount, date, description}`;
  db.run(sql, [type, category, amount, date, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

//Retrieve all transactions

app.get('/transactions', (req, res) => {
  const sql = 'SELECT * FROM transactions';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ transactions: rows });
  });
});

//Retrieve a transaction by ID

app.get('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM transactions WHERE id = ${id}`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

//Update a transaction

app.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;
  const sql = `UPDATE transactions SET type = ${type}, category = ${category}, amount = ${amount}, date = ${date}, description = ${description} WHERE id = ${id}`;
  db.run(sql, [type, category, amount, date, description, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Transaction updated', changes: this.changes });
  });
});

//Delete a transaction

app.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM transactions WHERE id = ${id}`;
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Transaction deleted', changes: this.changes });
  });
});


//Get a summary of transactions

app.get('/summary', (req, res) => {
  const { startDate, endDate, category } = req.query;
  let sql = 'SELECT type, SUM(amount) as total FROM transactions WHERE 1 = 1';
  const params = [];

  if (startDate) {
    sql += ` AND date >= ?${startDate}`;
    params.push(startDate);
  }
  if (endDate) {
    sql += `AND date <= ${endDate}`;
    params.push(endDate);
  }
  if (category) {
    sql += ` AND category = ${category}`;
    params.push(category);
  }

  sql += ' GROUP BY type';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const summary = rows.reduce(
      (acc, row) => {
        acc[row.type] = row.total;
        return acc;
      },
      { income: 0, expense: 0 }
    );
    summary.balance = summary.income - summary.expense;
    res.json(summary);
  });
});


