import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: 'Rohithbr5@',
  port: 5432, // Default port for PostgreSQL
});

db.connect();

// Function to get countries
async function getCountries() {
  try {
    const res = await db.query("SELECT * FROM visited_countries");
    const countries = res.rows.map(row => row.country_code); 
    return countries;
  } catch (err) {
    console.error("Error executing query", err.stack);

    throw err;
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const countries = await getCountries();
    res.render("index.ejs", { error: null, countries: countries, total: countries.length });
  } catch (error) {
    res.render("index.ejs", { error: "Error fetching countries", countries: [], total: 0 });
  }
});

app.post("/add", (req, res) => {
  const countryCodeInput = req.body.country;

  const queryone = "SELECT country_code FROM world_countries WHERE LOWER(country_name) LIKE '%'|| $1 || '%';";

  db.query(queryone, [countryCodeInput], (err, dbRes) => {
    if (err) {
      console.error('Error executing query', err.stack);
      res.status(500).send('Error executing query');
    } else {
      if (dbRes.rows.length > 0) {
        const countryName = dbRes.rows[0].country_code;

        const insertQuery = `
          INSERT INTO visited_countries (country_code)
          VALUES ($1)`;

        db.query(insertQuery, [countryName], (err, dbRes) => {
          if (err) {
            if (err.code === '23505') { // Duplicate key error code
              res.status(409).send('Country already visited');
            } else {
              console.error('Error executing insert query', err.stack);
              res.status(500).send('Error inserting data');
            }
          } else {
            console.log('Inserted:', dbRes);
            res.redirect("/"); // Redirect to the main page after insertion
          }
        });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
