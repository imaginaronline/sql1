const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const ejs = require("ejs");
const axios = require('axios');


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.get("/dashboard", (req, res) => {
  const query = `SELECT * FROM userdata`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }

    res.render("dashboard", { data: rows });
  });
});

// Create a new database connection
const db = new sqlite3.Database('userdata.db');

// Create the user_data table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS userdata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  mobile TEXT,
  email TEXT,
  pincode TEXT,
  state TEXT,
  batch_id INTEGER
)`);

let submissionCount = 0;
let currentBatchId = null;

// Fetch the maximum batch_id from the database on server startup
db.get('SELECT MAX(batch_id) AS max_batch_id FROM userdata', (err, row) => {
  if (err) {
    console.error('Error retrieving max batch_id:', err);
  } else {
    currentBatchId = row.max_batch_id || 0;
    console.log('Current batch_id:', currentBatchId);
  }
});

app.get('/submit', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Set up the route for submitting the form data
app.post('/submit', (req, res) => {
  // Extract the form submission data from the request body
  const { name, mobile, email, pincode, state } = req.body;

  submissionCount++;

  // Calculate the batch ID
  const batchId = Math.ceil(submissionCount / 3);

  db.run(
    `INSERT INTO userdata (name, mobile, email, pincode, state, batch_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, mobile, email, pincode, state, batchId],
    (err) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).send('Error inserting data');
      } else {
        console.log('Data inserted successfully.');

        if (submissionCount % 3 === 0) {
          currentBatchId = batchId; // Set the current batch ID
          res.sendFile(__dirname + '/success.html');

          console.log(currentBatchId);

          // Retrieve the last three form submissions with the common batch ID
          const query = `SELECT * FROM userdata WHERE batch_id = ? ORDER BY id DESC LIMIT 3`;
          db.all(query, [currentBatchId], (err, rows) => {
            if (err) {
              console.error(err);
            } else {
              const jsonData = JSON.stringify(rows);
              console.log(jsonData);
              
            }
          });
          
        } else {
          currentBatchId = batchId; // Set the current batch ID
          res.sendFile(__dirname + '/success.html'); 
           
          axios.post('http://localhost:20000/api/create-data-token', {
          UserID: 'details',
          UserInfo: 'names',
          CommitterDID: '577867hfegdfyg',
          BacthID: 1,
          FileInfo: { id: 376, name: 'akshaya', mobile: '465555', email: 'akshaya@gmail.com', pincode: '50081', state: 'mars', batch_id: 1 }
                    }, {
          headers: {
                   'accept': 'multipart/form-data',
                   'Content-Type': 'multipart/form-data'
                   }
                   })
  .then(response => {
    // Handle the API response here
    console.log(response.data);
    console.log(success)
                    })
  .catch(error => {
    // Handle any errors that occur during the API call
    console.error(error);
  });

           // Redirect to the form page for the next submission
        }
      }
    }
  );

  // Update the current batch ID in the database
  db.run('UPDATE userdata SET batch_id = ?', [currentBatchId], (err) => {
    if (err) {
      console.error('Error updating batch_id:', err);
    }
  });
});

// Endpoint to convert SQL data to JSON
app.get('/json', (req, res) => {
  // Query to retrieve the data from the database
  const query = 'SELECT * FROM userdata';

  // Execute the query
  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    // Convert the data to JSON format
    const jsonData = JSON.stringify(rows);

    // Send the JSON response
    res.json(jsonData);
  });
});


app.listen(process.env.PORT || 3000 , () => {
  console.log(`Server is running on port ${port}`);
});

